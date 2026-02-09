import { db } from "../db";
import { aiServiceConfigs } from "../db/schema";
import { eq } from "drizzle-orm";
import { encryptApiKey, decryptApiKeyFromFields, maskApiKey } from "../utils/encryption";
import jwt from "jsonwebtoken";

// Helper to get Google access token from service account credentials JSON
async function getGoogleAccessToken(credentialsJson: string): Promise<string> {
  const credentials = JSON.parse(credentialsJson);

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const token = jwt.sign(payload, credentials.private_key, { algorithm: "RS256" });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Service key constants
export const AI_SERVICES = {
  GOOGLE_GEMINI: "google_gemini",
  GOOGLE_VERTEX: "google_vertex",
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GROK: "grok",
  WAVESPEED: "wavespeed",
} as const;

export type AiServiceKey = (typeof AI_SERVICES)[keyof typeof AI_SERVICES];

// Default configurations for each service
export const DEFAULT_SERVICE_CONFIGS: Record<AiServiceKey, {
  displayName: string;
  defaultModel: string;
  availableModels: string[];
  endpointUrl: string;
}> = {
  [AI_SERVICES.GOOGLE_GEMINI]: {
    displayName: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    availableModels: [
      // Gemini 3 Series (Latest)
      "gemini-3-flash-preview",
      "gemini-3-pro-preview",
      "gemini-3-pro-image-preview",
      // Gemini 2.5 Series
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash-image",
      "gemini-2.5-pro",
      // Gemini 2.0 Series
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      // Legacy
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    endpointUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
  [AI_SERVICES.GOOGLE_VERTEX]: {
    displayName: "Google Vertex AI",
    defaultModel: "imagen-3.0-generate-002",
    availableModels: [
      // Imagen 3 (Image Generation)
      "imagen-3.0-generate-002",
      "imagen-3.0-generate-001",
      "imagen-3.0-fast-generate-001",
      // Imagen 3 (Image Editing)
      "imagen-3.0-capability-001",
      // Gemini on Vertex
      "gemini-2.0-flash-001",
      "gemini-1.5-pro-002",
      "gemini-1.5-flash-002",
      // Nano Banana Pro (Custom/Preview)
      "nano-banana-pro",
    ],
    endpointUrl: "https://us-central1-aiplatform.googleapis.com/v1",
  },
  [AI_SERVICES.OPENAI]: {
    displayName: "OpenAI",
    defaultModel: "gpt-4o",
    availableModels: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "o1-preview",
      "o1-mini",
    ],
    endpointUrl: "https://api.openai.com/v1",
  },
  [AI_SERVICES.ANTHROPIC]: {
    displayName: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
    availableModels: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
    endpointUrl: "https://api.anthropic.com/v1",
  },
  [AI_SERVICES.GROK]: {
    displayName: "xAI Grok",
    defaultModel: "grok-beta",
    availableModels: [
      "grok-beta",
      "grok-vision-beta",
    ],
    endpointUrl: "https://api.x.ai/v1",
  },
  [AI_SERVICES.WAVESPEED]: {
    displayName: "WaveSpeed AI",
    defaultModel: "wavespeed-ai/qwen-image-max/edit",
    availableModels: [
      "wavespeed-ai/qwen-image-max/edit",
    ],
    endpointUrl: "https://api.wavespeed.ai/api/v3",
  },
};

export interface ServiceConfigDisplay {
  serviceKey: string;
  displayName: string;
  modelName: string;
  availableModels: string[];
  endpointUrl: string | null;
  defaultEndpointUrl: string;
  isEnabled: boolean;
  hasApiKey: boolean;
  apiKeyMasked: string;
  hasCredentialsJson: boolean;
  credentialsJsonMasked: string;
  projectId: string | null;
  region: string | null;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
  sourceType: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  responseTime?: number;
  details?: string;
  modelUsed?: string;
}

// Get all service configs (merged with defaults)
export async function getAllServiceConfigs(): Promise<ServiceConfigDisplay[]> {
  const dbConfigs = await db.select().from(aiServiceConfigs);
  const configMap = new Map(dbConfigs.map(c => [c.serviceKey, c]));

  const result: ServiceConfigDisplay[] = [];

  for (const [serviceKey, defaults] of Object.entries(DEFAULT_SERVICE_CONFIGS)) {
    const dbConfig = configMap.get(serviceKey);

    if (dbConfig) {
      const hasApiKey = !!(dbConfig.apiKeyEncrypted && dbConfig.apiKeyIv && dbConfig.apiKeyAuthTag);
      let apiKeyMasked = "(not configured)";
      if (hasApiKey) {
        const decrypted = decryptApiKeyFromFields(
          dbConfig.apiKeyEncrypted,
          dbConfig.apiKeyIv,
          dbConfig.apiKeyAuthTag
        );
        apiKeyMasked = maskApiKey(decrypted);
      }

      const hasCredentialsJson = !!(dbConfig.credentialsJsonEncrypted && dbConfig.credentialsJsonIv && dbConfig.credentialsJsonAuthTag);
      let credentialsJsonMasked = "(not configured)";
      if (hasCredentialsJson) {
        credentialsJsonMasked = "***configured***";
      }

      result.push({
        serviceKey,
        displayName: defaults.displayName,
        modelName: dbConfig.modelName,
        availableModels: defaults.availableModels,
        endpointUrl: dbConfig.endpointUrl,
        defaultEndpointUrl: defaults.endpointUrl,
        isEnabled: dbConfig.isEnabled,
        hasApiKey,
        apiKeyMasked,
        hasCredentialsJson,
        credentialsJsonMasked,
        projectId: dbConfig.projectId,
        region: dbConfig.region,
        lastTestedAt: dbConfig.lastTestedAt,
        lastTestStatus: dbConfig.lastTestStatus,
        sourceType: dbConfig.sourceType,
      });
    } else {
      // No DB config, use defaults
      result.push({
        serviceKey,
        displayName: defaults.displayName,
        modelName: defaults.defaultModel,
        availableModels: defaults.availableModels,
        endpointUrl: null,
        defaultEndpointUrl: defaults.endpointUrl,
        isEnabled: false,
        hasApiKey: false,
        apiKeyMasked: "(not configured)",
        hasCredentialsJson: false,
        credentialsJsonMasked: "(not configured)",
        projectId: null,
        region: null,
        lastTestedAt: null,
        lastTestStatus: null,
        sourceType: "local",
      });
    }
  }

  return result;
}

// Get a single service config with decrypted API key (for internal use)
export async function getServiceConfigWithApiKey(serviceKey: string): Promise<{
  modelName: string;
  apiKey: string | null;
  credentialsJson: string | null;
  projectId: string | null;
  region: string | null;
  endpointUrl: string;
  isEnabled: boolean;
} | null> {
  const defaults = DEFAULT_SERVICE_CONFIGS[serviceKey as AiServiceKey];
  if (!defaults) return null;

  const [dbConfig] = await db.select().from(aiServiceConfigs).where(eq(aiServiceConfigs.serviceKey, serviceKey));

  if (!dbConfig) {
    return {
      modelName: defaults.defaultModel,
      apiKey: null,
      credentialsJson: null,
      projectId: null,
      region: null,
      endpointUrl: defaults.endpointUrl,
      isEnabled: false,
    };
  }

  const apiKey = decryptApiKeyFromFields(
    dbConfig.apiKeyEncrypted,
    dbConfig.apiKeyIv,
    dbConfig.apiKeyAuthTag
  );

  const credentialsJson = decryptApiKeyFromFields(
    dbConfig.credentialsJsonEncrypted,
    dbConfig.credentialsJsonIv,
    dbConfig.credentialsJsonAuthTag
  );

  return {
    modelName: dbConfig.modelName,
    apiKey,
    credentialsJson,
    projectId: dbConfig.projectId,
    region: dbConfig.region,
    endpointUrl: dbConfig.endpointUrl || defaults.endpointUrl,
    isEnabled: dbConfig.isEnabled,
  };
}

// Update service config
export async function updateServiceConfig(
  serviceKey: string,
  updates: {
    modelName?: string;
    apiKey?: string;
    credentialsJson?: string;
    projectId?: string | null;
    region?: string | null;
    endpointUrl?: string | null;
    isEnabled?: boolean;
  }
): Promise<ServiceConfigDisplay | null> {
  const defaults = DEFAULT_SERVICE_CONFIGS[serviceKey as AiServiceKey];
  if (!defaults) return null;

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (updates.modelName !== undefined) {
    updateData.modelName = updates.modelName;
  }
  if (updates.endpointUrl !== undefined) {
    updateData.endpointUrl = updates.endpointUrl || null;
  }
  if (updates.isEnabled !== undefined) {
    updateData.isEnabled = updates.isEnabled;
  }
  if (updates.projectId !== undefined) {
    updateData.projectId = updates.projectId || null;
  }
  if (updates.region !== undefined) {
    updateData.region = updates.region || null;
  }
  if (updates.apiKey !== undefined && updates.apiKey !== "") {
    const encrypted = encryptApiKey(updates.apiKey);
    updateData.apiKeyEncrypted = encrypted.encrypted;
    updateData.apiKeyIv = encrypted.iv;
    updateData.apiKeyAuthTag = encrypted.authTag;
  }
  if (updates.credentialsJson !== undefined && updates.credentialsJson !== "") {
    const encrypted = encryptApiKey(updates.credentialsJson);
    updateData.credentialsJsonEncrypted = encrypted.encrypted;
    updateData.credentialsJsonIv = encrypted.iv;
    updateData.credentialsJsonAuthTag = encrypted.authTag;
  }

  // Upsert
  const [existing] = await db.select().from(aiServiceConfigs).where(eq(aiServiceConfigs.serviceKey, serviceKey));

  if (existing) {
    await db.update(aiServiceConfigs).set(updateData).where(eq(aiServiceConfigs.serviceKey, serviceKey));
  } else {
    await db.insert(aiServiceConfigs).values({
      serviceKey,
      displayName: defaults.displayName,
      modelName: updates.modelName || defaults.defaultModel,
      isEnabled: updates.isEnabled ?? true,
      ...updateData,
    });
  }

  const configs = await getAllServiceConfigs();
  return configs.find(c => c.serviceKey === serviceKey) || null;
}

// Update test status
async function updateTestStatus(serviceKey: string, status: string): Promise<void> {
  const [existing] = await db.select().from(aiServiceConfigs).where(eq(aiServiceConfigs.serviceKey, serviceKey));

  if (existing) {
    await db.update(aiServiceConfigs).set({
      lastTestedAt: new Date(),
      lastTestStatus: status,
      updatedAt: new Date(),
    }).where(eq(aiServiceConfigs.serviceKey, serviceKey));
  }
}

// Test connection for Google Gemini
async function testGoogleGemini(apiKey: string, modelName: string, endpointUrl: string): Promise<TestConnectionResult> {
  const startTime = Date.now();

  try {
    const url = `${endpointUrl}/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say 'Connection successful' in exactly those words." }] }],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0,
        },
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName,
      };
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName,
    };
  }
}

// Test connection for OpenAI
async function testOpenAI(apiKey: string, modelName: string, endpointUrl: string): Promise<TestConnectionResult> {
  const startTime = Date.now();

  try {
    const url = `${endpointUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Say 'Connection successful' in exactly those words." }],
        max_tokens: 20,
        temperature: 0,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName,
      };
    }

    const data = await response.json();
    const responseText = data?.choices?.[0]?.message?.content || "";

    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName,
    };
  }
}

// Test connection for Anthropic
async function testAnthropic(apiKey: string, modelName: string, endpointUrl: string): Promise<TestConnectionResult> {
  const startTime = Date.now();

  try {
    const url = `${endpointUrl}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 20,
        messages: [{ role: "user", content: "Say 'Connection successful' in exactly those words." }],
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName,
      };
    }

    const data = await response.json();
    const responseText = data?.content?.[0]?.text || "";

    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName,
    };
  }
}

// Test connection for Grok (xAI) - uses OpenAI-compatible API
async function testGrok(apiKey: string, modelName: string, endpointUrl: string): Promise<TestConnectionResult> {
  const startTime = Date.now();

  try {
    const url = `${endpointUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Say 'Connection successful' in exactly those words." }],
        max_tokens: 20,
        temperature: 0,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName,
      };
    }

    const data = await response.json();
    const responseText = data?.choices?.[0]?.message?.content || "";

    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName,
    };
  }
}

// Test connection for Google Vertex AI
async function testGoogleVertex(
  credentialsJson: string,
  modelName: string,
  projectId: string,
  region: string
): Promise<TestConnectionResult> {
  const startTime = Date.now();

  try {
    const accessToken = await getGoogleAccessToken(credentialsJson);

    // Use Gemini model on Vertex for text-based test (Imagen is image-only)
    const testModel = modelName.startsWith("imagen") ? "gemini-1.5-flash-002" : modelName;
    const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${testModel}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Say 'Connection successful' in exactly those words." }] }],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0,
        },
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: testModel,
      };
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Project: ${projectId}, Region: ${region}, Model: ${testModel}`,
      modelUsed: testModel,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName,
    };
  }
}

// Test connection for WaveSpeed AI
async function testWaveSpeed(apiKey: string, modelName: string, endpointUrl: string): Promise<TestConnectionResult> {
  const startTime = Date.now();

  try {
    const url = `${endpointUrl}/${modelName}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: "A simple red circle on white background",
        images: [],
        size: "512*512",
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName,
      };
    }

    const data = await response.json();
    const predictionId = data?.data?.id;

    return {
      success: true,
      message: `Connected successfully. Prediction ID: ${predictionId || "received"}`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName,
    };
  }
}

// Main test connection function
export async function testServiceConnection(serviceKey: string): Promise<TestConnectionResult> {
  const config = await getServiceConfigWithApiKey(serviceKey);

  if (!config) {
    return {
      success: false,
      message: `Unknown service: ${serviceKey}`,
    };
  }

  // Vertex AI uses credentials JSON instead of API key
  if (serviceKey === AI_SERVICES.GOOGLE_VERTEX) {
    if (!config.credentialsJson) {
      return {
        success: false,
        message: "Service account credentials not configured",
        details: "Please upload a Google Cloud service account JSON file for this service.",
      };
    }
    if (!config.projectId || !config.region) {
      return {
        success: false,
        message: "Project ID and Region required",
        details: "Please configure the GCP Project ID and Region for Vertex AI.",
      };
    }
    const result = await testGoogleVertex(
      config.credentialsJson,
      config.modelName,
      config.projectId,
      config.region
    );
    await updateTestStatus(serviceKey, result.success ? "success" : result.message);
    return result;
  }

  if (!config.apiKey) {
    return {
      success: false,
      message: "API key not configured",
      details: "Please configure an API key for this service before testing.",
    };
  }

  let result: TestConnectionResult;

  switch (serviceKey) {
    case AI_SERVICES.GOOGLE_GEMINI:
      result = await testGoogleGemini(config.apiKey, config.modelName, config.endpointUrl);
      break;
    case AI_SERVICES.OPENAI:
      result = await testOpenAI(config.apiKey, config.modelName, config.endpointUrl);
      break;
    case AI_SERVICES.ANTHROPIC:
      result = await testAnthropic(config.apiKey, config.modelName, config.endpointUrl);
      break;
    case AI_SERVICES.GROK:
      result = await testGrok(config.apiKey, config.modelName, config.endpointUrl);
      break;
    case AI_SERVICES.WAVESPEED:
      result = await testWaveSpeed(config.apiKey, config.modelName, config.endpointUrl);
      break;
    default:
      result = {
        success: false,
        message: `No test implementation for service: ${serviceKey}`,
      };
  }

  // Update test status in DB
  await updateTestStatus(serviceKey, result.success ? "success" : result.message);

  return result;
}

// Generic chat completion function that routes to the correct provider
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  maxTokens?: number;
  temperature?: number;
}

export async function chatCompletion(
  serviceKey: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<{ success: boolean; content?: string; error?: string }> {
  const config = await getServiceConfigWithApiKey(serviceKey);

  if (!config || !config.apiKey) {
    return { success: false, error: "Service not configured or API key missing" };
  }

  if (!config.isEnabled) {
    return { success: false, error: "Service is disabled" };
  }

  const { maxTokens = 4096, temperature = 0.7 } = options;

  try {
    switch (serviceKey) {
      case AI_SERVICES.GOOGLE_GEMINI:
        return await geminiChatCompletion(config.apiKey, config.modelName, config.endpointUrl, messages, maxTokens, temperature);
      case AI_SERVICES.OPENAI:
        return await openaiChatCompletion(config.apiKey, config.modelName, config.endpointUrl, messages, maxTokens, temperature);
      case AI_SERVICES.ANTHROPIC:
        return await anthropicChatCompletion(config.apiKey, config.modelName, config.endpointUrl, messages, maxTokens, temperature);
      case AI_SERVICES.GROK:
        return await grokChatCompletion(config.apiKey, config.modelName, config.endpointUrl, messages, maxTokens, temperature);
      default:
        return { success: false, error: `Unknown service: ${serviceKey}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Provider-specific chat completion implementations
async function geminiChatCompletion(
  apiKey: string,
  model: string,
  endpoint: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Add system instruction if present
  const systemMessage = messages.find(m => m.role === "system");

  const url = `${endpoint}/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { success: false, error: error?.error?.message || `HTTP ${response.status}` };
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return { success: true, content };
}

async function openaiChatCompletion(
  apiKey: string,
  model: string,
  endpoint: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { success: false, error: error?.error?.message || `HTTP ${response.status}` };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return { success: true, content };
}

async function anthropicChatCompletion(
  apiKey: string,
  model: string,
  endpoint: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  // Extract system message
  const systemMessage = messages.find(m => m.role === "system");
  const chatMessages = messages.filter(m => m.role !== "system");

  const response = await fetch(`${endpoint}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMessage?.content,
      messages: chatMessages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { success: false, error: error?.error?.message || `HTTP ${response.status}` };
  }

  const data = await response.json();
  const content = data?.content?.[0]?.text;
  return { success: true, content };
}

async function grokChatCompletion(
  apiKey: string,
  model: string,
  endpoint: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  // Grok uses OpenAI-compatible API
  return openaiChatCompletion(apiKey, model, endpoint, messages, maxTokens, temperature);
}

// Get service configs for Three Tears sync
export async function getServiceConfigsForSync(): Promise<Array<{
  serviceKey: string;
  displayName: string;
  modelName: string;
  isEnabled: boolean;
  hasApiKey: boolean;
}>> {
  const configs = await getAllServiceConfigs();
  return configs.map(c => ({
    serviceKey: c.serviceKey,
    displayName: c.displayName,
    modelName: c.modelName,
    isEnabled: c.isEnabled,
    hasApiKey: c.hasApiKey,
  }));
}
