import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import { db } from "./db";
import { users, sessions, groups, groupMembers, activityLogs, posts, likes, comments, follows, userMutes, userBlocks, settings, creditTransactions, helpQueries, artGenerations, aiPrompts, aiServiceConfigs, uploadedVideos, avatarSettings, featureUsage, avatarSessions, featureUsageDaily, translationHistory, recipeCategories, savedRecipes, dictionaryEntries, gameScores, DEFAULT_RECIPE_CATEGORIES, type Role, type FeatureCategory, type FeatureName, type AvatarType, type TranslationDirection, type TranslationSourceType } from "./db/schema";
import { eq, and, gt, count, gte, desc, inArray, sql, or, not } from "drizzle-orm";
import { requireAuth, requireAdmin, requireModerator, type AuthenticatedRequest } from "./middleware/auth";
import { verifyJwt, handleAdminCommand, broadcastEvent, getAppId, getMainAppBaseUrl, getIntegrationSettings, setIntegrationSetting, registerWithThreeTears, resetJwksClient } from "./integration/three-tears";
import { pushUserCreated, pushUserUpdated, pushGroupCreated, pushGroupUpdated, pushGroupDeleted, generateSnapshot, verifySyncAuth } from "./integration/sync";
import { requireCredits } from "./middleware/credits";
import { getCreditsForTier, TIER_CONFIG, TIER_ORDER, getTierPriority } from "../shared/tier-config";
import { getPrompt, getAllPrompts, setPrompt, resetPrompt, DEFAULT_PROMPTS } from "./prompts";
import { getAllServiceConfigs, updateServiceConfig, testServiceConnection, getServiceConfigWithApiKey, DEFAULT_SERVICE_CONFIGS, AI_SERVICES } from "./services/ai-providers";
import { getAppJwks, createTicket, getUserTickets, getTicketDetails, replyToTicket } from "./services/tickets";
import {
  createVideoUpload,
  proxyVideoUpload,
  getVideoById,
  getVideoStatus,
  deleteVideo,
  updateVideoFromWebhook,
  VIDEO_MAX_SIZE_BYTES,
  VIDEO_ALLOWED_TYPES,
} from "./services/video";
import { setupWebSocket, broadcastNewMessage } from "./websocket";
import { awardXp } from "./services/xp";
import { PDFDocument } from "pdf-lib";
import {
  areMutualFollowers,
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
  sendEncryptedMessage,
  markMessagesAsRead,
  getUnreadMessageCount,
  saveUserPublicKeys,
  getUserPublicKeys,
  saveConversationKey,
  getConversationKey,
  isConversationParticipant,
  getConversation,
  getFriendsList,
} from "./services/messaging";
import { directConversations, encryptedMessages, userPublicKeys } from "./db/schema";
import { uploadToR2, uploadBase64ToR2, isR2Configured, getObjectFromR2 } from "./services/r2";
import { getNextGeminiApiKey, releaseGeminiApiKey, getKeyStatus, isGeminiConfigured, getGeminiKeyForSession } from "./services/gemini-keys";
import { restartAvatarAgent, stopAvatarAgent, getAvatarAgentStatus } from "./services/avatar-agent";
import {
  getBillingProviders,
  getBillingProviderWithKeys,
  updateBillingProvider,
  testStripeConnection,
  testRevenueCatConnection,
  getBillingProviderForPlatform,
  isBillingProviderReady,
  handleSubscriptionUpdate,
  handleSubscriptionCancellation,
  updateBillingCredentialsFromThreeTears,
} from "./services/billing-providers";
import {
  registerPushToken,
  deactivatePushToken,
  getOrCreateUserNotificationSettings,
  sendNewFollowerNotification,
  sendNewPostNotifications,
} from "./services/push-notifications";
import {
  pushTokens,
  userNotificationSettings,
  notificationPreferences,
  notifications,
} from "./db/schema";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "images");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP, HEIC)"));
    }
  },
});

const ADMIN_EMAILS = ["adviceguyy@gmail.com", "jsaeliew@gmail.com"];

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getOAuthConfig(provider: string) {
  const configs: Record<string, { clientId: string; clientSecret: string; tokenUrl: string; userInfoUrl: string }> = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    },
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
      userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email,picture",
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      userInfoUrl: "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || "",
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
      tokenUrl: "https://api.instagram.com/oauth/access_token",
      userInfoUrl: "https://graph.instagram.com/me?fields=id,username",
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_KEY || "",
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
      tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
      userInfoUrl: "https://open.tiktokapis.com/v2/user/info/",
    },
  };
  return configs[provider];
}

async function logActivity(userId: string | null, action: string, metadata?: Record<string, unknown>) {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

// Feature usage tracking for analytics
interface FeatureUsageParams {
  userId?: string | null;
  category: FeatureCategory;
  featureName: FeatureName;
  subFeature?: string;
  metadata?: Record<string, unknown>;
  status?: "success" | "failed" | "cancelled";
  errorMessage?: string;
  creditsUsed?: number;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
}

function anonymizeIp(ip?: string): string | null {
  if (!ip) return null;
  // Hash the IP to allow aggregate analytics without storing PII
  return crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);
}

async function logFeatureUsage(params: FeatureUsageParams) {
  try {
    await db.insert(featureUsage).values({
      userId: params.userId || null,
      category: params.category,
      featureName: params.featureName,
      subFeature: params.subFeature || null,
      metadata: params.metadata || null,
      status: params.status || "success",
      errorMessage: params.errorMessage || null,
      creditsUsed: params.creditsUsed || 0,
      durationMs: params.durationMs || null,
      ipAddress: anonymizeIp(params.ipAddress),
      userAgent: params.userAgent || null,
    });
  } catch (error) {
    console.error("Failed to log feature usage:", error);
  }
}

// Avatar session tracking
async function createAvatarSession(userId: string, avatarType: AvatarType, voiceUsed?: string, platform?: string): Promise<string> {
  try {
    const [session] = await db.insert(avatarSessions).values({
      userId,
      avatarType,
      voiceUsed: voiceUsed || null,
      platform: platform || null,
      status: "active",
    }).returning();
    return session.id;
  } catch (error) {
    console.error("Failed to create avatar session:", error);
    throw error;
  }
}

async function endAvatarSession(sessionId: string, messageCount?: number, userMessageCount?: number, avatarResponseCount?: number, status: "completed" | "failed" | "abandoned" = "completed", errorMessage?: string) {
  try {
    const [session] = await db.select().from(avatarSessions).where(eq(avatarSessions.id, sessionId));
    if (session) {
      const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      await db.update(avatarSessions)
        .set({
          endedAt: new Date(),
          durationSeconds,
          messageCount: messageCount || 0,
          userMessageCount: userMessageCount || 0,
          avatarResponseCount: avatarResponseCount || 0,
          status,
          errorMessage: errorMessage || null,
        })
        .where(eq(avatarSessions.id, sessionId));
    }
  } catch (error) {
    console.error("Failed to end avatar session:", error);
  }
}

let vertexAccessToken: string | null = null;
let vertexTokenExpiry: number = 0;

async function getVertexAIAccessToken(): Promise<string> {
  if (vertexAccessToken && Date.now() < vertexTokenExpiry - 60000) {
    return vertexAccessToken;
  }

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const jwtPayload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const signedJwt = jwt.sign(jwtPayload, serviceAccount.private_key, { algorithm: "RS256" });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  vertexAccessToken = tokenData.access_token;
  vertexTokenExpiry = Date.now() + (tokenData.expires_in * 1000);

  return vertexAccessToken!;
}

async function findOrCreateUser(
  provider: string,
  providerUserId: string,
  email: string,
  displayName: string,
  avatar: string
): Promise<{ id: string; email: string; displayName: string; avatar: string | null; provider: string; role: Role }> {
  const existingUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, provider), eq(users.providerUserId, providerUserId)))
    .limit(1);

  if (existingUsers.length > 0) {
    const user = existingUsers[0];
    const shouldBeAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    const newRole: Role = shouldBeAdmin ? "admin" : user.role;
    const newLastLoginAt = new Date();
    
    await db.update(users).set({ 
      lastLoginAt: newLastLoginAt,
      role: newRole,
    }).where(eq(users.id, user.id));

    pushUserUpdated({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      provider: user.provider,
      role: newRole,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: newLastLoginAt.toISOString(),
    });
    
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      provider: user.provider,
      role: newRole,
    };
  }

  const role: Role = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";

  const newUser = await db
    .insert(users)
    .values({
      email,
      displayName,
      avatar,
      provider,
      providerUserId,
      role,
    })
    .returning();

  await logActivity(newUser[0].id, "user_created", { provider, email });

  broadcastEvent("user.created", {
    userId: newUser[0].id,
    email: newUser[0].email,
    displayName: newUser[0].displayName,
    provider: newUser[0].provider,
  }).catch((err) => console.warn("Failed to broadcast user.created event:", err));

  pushUserCreated({
    id: newUser[0].id,
    email: newUser[0].email,
    displayName: newUser[0].displayName,
    avatar: newUser[0].avatar,
    provider: newUser[0].provider,
    role: newUser[0].role,
    createdAt: newUser[0].createdAt.toISOString(),
    lastLoginAt: newUser[0].lastLoginAt.toISOString(),
  });

  return {
    id: newUser[0].id,
    email: newUser[0].email,
    displayName: newUser[0].displayName,
    avatar: newUser[0].avatar,
    provider: newUser[0].provider,
    role: newUser[0].role,
  };
}

async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

function getDressMeAI() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured. Please add your Google AI Studio API key.");
  }
  return new GoogleGenAI({ apiKey });
}

let mienAttireReferenceBase64: string | null = null;

function getMienAttireReference(): string {
  if (!mienAttireReferenceBase64) {
    const refPath = path.join(process.cwd(), "assets", "images", "mien-attire-reference.png");
    if (fs.existsSync(refPath)) {
      mienAttireReferenceBase64 = fs.readFileSync(refPath).toString("base64");
      console.log("Loaded Mien attire reference image for AI generation");
    } else {
      console.warn("Mien attire reference image not found at:", refPath);
      return "";
    }
  }
  return mienAttireReferenceBase64;
}

const systemPromptToEnglish = `You are a professional translator specializing in the Mien (Iu Mien) language. 
Your task is to translate Mien text into clear, natural English.

Guidelines:
- Preserve the original meaning and cultural context
- Use simple, accessible English
- If a phrase has cultural significance, briefly explain it in parentheses
- If the input appears to be English or another language, still try to provide helpful context about Mien language and culture
- Mien is a Hmong-Mien language spoken by the Iu Mien people of China, Vietnam, Laos, Thailand, and diaspora communities
- Common Mien words include: "kuv" (I/me), "meih" (you), "ninh" (he/she), "mbuo" (we), "hnoi" (day), "hnyouv" (heart)

Always provide a helpful, accurate translation.`;

const systemPromptToMien = `Use the Iu Mien language structure and vocabulary from the IuMiNR (Iu Mien New Romanization) script to translate into Mien.

You are a professional translator specializing in translating English and other languages into the Mien (Iu Mien) language using the IuMiNR romanization system.

Guidelines:
- Use proper IuMiNR (Iu Mien New Romanization) spelling and tone markers
- Preserve the original meaning and cultural context
- Mien is a Hmong-Mien language spoken by the Iu Mien people of China, Vietnam, Laos, Thailand, and diaspora communities
- Use authentic Mien vocabulary and grammar structures
- If a concept doesn't have a direct Mien equivalent, provide the closest cultural translation with explanation

Always provide a helpful, accurate translation into Mien using IuMiNR script.`;

const OTHER_LANGUAGE_NAMES: Record<string, string> = {
  vietnamese: "Vietnamese",
  mandarin: "Mandarin Chinese",
  hmong: "Hmong",
  cantonese: "Cantonese",
  thai: "Thai",
  lao: "Lao",
  burmese: "Burmese",
  french: "French",
  pinghua: "Pinghua",
  khmer: "Khmer",
};

function getSystemPromptForOtherLanguage(languageKey: string): string {
  const languageName = OTHER_LANGUAGE_NAMES[languageKey] || languageKey;
  return `You are a professional translator. Your ONLY task is to translate text into ${languageName}.

IMPORTANT: Your output must be in ${languageName}. Do NOT translate into any other language.

Guidelines:
- Translate ALL input text into ${languageName} regardless of what language the input is in
- Output ONLY the ${languageName} translation
- Use proper ${languageName} grammar, vocabulary, and writing conventions
- Preserve the original meaning and cultural context
- If a phrase has cultural significance, briefly explain it in parentheses
- Use natural, clear ${languageName} phrasing

Always provide a helpful, accurate translation into ${languageName}.`;
}

const videoExtractionPrompt = `You are a video content analyzer. Watch this video and provide:
1. A comprehensive summary of the video content
2. A full transcription of all spoken words in the video
3. Any text that appears on screen

Output the transcription in clear English. If the video contains speech in another language, translate it to English.
Format your response as:
## Summary
[Your summary here]

## Transcription
[Full transcription of spoken content]

## On-Screen Text
[Any text visible in the video]`;

const documentExtractionPrompt = `You are a document text extractor. Extract all text content from this document.

Instructions:
1. Extract ALL readable text from the document
2. Preserve the structure and formatting as much as possible
3. Include headers, paragraphs, lists, and any other text content
4. If there are images with text, describe them briefly
5. Output the extracted text in a clear, readable format

Format your response as:
## Document Content
[All extracted text from the document]`;

const audioTranscriptionPrompt = `You are an audio transcription specialist. Listen to this audio recording and transcribe all spoken words accurately.

Instructions:
1. Transcribe ALL spoken content in the audio
2. If the speech is in Mien (Iu Mien), transcribe it as accurately as possible using IuMiNR romanization
3. If the speech is in English or another language, transcribe it directly
4. Provide both a brief summary and the full transcription

Format your response EXACTLY as:
SUMMARY: [1-2 sentence summary of what was said]
TRANSCRIPTION: [Full transcription of spoken content]`;

async function extractVideoContent(videoUrl: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: videoExtractionPrompt },
          {
            fileData: {
              fileUri: videoUrl,
              mimeType: "video/*",
            },
          },
        ],
      },
    ],
  });
  return response.text || "";
}

async function extractDocumentContent(fileData: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: documentExtractionPrompt },
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
  });
  return response.text || "";
}

async function transcribeAudio(audioData: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: audioTranscriptionPrompt },
          {
            inlineData: {
              data: audioData,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
  });
  return response.text || "";
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/translate", requireAuth, requireCredits(1, "translation"), async (req: AuthenticatedRequest, res) => {
    try {
      const { content, sourceType, documentContent, targetLanguage } = req.body;

      if (!content && !documentContent) {
        return res.status(400).json({ error: "Content is required" });
      }

      const isToMien = targetLanguage === "mien";
      const isToEnglish = targetLanguage === "english";
      const isToOtherLanguage = !isToMien && !isToEnglish && OTHER_LANGUAGE_NAMES[targetLanguage];
      const systemPrompt = isToMien ? systemPromptToMien : isToOtherLanguage ? getSystemPromptForOtherLanguage(targetLanguage) : systemPromptToEnglish;
      const translationModel = isToMien ? "gemini-3-pro-preview" : "gemini-2.5-flash";

      let userMessage = "";

      if (sourceType === "video") {
        const videoUrl = content;

        try {
          console.log("Step 1: Extracting video content with Gemini 2.5 Flash...");
          const extractedContent = await extractVideoContent(videoUrl);
          console.log("Video extraction complete, length:", extractedContent.length);

          if (isToMien) {
            userMessage = `Please translate the following video content into Mien using IuMiNR (Iu Mien New Romanization) script.

Here is the extracted content from the video:

${extractedContent}

Please provide:
1. The summary translated to Mien
2. The transcription translated to Mien
3. Any on-screen text translated to Mien`;
          } else if (isToOtherLanguage) {
            const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
            userMessage = `Translate the following video content into ${langName}. Your entire response must be in ${langName}.

Here is the extracted content from the video:

${extractedContent}

Provide in ${langName}:
1. The summary translated to ${langName}
2. The transcription translated to ${langName}
3. Any on-screen text translated to ${langName}`;
          } else {
            userMessage = `Here is the extracted content from a video that may contain Mien language:

${extractedContent}

Please analyze this content and:
1. Identify any Mien language phrases
2. Translate any Mien content to English
3. Provide cultural context where relevant`;
          }
        } catch (videoError) {
          console.error("Video extraction failed:", videoError);
          if (isToMien) {
            userMessage = `The user provided a video URL: ${videoUrl}

Unfortunately, I could not extract the video content directly. Please:
1. Acknowledge the video URL
2. If you can recognize the video from its URL, provide any relevant information
3. Offer to translate any text the user can provide from the video into Mien using IuMiNR script`;
          } else if (isToOtherLanguage) {
            const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
            userMessage = `The user provided a video URL: ${videoUrl}

Unfortunately, I could not extract the video content directly. Respond in ${langName}:
1. Acknowledge the video URL
2. If you can recognize the video from its URL, provide any relevant information
3. Offer to translate any text the user can provide from the video into ${langName}`;
          } else {
            userMessage = `The user provided a video URL: ${videoUrl}

Unfortunately, I could not extract the video content directly. Please:
1. Acknowledge the video URL
2. If you can recognize the video from its URL, provide any relevant information
3. Offer to translate any Mien text the user can provide from the video`;
          }
        }
      } else if (sourceType === "document") {
        const { documentData, documentMimeType } = req.body;

        if (documentData && documentMimeType) {
          try {
            console.log("Step 1: Extracting document content with Gemini 2.5 Flash...");
            const extractedText = await extractDocumentContent(documentData, documentMimeType);
            console.log("Document extraction complete, length:", extractedText.length);

            if (isToMien) {
              userMessage = `Please translate the following document content into Mien using IuMiNR (Iu Mien New Romanization) script:

${extractedText}`;
            } else if (isToOtherLanguage) {
              const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
              userMessage = `Translate the following document content into ${langName}. Your entire response must be in ${langName}:

${extractedText}`;
            } else {
              userMessage = `Please translate the following document content (which may contain Mien text) to English:

${extractedText}

Identify any Mien language content and translate it to English with cultural context.`;
            }
          } catch (docError) {
            console.error("Document extraction failed:", docError);
            if (documentContent && documentContent.trim()) {
              if (isToMien) {
                userMessage = `Please translate the following text into Mien using IuMiNR (Iu Mien New Romanization) script:\n\n${documentContent}`;
              } else if (isToOtherLanguage) {
                const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
                userMessage = `Translate the following text into ${langName}. Your entire response must be in ${langName} only:\n\n${documentContent}`;
              } else {
                userMessage = `Please translate the following Mien text to English:\n\n${documentContent}`;
              }
            } else {
              userMessage = `Document extraction failed. Please copy and paste the text from your document for translation.`;
            }
          }
        } else if (documentContent && documentContent.trim()) {
          if (isToMien) {
            userMessage = `Please translate the following text into Mien using IuMiNR (Iu Mien New Romanization) script:\n\n${documentContent}`;
          } else if (isToOtherLanguage) {
            const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
            userMessage = `Translate the following text into ${langName}. Your entire response must be in ${langName} only:\n\n${documentContent}`;
          } else {
            userMessage = `Please translate the following Mien text to English:\n\n${documentContent}`;
          }
        } else {
          userMessage = `Please provide document content for translation. You can copy and paste the text from your document.`;
        }
      } else {
        if (isToMien) {
          userMessage = `Please translate the following text into Mien using IuMiNR (Iu Mien New Romanization) script:\n\n${content}`;
        } else if (isToOtherLanguage) {
          const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
          userMessage = `Translate the following text into ${langName}. Your entire response must be in ${langName} only:\n\n${content}`;
        } else {
          userMessage = `Please translate the following Mien text to English:\n\n${content}`;
        }
      }

      const modelAck = isToMien
        ? "I understand. I will translate text into Mien using the IuMiNR romanization system, preserving cultural context."
        : isToOtherLanguage
        ? `I understand. I will translate the text into ${OTHER_LANGUAGE_NAMES[targetLanguage]} only. My response will be entirely in ${OTHER_LANGUAGE_NAMES[targetLanguage]}.`
        : "I understand. I will translate Mien text to English following your guidelines, providing cultural context where relevant.";

      const response = await ai.models.generateContent({
        model: translationModel,
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: modelAck }] },
          { role: "user", parts: [{ text: userMessage }] },
        ],
      });

      const translation = response.text || "Translation could not be generated. Please try again.";

      // Calculate content metrics
      const inputContent = content || documentContent || "";
      const contentLength = typeof inputContent === "string" ? inputContent.length : 0;
      const outputLength = translation.length;

      // Return the translation immediately - don't wait for history to be saved
      res.json({ translation });

      // Award XP (fire and forget)
      awardXp(req.user!.id, "ai_translation").catch(() => {});

      // Log feature usage with detailed metrics (fire and forget)
      logFeatureUsage({
        userId: req.user!.id,
        category: "ai_translation",
        featureName: isToMien ? "translate_to_mien" : isToOtherLanguage ? `translate_to_${targetLanguage}` : "translate_to_english",
        subFeature: sourceType || "text",
        creditsUsed: 1,
        metadata: {
          sourceType: sourceType || "text",
          targetLanguage,
          inputContentLength: contentLength,
          outputContentLength: outputLength,
          documentMimeType: req.body.documentMimeType || null,
          modelUsed: translationModel,
          hasDocumentData: !!req.body.documentData,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Save translation to history in the background (don't block response)
      const originalText = (inputContent || "").substring(0, 5000);
      db.insert(translationHistory).values({
        userId: req.user!.id,
        originalText,
        translatedText: translation.substring(0, 10000),
        direction: (isToMien ? "to_mien" : isToOtherLanguage ? `to_${targetLanguage}` : "to_english") as TranslationDirection,
        sourceType: (sourceType || "text") as TranslationSourceType,
        creditsUsed: 1,
      }).catch((historyError) => {
        // Log the error but don't fail - translation was already returned
        console.error("Failed to save translation to history (non-blocking):", historyError);
      });
    } catch (error) {
      console.error("Translation error:", error);
      // Log failed usage with detailed metrics
      const inputContent = req.body.content || req.body.documentContent || "";
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_translation",
        featureName: req.body.targetLanguage === "mien" ? "translate_to_mien" : "translate_to_english",
        subFeature: req.body.sourceType || "text",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          sourceType: req.body.sourceType || "text",
          targetLanguage: req.body.targetLanguage,
          inputContentLength: typeof inputContent === "string" ? inputContent.length : 0,
          documentMimeType: req.body.documentMimeType || null,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Translation failed. Please try again." });
    }
  });

  // Get translation history for the authenticated user
  app.get("/api/translation-history", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await db
        .select()
        .from(translationHistory)
        .where(eq(translationHistory.userId, req.user!.id))
        .orderBy(desc(translationHistory.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(translationHistory)
        .where(eq(translationHistory.userId, req.user!.id));

      res.json({
        history,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + history.length < totalCount,
        },
      });
    } catch (error) {
      console.error("Error fetching translation history:", error);
      res.status(500).json({ error: "Failed to fetch translation history" });
    }
  });

  // Delete a specific translation from history
  app.delete("/api/translation-history/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const [deleted] = await db
        .delete(translationHistory)
        .where(and(
          eq(translationHistory.id, id),
          eq(translationHistory.userId, req.user!.id)
        ))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Translation not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting translation:", error);
      res.status(500).json({ error: "Failed to delete translation" });
    }
  });

  // Clear all translation history for the authenticated user
  app.delete("/api/translation-history", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await db
        .delete(translationHistory)
        .where(eq(translationHistory.userId, req.user!.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing translation history:", error);
      res.status(500).json({ error: "Failed to clear translation history" });
    }
  });

  app.post("/api/recipe-it", requireAuth, requireCredits(2, "recipe"), async (req: AuthenticatedRequest, res) => {
    try {
      const { imageData, mimeType, dishDescription } = req.body;

      if (!imageData && !dishDescription) {
        return res.status(400).json({ error: "Either an image or dish description is required" });
      }

      console.log("Analyzing food with Gemini...", dishDescription ? "(text mode)" : "(image mode)");

      const inputDescription = dishDescription ? `the dish: "${dishDescription}"` : "this image of food";
      
      const recipePrompt = `You are a professional chef and food expert with deep knowledge of Mien (Yao/Iu Mien) cuisine and culture. Analyze ${inputDescription} and provide a complete recipe with the following information. Return ONLY valid JSON without any markdown formatting or code blocks.

IMPORTANT: The Mien people (also known as Yao or Iu Mien) are an ethnic group from Southeast Asia with a rich culinary tradition. Common Mien dishes include:
- Laab/Larb (spiced minced meat salad)
- Khao poon/Khao pun (rice noodle soup)
- Jeow/Jaew (spicy dipping sauces)
- Sticky rice dishes (khao niew)
- Grilled meats with herbs (ping)
- Fresh spring rolls (poh pia)
- Fermented fish/meat dishes
- Dishes with lemongrass, galangal, fish sauce, and fresh herbs
- Papaya salad (som tam)
- Various soups and curries

If this IS a traditional Mien dish:
- Set "isMienDish" to true
- In "mienHighlights", provide interesting highlights, cultural background, and fascinating facts about this dish and/or its ingredients. Include any traditional significance, when it's typically served, and its cultural importance to the Mien people.
- Set "mienModifications" to null
- Set "similarMienDish" to null

If this is NOT a traditional Mien dish:
- Set "isMienDish" to false
- Set "mienHighlights" to null
- In "mienModifications", kindly let the user know this is not a traditional Mien dish and provide creative suggestions on how they could modify the dish to make it more Mien-inspired (e.g., adding fish sauce, fresh herbs, making it spicier, serving with sticky rice, etc.)
- In "similarMienDish", recommend the name of a traditional Mien dish that is most similar to what the user submitted, and briefly explain the similarity

IMPORTANT: Still provide the full recipe details for the dish the user submitted, regardless of whether it's Mien or not.

Return this exact JSON structure:
{
  "recipeName": "Name of the dish",
  "description": "Brief description of the dish (2-3 sentences)",
  "servings": "Number of servings (e.g., 'Serves 4')",
  "prepTime": "Preparation time (e.g., '15 minutes')",
  "cookTime": "Cooking time (e.g., '30 minutes')",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "instructions": ["Step 1 instruction", "Step 2 instruction", ...],
  "shoppingList": [
    {"category": "Produce", "items": ["item1", "item2"]},
    {"category": "Proteins", "items": ["item1"]},
    {"category": "Dairy", "items": ["item1"]},
    {"category": "Pantry", "items": ["item1", "item2"]}
  ],
  "isMienDish": true or false,
  "mienHighlights": "Cultural highlights and interesting facts (only if isMienDish is true, otherwise null)",
  "mienModifications": "Suggestions to make it more Mien (only if isMienDish is false, otherwise null)",
  "similarMienDish": "Name and brief explanation of a similar Mien dish (only if isMienDish is false, otherwise null)"
}

If you cannot identify the food clearly, make your best guess based on what you can see or the description provided.`;

      const contentParts: any[] = [{ text: recipePrompt }];
      
      if (imageData) {
        contentParts.push({
          inlineData: {
            data: imageData,
            mimeType: mimeType || "image/jpeg",
          },
        });
      }

      const dressMeAI = getDressMeAI();
      const response = await dressMeAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: contentParts,
          },
        ],
      });

      const responseText = response.text || "";
      console.log("Recipe analysis complete, parsing response...");

      let recipe;
      try {
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.slice(7);
        } else if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();
        
        const jsonStartIndex = cleanedText.indexOf("{");
        const jsonEndIndex = cleanedText.lastIndexOf("}");
        
        if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex <= jsonStartIndex) {
          throw new Error("No valid JSON object found in response");
        }
        
        const jsonString = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
        recipe = JSON.parse(jsonString);
        
        if (!recipe.recipeName || !recipe.ingredients || !recipe.instructions) {
          throw new Error("Missing required recipe fields");
        }
      } catch (parseError) {
        console.error("Failed to parse recipe JSON:", parseError);
        console.log("Raw response:", responseText.substring(0, 1000));
        // Determine input type for failed request
        const inputType = imageData && dishDescription ? "hybrid" : imageData ? "image" : "text";
        logFeatureUsage({
          userId: req.user?.id,
          category: "ai_assistant",
          featureName: "recipe_it",
          subFeature: inputType,
          status: "failed",
          errorMessage: "Failed to parse recipe JSON",
          creditsUsed: 2,
          metadata: {
            inputType,
            hasImage: !!imageData,
            hasTextDescription: !!dishDescription,
            imageMimeType: mimeType || null,
            descriptionLength: dishDescription?.length || 0,
          },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
        return res.status(422).json({ error: "Could not parse recipe. Please try another image." });
      }

      // Determine input type
      const inputType = imageData && dishDescription ? "hybrid" : imageData ? "image" : "text";

      // Calculate recipe complexity metrics
      const ingredientCount = Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0;
      const instructionCount = Array.isArray(recipe.instructions) ? recipe.instructions.length : 0;
      const shoppingListCategories = Array.isArray(recipe.shoppingList) ? recipe.shoppingList.length : 0;

      // Log successful feature usage with detailed metrics
      logFeatureUsage({
        userId: req.user!.id,
        category: "ai_assistant",
        featureName: "recipe_it",
        subFeature: inputType,
        creditsUsed: 2,
        metadata: {
          inputType,
          hasImage: !!imageData,
          hasTextDescription: !!dishDescription,
          imageMimeType: mimeType || null,
          descriptionLength: dishDescription?.length || 0,
          recipeName: recipe.recipeName,
          isMienDish: recipe.isMienDish,
          hasMienHighlights: !!recipe.mienHighlights,
          hasMienModifications: !!recipe.mienModifications,
          hasSimilarMienDish: !!recipe.similarMienDish,
          ingredientCount,
          instructionCount,
          shoppingListCategories,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ recipe });
    } catch (error) {
      console.error("Recipe analysis error:", error);
      const { imageData, mimeType, dishDescription } = req.body;
      const inputType = imageData && dishDescription ? "hybrid" : imageData ? "image" : "text";
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_assistant",
        featureName: "recipe_it",
        subFeature: inputType,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          inputType,
          hasImage: !!imageData,
          hasTextDescription: !!dishDescription,
          imageMimeType: mimeType || null,
          descriptionLength: dishDescription?.length || 0,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Recipe analysis failed. Please try again." });
    }
  });

  app.post("/api/dress-me", requireAuth, requireCredits(5, "dress_me"), async (req: AuthenticatedRequest, res) => {
    try {
      const { imageBase64, additionalInstructions } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "An image is required" });
      }

      // Get WaveSpeed API key from admin-configured AI services
      const wavespeedConfig = await getServiceConfigWithApiKey(AI_SERVICES.WAVESPEED);
      if (!wavespeedConfig || !wavespeedConfig.apiKey) {
        console.error("WaveSpeed API key not configured");
        return res.status(500).json({ error: "WaveSpeed AI is not configured. Please ask an admin to set the API key in AI Services settings." });
      }

      console.log("Generating Mien wedding attire image with WaveSpeed qwen-image-max...");

      const referenceImage = getMienAttireReference();

      let prompt = `Transform the subject in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. Use the reference image showing authentic Mien male and female traditional attire as your visual guide. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE:
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image.
If a female subject is present, dress her in attire matching the RIGHT side of the reference image.

Keep the subject's pose and background the same.
Upscale the image using an artistic super-resolution process. Enrich it with micro-textures, fine-grain detail, depth enhancements, and creative accents that elevate visual complexity without distorting the core subject.`;

      const userTier = req.user?.tierSlug || 'free';
      if (userTier === 'free') {
        prompt += "\n\nCreate a watermark on the image at the bottom center with small fonts that reads 'Created by Mien Kingdom'.";
      }

      if (additionalInstructions && additionalInstructions.trim()) {
        prompt += `\n\nAdditional user instructions: ${additionalInstructions}`;
      }

      const generationStartTime = Date.now();
      const wavespeedApiKey = wavespeedConfig.apiKey;
      const wavespeedEndpoint = wavespeedConfig.endpointUrl;

      // Build images array for WaveSpeed API (base64 data URIs)
      const images: string[] = [
        `data:image/jpeg;base64,${imageBase64}`,
      ];

      if (referenceImage) {
        images.push(`data:image/png;base64,${referenceImage}`);
      }

      // Submit image generation task to WaveSpeed
      const submitResponse = await fetch(`${wavespeedEndpoint}/wavespeed-ai/qwen-image-max/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${wavespeedApiKey}`,
        },
        body: JSON.stringify({
          prompt,
          images,
          size: "1024*1024",
          output_format: "png",
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        console.error("WaveSpeed submit error:", errorData);
        throw new Error(errorData?.message || `WaveSpeed API error: ${submitResponse.status}`);
      }

      const submitData = await submitResponse.json();
      const predictionId = submitData?.data?.id;
      const resultUrl = submitData?.data?.urls?.get;

      if (!predictionId || !resultUrl) {
        console.error("No prediction ID from WaveSpeed:", submitData);
        throw new Error("Failed to start image generation");
      }

      console.log(`WaveSpeed prediction started: ${predictionId}`);

      // Poll for completion
      const maxPollAttempts = 60; // Max 2 minutes (60 * 2s)
      const pollInterval = 2000; // 2 seconds
      let imageUrl: string | null = null;

      for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const pollResponse = await fetch(resultUrl, {
          headers: {
            "Authorization": `Bearer ${wavespeedApiKey}`,
          },
        });

        if (!pollResponse.ok) {
          console.error(`WaveSpeed poll error (attempt ${attempt + 1}):`, pollResponse.status);
          continue;
        }

        const pollData = await pollResponse.json();
        const status = pollData?.data?.status;

        if (status === "completed") {
          const outputs = pollData?.data?.outputs;
          if (outputs && outputs.length > 0) {
            imageUrl = outputs[0];
          }
          break;
        } else if (status === "failed") {
          console.error("WaveSpeed generation failed:", pollData);
          throw new Error("Image generation failed on WaveSpeed");
        }

        // Still processing, continue polling
        console.log(`WaveSpeed polling (attempt ${attempt + 1}): status=${status}`);
      }

      if (!imageUrl) {
        throw new Error("Image generation timed out. Please try again.");
      }

      // Download the generated image and convert to base64
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image");
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const imageBase64Result = imageBuffer.toString("base64");

      const generationDuration = Date.now() - generationStartTime;
      console.log("Mien attire image generated successfully via WaveSpeed qwen-image-max");

      logFeatureUsage({
        userId: req.user!.id,
        category: "ai_generation",
        featureName: "dress_me",
        subFeature: "mien_wedding_attire",
        creditsUsed: 5,
        durationMs: generationDuration,
        metadata: {
          hasAdditionalInstructions: !!additionalInstructions,
          additionalInstructionsLength: additionalInstructions?.length || 0,
          userTier,
          hasWatermark: userTier === "free",
          modelUsed: "wavespeed-ai/qwen-image-max/edit",
          hasReferenceImage: !!referenceImage,
          outputSize: "1024x1024",
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        b64_json: imageBase64Result,
        mimeType: "image/png",
      });

      // Award XP (fire and forget)
      awardXp(req.user!.id, "ai_image_dress_me").catch(() => {});
    } catch (error) {
      console.error("Dress Me error:", error);
      const { additionalInstructions } = req.body;
      const userTier = req.user?.tierSlug || "free";
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_generation",
        featureName: "dress_me",
        subFeature: "mien_wedding_attire",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          hasAdditionalInstructions: !!additionalInstructions,
          additionalInstructionsLength: additionalInstructions?.length || 0,
          userTier,
          hasWatermark: userTier === "free",
          modelUsed: "wavespeed-ai/qwen-image-max/edit",
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Image generation failed. Please try again." });
    }
  });

  app.post("/api/restore-photo", requireAuth, requireCredits(5, "restore_photo"), async (req: AuthenticatedRequest, res) => {
    try {
      const { imageBase64, additionalInstructions } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "An image is required" });
      }

      console.log("Restoring photo with Gemini 3 Pro Image...");

      let prompt = "Restore this photo to fully restored vintage photograph, colorized, incredibly detailed, sharp focus, 8k, realistic skin texture, natural lighting, vibrant colors, and clean photo. Upscale this image using an artistic super-resolution process. Enrich it with micro-textures, fine-grain detail, depth enhancements, and creative accents that elevate visual complexity without distorting the core subject.";

      // Add watermark only for free tier users
      const userTier = req.user?.tierSlug || 'free';
      if (userTier === 'free') {
        prompt += "\n\nCreate a watermark on the image at the bottom center with small fonts that reads 'Created by Mien Kingdom'.";
      }

      if (additionalInstructions && additionalInstructions.trim()) {
        prompt += `\n\nAdditional user instructions: ${additionalInstructions}`;
      }

      const dressMeAI = getDressMeAI();
      const generationStartTime = Date.now();

      const response = await dressMeAI.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: "image/jpeg",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            imageSize: "2K",
          },
        },
      });

      const generationDuration = Date.now() - generationStartTime;
      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

      if (!imagePart?.inlineData?.data) {
        console.error("No image data in response");
        return res.status(500).json({ error: "Failed to restore image. Please try again." });
      }

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      console.log("Photo restored successfully");

      // Log successful feature usage with detailed metrics
      logFeatureUsage({
        userId: req.user!.id,
        category: "ai_generation",
        featureName: "restore_photo",
        subFeature: "vintage_colorization",
        creditsUsed: 5,
        durationMs: generationDuration,
        metadata: {
          hasAdditionalInstructions: !!additionalInstructions,
          additionalInstructionsLength: additionalInstructions?.length || 0,
          userTier,
          hasWatermark: userTier === "free",
          modelUsed: "gemini-3-pro-image-preview",
          outputSize: "2K",
          outputMimeType: mimeType,
          inputImageSize: imageBase64.length,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        b64_json: imagePart.inlineData.data,
        mimeType,
      });

      // Award XP (fire and forget)
      awardXp(req.user!.id, "ai_image_restore_photo").catch(() => {});
    } catch (error) {
      console.error("Photo restoration error:", error);
      const { imageBase64, additionalInstructions } = req.body;
      const userTier = req.user?.tierSlug || "free";
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_generation",
        featureName: "restore_photo",
        subFeature: "vintage_colorization",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          hasAdditionalInstructions: !!additionalInstructions,
          additionalInstructionsLength: additionalInstructions?.length || 0,
          userTier,
          hasWatermark: userTier === "free",
          modelUsed: "gemini-3-pro-image-preview",
          inputImageSize: imageBase64?.length || 0,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Photo restoration failed. Please try again." });
    }
  });

  // Movie Star endpoint - 160 credits, generates image then video with SSE
  app.post("/api/movie-star", requireAuth, async (req: AuthenticatedRequest, res) => {
    const MOVIE_STAR_CREDIT_COST = 160;
    const userId = req.user!.id;
    
    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    const sendSSE = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        sendSSE("error", { error: "An image is required" });
        return res.end();
      }

      // Check credits before starting
      const userResult = await db.select().from(users).where(eq(users.id, userId));
      if (!userResult.length || userResult[0].credits < MOVIE_STAR_CREDIT_COST) {
        sendSSE("error", { 
          error: "Insufficient credits", 
          required: MOVIE_STAR_CREDIT_COST,
          available: userResult[0]?.credits || 0,
          redirect_url: "/subscription",
          status: 402
        });
        return res.end();
      }

      // Deduct credits atomically
      const deductResult = await db.execute(
        sql`UPDATE users SET credits = credits - ${MOVIE_STAR_CREDIT_COST} WHERE id = ${userId} AND credits >= ${MOVIE_STAR_CREDIT_COST} RETURNING credits`
      );
      
      if (!deductResult.rows?.length) {
        sendSSE("error", { error: "Failed to deduct credits", redirect_url: "/subscription", status: 402 });
        return res.end();
      }

      const newBalance = (deductResult.rows[0] as any).credits;

      // Log credit transaction
      await db.insert(creditTransactions).values({
        userId,
        type: "deduction",
        amount: -MOVIE_STAR_CREDIT_COST,
        balanceAfter: newBalance,
        feature: "movie_star",
        description: "Mien Movie Star video generation",
      });

      console.log("Starting Mien Movie Star generation...");
      sendSSE("progress", { step: 1, message: "Creating your portrait..." });

      // Track timing for each step
      const step1StartTime = Date.now();
      let step1Duration = 0;
      let step2Duration = 0;
      const userTier = req.user?.tierSlug || "free";

      // Step 1: Image Generation with Gemini
      console.log("Step 1: Generating Mien wedding portrait...");
      
      const referenceImage = getMienAttireReference();
      
      const imagePrompt = `Generate a 16:9 widescreen cinematic image. Transform the subject(s) in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. Use the attached reference image showing authentic Mien male and female traditional attire as your visual guide. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image (but no turban for this cinematic scene). He is in his prime athletic tone body. The shot will be a medium shot of a rugged action hero walking confidently towards the camera, away from a massive, fiery explosion in the background. The subject is wearing sunglasses looking calm and indifferent, not looking back. Debris and sparks flying in the air, dynamic lighting, orange and teal color grading, cinematic composition, depth of field, 8k resolution, hyper-realistic, volumetric lighting, smoke and fire engulfing the sides.

If a female subject is present, dress her in attire matching the RIGHT side of the reference image (but no head jewelry for this scene). She has a toned athletic body. The character(s) is in a vast rice field with towering scenic mountain somewhere in the forests of Vietnam. The rice plants are at the height of the character's waist, covering portions of the feet and below. The character is walking towards the camera with both hands stretched towards each side touching the plants. The character is feeling the sensation of the plants on the skin of the fingertips as the hands are brushing through the leaf of the plant without grabbing on the plants. Character looks at the camera with intent and purpose with the hair flowing by the breeze of the wind. The head is uplifted a bit, with a look of confidence. Golden hour lighting, warm sun-drenched atmosphere with strong backlighting and lens flare. Ethereal glow, dreamlike quality. Shallow depth of field. Ridley Scott style, 35mm film grain, anamorphic lens, epic, emotional, masterpiece, 8k resolution.

If there are female and male characters present, dress both in their respective attire from the reference image (but no headpieces on for this scene). A wide photographic shot of a young couple recreating the famous "Titanic" pose at the bow of a massive ocean liner at sunset. The female character with her arms extended wide, looking at the horizon. The man holds her securely from behind. Both are now toned and more athletic. The sun is a fiery orb setting over the sea, casting a warm golden glow on everything. The ocean is calm. Romantic, emotional atmosphere.`;

      const dressMeAI = getDressMeAI();
      
      const movieStarContentParts: any[] = [
        { text: imagePrompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg",
          },
        },
      ];

      if (referenceImage) {
        movieStarContentParts.push({
          inlineData: {
            data: referenceImage,
            mimeType: "image/png",
          },
        });
      }
      
      let generatedImageBase64: string;
      try {
        const imageResponse = await dressMeAI.models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: [
            {
              role: "user",
              parts: movieStarContentParts,
            },
          ],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              imageSize: "2K",
            },
          },
        });

        const candidate = imageResponse.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

        if (!imagePart?.inlineData?.data) {
          throw new Error("No image generated in step 1");
        }

        generatedImageBase64 = imagePart.inlineData.data;
        console.log("Step 1 complete: Image generated successfully");
        
        // Send image immediately to client via SSE
        sendSSE("image", { imageBase64: generatedImageBase64 });
        sendSSE("progress", { step: 2, message: "Filming your scene..." });
      } catch (imageError) {
        console.error("Step 1 failed:", imageError);
        // Refund credits
        await db.execute(sql`UPDATE users SET credits = credits + ${MOVIE_STAR_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: MOVIE_STAR_CREDIT_COST,
          balanceAfter: newBalance + MOVIE_STAR_CREDIT_COST,
          feature: "movie_star",
          description: "Refund: Image generation failed",
        });
        sendSSE("error", { error: "Step 1 failed: Unable to generate image. Credits have been refunded." });
        return res.end();
      }

      // Track step 1 duration
      step1Duration = Date.now() - step1StartTime;
      const step2StartTime = Date.now();

      // Step 2: Video Generation with Veo 3.1 Fast via Vertex AI
      console.log("Step 2: Generating cinematic video with Veo 3.1 Fast via Vertex AI...");
      
      const videoPrompt = `If it's only one female character, she walks forward with a tracking camera of the subject. Audio: Ethereal and haunting piano soundtrack.

If it's only one male character, he walks forward with a tracking camera of the subject, explosions seen and heard from back and sides. Music is fast electric guitar soundtrack.

If there are female and male characters present, camera will pan around subjects. Music is a romantic piano soundtrack.`;
      
      let videoBase64: string | null = null;
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        if (!projectId) {
          throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured for video generation");
        }

        const accessToken = await getVertexAIAccessToken();
        const location = "us-central1";
        const modelId = "veo-3.1-fast-generate-001";
        
        const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
        
        console.log("Calling Vertex AI endpoint:", vertexEndpoint);

        const veoResponse = await fetch(vertexEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instances: [{
              prompt: videoPrompt,
              image: {
                bytesBase64Encoded: generatedImageBase64,
                mimeType: "image/png"
              }
            }],
            parameters: {
              durationSeconds: 4,
              resolution: "1080p",
              aspectRatio: "16:9"
            }
          })
        });

        if (!veoResponse.ok) {
          console.error("Vertex AI Veo API error:", veoResponse.status);
          throw new Error(`Vertex AI Veo API error: ${veoResponse.status}`);
        }

        const veoResult = await veoResponse.json();
        console.log("Vertex AI initial response:", JSON.stringify(veoResult, null, 2).substring(0, 1000));
        
        // Poll for operation completion
        let operationName = veoResult.name;
        if (!operationName) {
          throw new Error("No operation name returned from Vertex AI");
        }
        
        let videoData = null;
        let attempts = 0;
        const maxAttempts = 180; // 6 minutes max wait for video generation

        console.log("Polling operation:", operationName);
        
        // Use the fetchPredictOperation endpoint for polling Veo video generation
        // This requires a POST request with the operationName in the body
        const fetchOperationUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
        
        console.log("Fetch operation URL:", fetchOperationUrl);
        
        // Initial 5-second delay before first poll
        console.log("Waiting 5 seconds before starting to poll...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const pollResponse = await fetch(fetchOperationUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operationName: operationName
            })
          });
          
          if (!pollResponse.ok) {
            const errorText = await pollResponse.text();
            console.error("Poll request failed:", pollResponse.status);
            attempts++;
            continue;
          }
          
          const pollResult = await pollResponse.json();
          
          if (pollResult.done) {
            if (pollResult.error) {
              console.error("Video generation error:", pollResult.error);
              throw new Error(pollResult.error.message || "Video generation failed");
            }
            videoData = pollResult.response;
            console.log("Veo poll complete, response structure:", JSON.stringify(videoData, null, 2).substring(0, 2000));
            break;
          }
          
          if (attempts % 10 === 0) {
            console.log(`Still polling... attempt ${attempts}/${maxAttempts}`);
          }
          attempts++;
        }

        if (!videoData) {
          throw new Error("Video generation timed out");
        }

        // Extract video from Vertex AI response structure
        console.log("Attempting to extract video data from response...");
        
        // Try Vertex AI structure: predictions[0].video or predictions[0].bytesBase64Encoded
        let generatedVideo = videoData.predictions?.[0];
        
        // Try generateVideoResponse structure (fallback)
        if (!generatedVideo) {
          generatedVideo = videoData.generateVideoResponse?.generatedSamples?.[0]?.video;
        }
        
        // Try generatedSamples directly
        if (!generatedVideo) {
          generatedVideo = videoData.generatedSamples?.[0]?.video;
        }
        
        // Try videos array
        if (!generatedVideo) {
          generatedVideo = videoData.videos?.[0];
        }
        
        console.log("Found video object:", generatedVideo ? "yes" : "no");
        
        if (generatedVideo?.bytesBase64Encoded) {
          videoBase64 = generatedVideo.bytesBase64Encoded;
          console.log("Got video as bytesBase64Encoded, size:", videoBase64?.length);
        } else if (generatedVideo?.video?.bytesBase64Encoded) {
          videoBase64 = generatedVideo.video.bytesBase64Encoded;
          console.log("Got video from nested structure, size:", videoBase64?.length);
        } else if (generatedVideo?.gcsUri || generatedVideo?.video?.gcsUri) {
          const gcsUri = generatedVideo.gcsUri || generatedVideo.video.gcsUri;
          console.log("Video stored at GCS URI:", gcsUri);
          
          // Convert GCS URI to download URL and fetch
          const bucketPath = gcsUri.replace("gs://", "");
          const downloadUrl = `https://storage.googleapis.com/${bucketPath}`;
          
          const videoFetch = await fetch(downloadUrl, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          
          if (!videoFetch.ok) {
            console.error("Video download from GCS failed:", videoFetch.status);
            throw new Error(`Video download failed: ${videoFetch.status}`);
          }
          
          const videoBuffer = await videoFetch.arrayBuffer();
          videoBase64 = Buffer.from(videoBuffer).toString("base64");
          console.log("Got video from GCS, size:", videoBase64.length, "bytes");
        } else if (typeof generatedVideo === 'string' && generatedVideo.length > 10000) {
          // The video itself might be a base64 string directly
          videoBase64 = generatedVideo;
          console.log("Got video as direct base64 string, size:", videoBase64.length);
        }

        if (!videoBase64) {
          console.error("Could not extract video. Full response:", JSON.stringify(videoData, null, 2));
          throw new Error("No video data in response");
        }
        
        if (videoBase64.length < 10000) {
          console.error("Video file too small, likely an error response");
          throw new Error("Video file too small - download may have failed");
        }

        console.log("Step 2 complete: Video generated successfully, final size:", videoBase64.length);
      } catch (videoError) {
        console.error("Step 2 failed:", videoError);
        // Refund credits
        await db.execute(sql`UPDATE users SET credits = credits + ${MOVIE_STAR_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: MOVIE_STAR_CREDIT_COST,
          balanceAfter: newBalance + MOVIE_STAR_CREDIT_COST,
          feature: "movie_star",
          description: "Refund: Video generation failed",
        });
        sendSSE("error", { 
          error: "Step 2 failed: Unable to generate video. Credits have been refunded.",
          imageGenerated: true
        });
        return res.end();
      }

      // Save video and image to R2 or local filesystem
      const videoBuffer = Buffer.from(videoBase64, "base64");
      const imageBuffer = Buffer.from(generatedImageBase64, "base64");
      let videoUrl: string;
      let imageUrl: string;

      if (isR2Configured()) {
        const [videoResult, imageResult] = await Promise.all([
          uploadToR2(videoBuffer, { folder: "videos/movie-star", contentType: "video/mp4" }),
          uploadToR2(imageBuffer, { folder: "images/movie-star", contentType: "image/png" }),
        ]);
        videoUrl = videoResult.url;
        imageUrl = imageResult.url;
        console.log("Movie Star saved to R2:", { videoUrl, imageUrl });
      } else {
        const videoFilename = `movie-star-${crypto.randomUUID()}.mp4`;
        const imageFilename = `movie-star-${crypto.randomUUID()}.png`;
        const videoDir = path.join(process.cwd(), "public", "generated");
        
        if (!fs.existsSync(videoDir)) {
          fs.mkdirSync(videoDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(videoDir, videoFilename), videoBuffer);
        fs.writeFileSync(path.join(videoDir, imageFilename), imageBuffer);
        videoUrl = `/generated/${videoFilename}`;
        imageUrl = `/generated/${imageFilename}`;
        console.log("Movie Star saved locally:", { videoUrl, imageUrl });
      }

      // Save to art_generations table
      await db.insert(artGenerations).values({
        userId,
        type: "movie_star",
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        prompt: imagePrompt.substring(0, 500),
        creditsUsed: MOVIE_STAR_CREDIT_COST,
      });

      // Track step 2 duration
      step2Duration = Date.now() - step2StartTime;
      const totalDuration = step1Duration + step2Duration;

      console.log("Mien Movie Star generation complete!");

      // Log successful feature usage with detailed step metrics
      logFeatureUsage({
        userId,
        category: "ai_generation",
        featureName: "movie_star",
        subFeature: "cinematic_mien_video",
        creditsUsed: MOVIE_STAR_CREDIT_COST,
        durationMs: totalDuration,
        metadata: {
          videoUrl,
          imageUrl,
          step1DurationMs: step1Duration,
          step2DurationMs: step2Duration,
          totalDurationMs: totalDuration,
          step1Model: "gemini-3-pro-image-preview",
          step2Model: "veo-3.1-fast",
          userTier,
          outputAspectRatio: "16:9",
          videoDurationSeconds: 4,
          videoResolution: "1080p",
          step1Success: true,
          step2Success: true,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Send video URL via SSE (not base64 - prevents memory issues)
      sendSSE("video", { videoUrl: videoUrl });
      sendSSE("complete", {
        success: true,
        creditsUsed: MOVIE_STAR_CREDIT_COST
      });
      res.end();

      // Award XP (fire and forget)
      awardXp(userId, "ai_video_movie_star").catch(() => {});
    } catch (error) {
      console.error("Movie Star error:", error);
      const userTier = req.user?.tierSlug || "free";
      // Log failed usage with step info
      logFeatureUsage({
        userId,
        category: "ai_generation",
        featureName: "movie_star",
        subFeature: "cinematic_mien_video",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          userTier,
          step1DurationMs: step1Duration || 0,
          step2DurationMs: step2Duration || 0,
          outputAspectRatio: "16:9",
          step1Model: "gemini-3-pro-image-preview",
          step2Model: "veo-3.1-fast",
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      // Attempt refund on unexpected error
      try {
        await db.execute(sql`UPDATE users SET credits = credits + ${MOVIE_STAR_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: MOVIE_STAR_CREDIT_COST,
          balanceAfter: 0, // Will be recalculated
          feature: "movie_star",
          description: "Refund: Unexpected error",
        });
      } catch (refundError) {
        console.error("Refund failed:", refundError);
      }
      sendSSE("error", { error: "Movie Star generation failed. Credits have been refunded." });
      res.end();
    }
  });

  // TikTok Dance endpoint - 160 credits, generates image then video with SSE (9:16 vertical)
  app.post("/api/tiktok-dance", requireAuth, async (req: AuthenticatedRequest, res) => {
    const TIKTOK_DANCE_CREDIT_COST = 160;
    const userId = req.user!.id;
    
    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    const sendSSE = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        sendSSE("error", { error: "An image is required" });
        return res.end();
      }

      // Check credits before starting
      const userResult = await db.select().from(users).where(eq(users.id, userId));
      if (!userResult.length || userResult[0].credits < TIKTOK_DANCE_CREDIT_COST) {
        sendSSE("error", { 
          error: "Insufficient credits", 
          required: TIKTOK_DANCE_CREDIT_COST,
          available: userResult[0]?.credits || 0,
          redirect_url: "/subscription",
          status: 402
        });
        return res.end();
      }

      // Deduct credits atomically
      const deductResult = await db.execute(
        sql`UPDATE users SET credits = credits - ${TIKTOK_DANCE_CREDIT_COST} WHERE id = ${userId} AND credits >= ${TIKTOK_DANCE_CREDIT_COST} RETURNING credits`
      );
      
      if (!deductResult.rows?.length) {
        sendSSE("error", { error: "Failed to deduct credits", redirect_url: "/subscription", status: 402 });
        return res.end();
      }

      const newBalance = (deductResult.rows[0] as any).credits;

      // Log credit transaction
      await db.insert(creditTransactions).values({
        userId,
        type: "deduction",
        amount: -TIKTOK_DANCE_CREDIT_COST,
        balanceAfter: newBalance,
        feature: "tiktok_dance",
        description: "TikTok Dance video generation",
      });

      console.log("Starting TikTok Dance generation...");
      sendSSE("progress", { step: 1, message: "Creating your dance portrait..." });

      // Track timing for each step
      const step1StartTime = Date.now();
      let step1Duration = 0;
      let step2Duration = 0;
      const userTier = req.user?.tierSlug || "free";

      // Step 1: Image Generation with Gemini (9:16 vertical format)
      console.log("Step 1: Generating TikTok dance portrait...");
      
      const referenceImage = getMienAttireReference();
      
      const imagePrompt = `Generate a 9:16 vertical still. Transform the subject(s) in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. Use the attached reference image showing authentic Mien male and female traditional attire as your visual guide. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image (but no turban for this dance scene). He is in his prime athletic tone body. The shot will be on a Brooklyn rooftop at golden hour. The character is performing a hip hop dance move.

If a female subject is present, dress her in attire matching the RIGHT side of the reference image (but no head jewelry for this scene). She has a toned athletic body. The character(s) is on top of the cliff of a towering scenic mountain in north Vietnam. She is performing a hip hop dance move.

If there are female and male characters present, dress both in their respective attire from the reference image (but no headpieces on for this scene). The characters will be in a futuristic Y2K-inspired dance scene inside a sleek, minimalist dance studio performing a synchronized dance.`;

      const dressMeAI = getDressMeAI();
      
      const tiktokContentParts: any[] = [
        { text: imagePrompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg",
          },
        },
      ];

      if (referenceImage) {
        tiktokContentParts.push({
          inlineData: {
            data: referenceImage,
            mimeType: "image/png",
          },
        });
      }
      
      let generatedImageBase64: string;
      try {
        const imageResponse = await dressMeAI.models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: [
            {
              role: "user",
              parts: tiktokContentParts,
            },
          ],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              imageSize: "2K",
            },
          },
        });

        const candidate = imageResponse.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

        if (!imagePart?.inlineData?.data) {
          throw new Error("No image generated in step 1");
        }

        generatedImageBase64 = imagePart.inlineData.data;
        console.log("Step 1 complete: TikTok dance image generated successfully");
        
        // Send image immediately to client via SSE
        sendSSE("image", { imageBase64: generatedImageBase64 });
        sendSSE("progress", { step: 2, message: "Creating your dance video..." });
      } catch (imageError) {
        console.error("Step 1 failed:", imageError);
        // Refund credits
        await db.execute(sql`UPDATE users SET credits = credits + ${TIKTOK_DANCE_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: TIKTOK_DANCE_CREDIT_COST,
          balanceAfter: newBalance + TIKTOK_DANCE_CREDIT_COST,
          feature: "tiktok_dance",
          description: "Refund: Image generation failed",
        });
        sendSSE("error", { error: "Step 1 failed: Unable to generate image. Credits have been refunded." });
        return res.end();
      }

      // Track step 1 duration
      step1Duration = Date.now() - step1StartTime;
      const step2StartTime = Date.now();

      // Step 2: Video Generation with Veo 3.1 Fast via Vertex AI (9:16 vertical)
      console.log("Step 2: Generating TikTok dance video with Veo 3.1 Fast via Vertex AI...");
      
      const videoPrompt = `The camera pans zooms and pans with a kpop soundtrack as the subject(s) perform synchronized tiktok dance.`;
      
      let videoBase64: string | null = null;
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        if (!projectId) {
          throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured for video generation");
        }

        const accessToken = await getVertexAIAccessToken();
        const location = "us-central1";
        const modelId = "veo-3.1-fast-generate-001";
        
        const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
        
        console.log("Calling Vertex AI endpoint for TikTok Dance:", vertexEndpoint);

        const veoResponse = await fetch(vertexEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instances: [{
              prompt: videoPrompt,
              image: {
                bytesBase64Encoded: generatedImageBase64,
                mimeType: "image/png"
              }
            }],
            parameters: {
              durationSeconds: 4,
              resolution: "1080p",
              aspectRatio: "9:16"
            }
          })
        });

        if (!veoResponse.ok) {
          console.error("Vertex AI Veo API error:", veoResponse.status);
          throw new Error(`Vertex AI Veo API error: ${veoResponse.status}`);
        }

        const veoResult = await veoResponse.json();
        console.log("Vertex AI initial response:", JSON.stringify(veoResult, null, 2).substring(0, 1000));
        
        // Poll for operation completion
        let operationName = veoResult.name;
        if (!operationName) {
          throw new Error("No operation name returned from Vertex AI");
        }
        
        let videoData = null;
        let attempts = 0;
        const maxAttempts = 180;

        console.log("Polling operation:", operationName);
        
        const fetchOperationUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
        
        console.log("Fetch operation URL:", fetchOperationUrl);
        
        console.log("Waiting 5 seconds before starting to poll...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const pollResponse = await fetch(fetchOperationUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operationName: operationName
            })
          });
          
          if (!pollResponse.ok) {
            const errorText = await pollResponse.text();
            console.error("Poll request failed:", pollResponse.status);
            attempts++;
            continue;
          }
          
          const pollResult = await pollResponse.json();
          
          if (pollResult.done) {
            if (pollResult.error) {
              console.error("Video generation error:", pollResult.error);
              throw new Error(pollResult.error.message || "Video generation failed");
            }
            videoData = pollResult.response;
            console.log("Veo poll complete, response structure:", JSON.stringify(videoData, null, 2).substring(0, 2000));
            break;
          }
          
          if (attempts % 10 === 0) {
            console.log(`Still polling... attempt ${attempts}/${maxAttempts}`);
          }
          attempts++;
        }

        if (!videoData) {
          throw new Error("Video generation timed out");
        }

        // Extract video from Vertex AI response structure
        console.log("Attempting to extract video data from response...");
        
        let generatedVideo = videoData.predictions?.[0];
        
        if (!generatedVideo) {
          generatedVideo = videoData.generateVideoResponse?.generatedSamples?.[0]?.video;
        }
        
        if (!generatedVideo) {
          generatedVideo = videoData.generatedSamples?.[0]?.video;
        }
        
        if (!generatedVideo) {
          generatedVideo = videoData.videos?.[0];
        }
        
        console.log("Found video object:", generatedVideo ? "yes" : "no");
        
        if (generatedVideo?.bytesBase64Encoded) {
          videoBase64 = generatedVideo.bytesBase64Encoded;
          console.log("Got video as bytesBase64Encoded, size:", videoBase64?.length);
        } else if (generatedVideo?.video?.bytesBase64Encoded) {
          videoBase64 = generatedVideo.video.bytesBase64Encoded;
          console.log("Got video from nested structure, size:", videoBase64?.length);
        } else if (generatedVideo?.gcsUri || generatedVideo?.video?.gcsUri) {
          const gcsUri = generatedVideo.gcsUri || generatedVideo.video.gcsUri;
          console.log("Video stored at GCS URI:", gcsUri);
          
          const bucketPath = gcsUri.replace("gs://", "");
          const downloadUrl = `https://storage.googleapis.com/${bucketPath}`;
          
          const videoFetch = await fetch(downloadUrl, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          
          if (!videoFetch.ok) {
            console.error("Video download from GCS failed:", videoFetch.status);
            throw new Error(`Video download failed: ${videoFetch.status}`);
          }
          
          const videoBuffer = await videoFetch.arrayBuffer();
          videoBase64 = Buffer.from(videoBuffer).toString("base64");
          console.log("Got video from GCS, size:", videoBase64.length, "bytes");
        } else if (typeof generatedVideo === 'string' && generatedVideo.length > 10000) {
          videoBase64 = generatedVideo;
          console.log("Got video as direct base64 string, size:", videoBase64.length);
        }

        if (!videoBase64) {
          console.error("Could not extract video. Full response:", JSON.stringify(videoData, null, 2));
          throw new Error("No video data in response");
        }
        
        if (videoBase64.length < 10000) {
          console.error("Video file too small, likely an error response");
          throw new Error("Video file too small - download may have failed");
        }

        console.log("Step 2 complete: TikTok dance video generated successfully, final size:", videoBase64.length);
      } catch (videoError) {
        console.error("Step 2 failed:", videoError);
        // Refund credits
        await db.execute(sql`UPDATE users SET credits = credits + ${TIKTOK_DANCE_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: TIKTOK_DANCE_CREDIT_COST,
          balanceAfter: newBalance + TIKTOK_DANCE_CREDIT_COST,
          feature: "tiktok_dance",
          description: "Refund: Video generation failed",
        });
        sendSSE("error", { 
          error: "Step 2 failed: Unable to generate video. Credits have been refunded.",
          imageGenerated: true
        });
        return res.end();
      }

      // Save video and image to R2 or local filesystem
      const videoBuffer = Buffer.from(videoBase64, "base64");
      const imageBuffer = Buffer.from(generatedImageBase64, "base64");
      let videoUrl: string;
      let imageUrl: string;

      if (isR2Configured()) {
        const [videoResult, imageResult] = await Promise.all([
          uploadToR2(videoBuffer, { folder: "videos/tiktok-dance", contentType: "video/mp4" }),
          uploadToR2(imageBuffer, { folder: "images/tiktok-dance", contentType: "image/png" }),
        ]);
        videoUrl = videoResult.url;
        imageUrl = imageResult.url;
        console.log("TikTok Dance saved to R2:", { videoUrl, imageUrl });
      } else {
        const videoFilename = `tiktok-dance-${crypto.randomUUID()}.mp4`;
        const imageFilename = `tiktok-dance-${crypto.randomUUID()}.png`;
        const videoDir = path.join(process.cwd(), "public", "generated");
        
        if (!fs.existsSync(videoDir)) {
          fs.mkdirSync(videoDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(videoDir, videoFilename), videoBuffer);
        fs.writeFileSync(path.join(videoDir, imageFilename), imageBuffer);
        videoUrl = `/generated/${videoFilename}`;
        imageUrl = `/generated/${imageFilename}`;
        console.log("TikTok Dance saved locally:", { videoUrl, imageUrl });
      }

      // Save to art_generations table
      await db.insert(artGenerations).values({
        userId,
        type: "tiktok_dance",
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        prompt: imagePrompt.substring(0, 500),
        creditsUsed: TIKTOK_DANCE_CREDIT_COST,
      });

      // Track step 2 duration
      step2Duration = Date.now() - step2StartTime;
      const totalDuration = step1Duration + step2Duration;

      console.log("TikTok Dance generation complete!");

      // Log successful feature usage with detailed step metrics
      logFeatureUsage({
        userId,
        category: "ai_generation",
        featureName: "tiktok_dance",
        subFeature: "vertical_dance_video",
        creditsUsed: TIKTOK_DANCE_CREDIT_COST,
        durationMs: totalDuration,
        metadata: {
          videoUrl,
          imageUrl,
          step1DurationMs: step1Duration,
          step2DurationMs: step2Duration,
          totalDurationMs: totalDuration,
          step1Model: "gemini-3-pro-image-preview",
          step2Model: "veo-3.1-fast",
          userTier,
          outputAspectRatio: "9:16",
          videoDurationSeconds: 4,
          videoResolution: "1080p",
          step1Success: true,
          step2Success: true,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      sendSSE("video", { videoUrl: videoUrl });
      sendSSE("complete", {
        success: true,
        creditsUsed: TIKTOK_DANCE_CREDIT_COST
      });
      res.end();

      // Award XP (fire and forget)
      awardXp(userId, "ai_video_tiktok_dance").catch(() => {});
    } catch (error) {
      console.error("TikTok Dance error:", error);
      const userTier = req.user?.tierSlug || "free";
      // Log failed usage with step info
      logFeatureUsage({
        userId,
        category: "ai_generation",
        featureName: "tiktok_dance",
        subFeature: "vertical_dance_video",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          userTier,
          step1DurationMs: step1Duration || 0,
          step2DurationMs: step2Duration || 0,
          outputAspectRatio: "9:16",
          step1Model: "gemini-3-pro-image-preview",
          step2Model: "veo-3.1-fast",
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      try {
        await db.execute(sql`UPDATE users SET credits = credits + ${TIKTOK_DANCE_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: TIKTOK_DANCE_CREDIT_COST,
          balanceAfter: 0,
          feature: "tiktok_dance",
          description: "Refund: Unexpected error",
        });
      } catch (refundError) {
        console.error("Refund failed:", refundError);
      }
      sendSSE("error", { error: "TikTok Dance generation failed. Credits have been refunded." });
      res.end();
    }
  });

  // Get user's art generations history
  app.get("/api/art-generations", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const generations = await db.select()
        .from(artGenerations)
        .where(eq(artGenerations.userId, userId))
        .orderBy(desc(artGenerations.createdAt));
      
      res.json(generations);
    } catch (error) {
      console.error("Error fetching art generations:", error);
      res.status(500).json({ error: "Failed to fetch art generations" });
    }
  });

  app.get("/api/system-prompt", requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({
      systemPromptToEnglish,
      systemPromptToMien,
      videoExtractionPrompt,
    });
  });

  app.post("/api/transcribe-audio", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { audioData, mimeType } = req.body;

      if (!audioData) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      console.log("Transcribing audio with Gemini 2.5 Flash...");
      const rawResponse = await transcribeAudio(audioData, mimeType || "audio/m4a");
      console.log("Audio transcription complete, length:", rawResponse.length);

      let summary = "";
      let transcription = rawResponse;

      const summaryMatch = rawResponse.match(/SUMMARY:\s*(.+?)(?=TRANSCRIPTION:|$)/si);
      const transcriptionMatch = rawResponse.match(/TRANSCRIPTION:\s*(.+)/si);

      if (summaryMatch) {
        summary = summaryMatch[1].trim();
      }
      if (transcriptionMatch) {
        transcription = transcriptionMatch[1].trim();
      }

      res.json({ summary, transcription });
    } catch (error) {
      console.error("Audio transcription error:", error);
      res.status(500).json({ error: "Audio transcription failed. Please try again." });
    }
  });

  // OAuth state store for CSRF protection (state -> { provider, createdAt })
  const oauthStateStore = new Map<string, { provider: string; createdAt: number }>();
  // Clean up expired states every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [state, entry] of oauthStateStore.entries()) {
      if (now - entry.createdAt > 10 * 60 * 1000) oauthStateStore.delete(state);
    }
  }, 5 * 60 * 1000);

  app.get("/api/auth/config/:provider", (req, res) => {
    const { provider } = req.params;
    const config = getOAuthConfig(provider);

    if (!config) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    // Generate a state token for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");
    oauthStateStore.set(state, { provider, createdAt: Date.now() });

    res.json({
      clientId: config.clientId,
      hasCredentials: !!(config.clientId && config.clientSecret),
      state,
    });
  });

  app.post("/api/auth/callback/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
      const { code, redirectUri, codeVerifier, state } = req.body;

      // Validate OAuth state parameter if provided (CSRF protection)
      if (state) {
        const storedState = oauthStateStore.get(state);
        if (!storedState || storedState.provider !== provider) {
          return res.status(400).json({ error: "Invalid OAuth state parameter" });
        }
        // State is single-use
        oauthStateStore.delete(state);
        // Check expiry (10 minutes)
        if (Date.now() - storedState.createdAt > 10 * 60 * 1000) {
          return res.status(400).json({ error: "OAuth state expired, please try again" });
        }
      }

      const config = getOAuthConfig(provider);
      if (!config || !config.clientId || !config.clientSecret) {
        return res.status(400).json({ error: `${provider} OAuth not configured. Please add API credentials.` });
      }

      let tokenResponse;
      let userInfo;

      if (provider === "google") {
        const tokenParams = new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: codeVerifier || "",
        });

        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenParams,
        });
        tokenResponse = await tokenRes.json();

        if (tokenResponse.error) {
          return res.status(400).json({ error: tokenResponse.error_description || tokenResponse.error });
        }

        const userRes = await fetch(config.userInfoUrl, {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        userInfo = await userRes.json();

        const user = await findOrCreateUser(
          "google",
          userInfo.id,
          userInfo.email || "",
          userInfo.name || "User",
          userInfo.picture || ""
        );

        const fullUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }

        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "google" });

        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: userInfo.email || "", connected: true },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: "", connected: false },
              { provider: "instagram", username: "", connected: false },
              { provider: "facebook", username: "", connected: false },
              { provider: "twitter", username: "", connected: false },
            ],
          },
        });
      }

      if (provider === "facebook") {
        const tokenUrl = `${config.tokenUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${config.clientSecret}&code=${code}`;
        const tokenRes = await fetch(tokenUrl);
        tokenResponse = await tokenRes.json();

        if (tokenResponse.error) {
          return res.status(400).json({ error: tokenResponse.error.message || "Facebook auth failed" });
        }

        const userRes = await fetch(`${config.userInfoUrl}&access_token=${tokenResponse.access_token}`);
        userInfo = await userRes.json();

        const user = await findOrCreateUser(
          "facebook",
          userInfo.id,
          userInfo.email || "",
          userInfo.name || "User",
          userInfo.picture?.data?.url || ""
        );

        const fullUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }

        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "facebook" });

        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: "", connected: false },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: "", connected: false },
              { provider: "instagram", username: "", connected: false },
              { provider: "facebook", username: userInfo.name || "", connected: true },
              { provider: "twitter", username: "", connected: false },
            ],
          },
        });
      }

      if (provider === "twitter") {
        const tokenParams = new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: config.clientId,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier || "",
        });

        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
          },
          body: tokenParams,
        });
        tokenResponse = await tokenRes.json();

        if (tokenResponse.error) {
          return res.status(400).json({ error: tokenResponse.error_description || tokenResponse.error });
        }

        const userRes = await fetch(config.userInfoUrl, {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        userInfo = await userRes.json();

        const user = await findOrCreateUser(
          "twitter",
          userInfo.data.id,
          "",
          userInfo.data.name || userInfo.data.username || "User",
          userInfo.data.profile_image_url || ""
        );

        const fullUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }

        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "twitter" });

        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: "", connected: false },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: "", connected: false },
              { provider: "instagram", username: "", connected: false },
              { provider: "facebook", username: "", connected: false },
              { provider: "twitter", username: `@${userInfo.data.username}`, connected: true },
            ],
          },
        });
      }

      if (provider === "instagram") {
        const formData = new URLSearchParams();
        formData.append("client_id", config.clientId);
        formData.append("client_secret", config.clientSecret);
        formData.append("grant_type", "authorization_code");
        formData.append("redirect_uri", redirectUri);
        formData.append("code", code);

        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData,
        });
        tokenResponse = await tokenRes.json();

        if (tokenResponse.error_message) {
          return res.status(400).json({ error: tokenResponse.error_message || "Instagram auth failed" });
        }

        const userRes = await fetch(`${config.userInfoUrl}&access_token=${tokenResponse.access_token}`);
        userInfo = await userRes.json();

        const user = await findOrCreateUser(
          "instagram",
          userInfo.id,
          "",
          userInfo.username || "User",
          ""
        );

        const fullUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }

        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "instagram" });

        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: "", connected: false },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: "", connected: false },
              { provider: "instagram", username: `@${userInfo.username}`, connected: true },
              { provider: "facebook", username: "", connected: false },
              { provider: "twitter", username: "", connected: false },
            ],
          },
        });
      }

      if (provider === "tiktok") {
        const tokenParams = new URLSearchParams({
          client_key: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code_verifier: codeVerifier || "",
        });

        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenParams,
        });
        tokenResponse = await tokenRes.json();

        if (tokenResponse.error) {
          return res.status(400).json({ error: tokenResponse.error_description || tokenResponse.error });
        }

        const userRes = await fetch(`${config.userInfoUrl}?fields=open_id,display_name,avatar_url`, {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        userInfo = await userRes.json();

        const userData = userInfo.data?.user || {};

        const user = await findOrCreateUser(
          "tiktok",
          userData.open_id,
          "",
          userData.display_name || "User",
          userData.avatar_url || ""
        );

        const fullUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }

        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "tiktok" });

        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: "", connected: false },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: userData.display_name || "", connected: true },
              { provider: "instagram", username: "", connected: false },
              { provider: "facebook", username: "", connected: false },
              { provider: "twitter", username: "", connected: false },
            ],
          },
        });
      }

      return res.status(400).json({ error: `Provider ${provider} is not supported` });
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Authentication failed. Please try again." });
    }
  });

  app.get("/api/auth/session", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.substring(7);

    try {
      const sessionResults = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
        .limit(1);

      if (sessionResults.length === 0) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const session = sessionResults[0];

      const userResults = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

      if (userResults.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }

      const user = userResults[0];

      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          provider: user.provider,
          role: user.role,
          connectedAccounts: [
            { provider: "google", username: user.provider === "google" ? user.email : "", connected: user.provider === "google" },
            { provider: "youtube", username: "", connected: false },
            { provider: "tiktok", username: user.provider === "tiktok" ? user.displayName : "", connected: user.provider === "tiktok" },
            { provider: "instagram", username: user.provider === "instagram" ? user.displayName : "", connected: user.provider === "instagram" },
            { provider: "facebook", username: user.provider === "facebook" ? user.displayName : "", connected: user.provider === "facebook" },
            { provider: "twitter", username: user.provider === "twitter" ? user.displayName : "", connected: user.provider === "twitter" },
          ],
          totalXp: user.totalXp ?? 0,
          level: user.level ?? 1,
        },
      });
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ error: "Failed to check session" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        await db.delete(sessions).where(eq(sessions.token, token));
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    res.json({ success: true });
  });

  app.get("/api/admin/users", requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json({ users: allUsers });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (role && !["user", "moderator", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const updatedUser = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, id))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      await logActivity(req.user!.id, "admin_update_user_role", {
        targetUserId: id,
        newRole: role,
      });

      pushUserUpdated({
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        displayName: updatedUser[0].displayName,
        avatar: updatedUser[0].avatar,
        provider: updatedUser[0].provider,
        role: updatedUser[0].role,
        createdAt: updatedUser[0].createdAt.toISOString(),
        lastLoginAt: updatedUser[0].lastLoginAt.toISOString(),
      });

      res.json({ user: updatedUser[0] });
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/admin/metrics", requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [totalUsersResult] = await db.select({ count: count() }).from(users);
      const [activeSessionsResult] = await db
        .select({ count: count() })
        .from(sessions)
        .where(gt(sessions.expiresAt, now));
      const [dauResult] = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.lastLoginAt, oneDayAgo));
      const [adminCountResult] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, "admin"));
      const [modCountResult] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, "moderator"));
      const [groupsCountResult] = await db.select({ count: count() }).from(groups);
      const [postsCountResult] = await db.select({ count: count() }).from(posts);

      res.json({
        metrics: {
          totalUsers: totalUsersResult.count,
          activeSessions: activeSessionsResult.count,
          dailyActiveUsers: dauResult.count,
          groupsCount: groupsCountResult.count,
          postsCount: postsCountResult.count,
          adminCount: adminCountResult.count,
          moderatorCount: modCountResult.count,
        },
      });
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/admin/groups", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const allGroups = await db.select().from(groups).orderBy(desc(groups.createdAt));
      res.json({ groups: allGroups });
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/admin/groups", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Group name is required" });
      }

      const newGroup = await db
        .insert(groups)
        .values({ name, description })
        .returning();

      await logActivity(req.user!.id, "admin_create_group", {
        groupId: newGroup[0].id,
        groupName: name,
      });

      pushGroupCreated({
        id: newGroup[0].id,
        name: newGroup[0].name,
        description: newGroup[0].description,
        memberCount: 0,
        createdAt: newGroup[0].createdAt.toISOString(),
      });

      res.json({ group: newGroup[0] });
    } catch (error) {
      console.error("Failed to create group:", error);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.patch("/api/admin/groups/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const updatedGroup = await db
        .update(groups)
        .set({ name, description })
        .where(eq(groups.id, id))
        .returning();

      if (updatedGroup.length === 0) {
        return res.status(404).json({ error: "Group not found" });
      }

      await logActivity(req.user!.id, "admin_update_group", {
        groupId: id,
        newName: name,
      });

      const [memberCountResult] = await db.select({ count: count() }).from(groupMembers).where(eq(groupMembers.groupId, id));
      pushGroupUpdated({
        id: updatedGroup[0].id,
        name: updatedGroup[0].name,
        description: updatedGroup[0].description,
        memberCount: memberCountResult.count,
        createdAt: updatedGroup[0].createdAt.toISOString(),
      });

      res.json({ group: updatedGroup[0] });
    } catch (error) {
      console.error("Failed to update group:", error);
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  app.delete("/api/admin/groups/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const deletedGroup = await db
        .delete(groups)
        .where(eq(groups.id, id))
        .returning();

      if (deletedGroup.length === 0) {
        return res.status(404).json({ error: "Group not found" });
      }

      await logActivity(req.user!.id, "admin_delete_group", {
        groupId: id,
        groupName: deletedGroup[0].name,
      });

      pushGroupDeleted(id);

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete group:", error);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  app.post("/api/admin/groups/:id/members", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { userId, role = "user" } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const groupExists = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
      if (groupExists.length === 0) {
        return res.status(404).json({ error: "Group not found" });
      }

      const userExists = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userExists.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const existingMember = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, userId)))
        .limit(1);

      if (existingMember.length > 0) {
        return res.status(400).json({ error: "User is already a member of this group" });
      }

      const newMember = await db
        .insert(groupMembers)
        .values({ groupId: id, userId, role })
        .returning();

      await logActivity(req.user!.id, "admin_add_group_member", {
        groupId: id,
        memberId: userId,
        role,
      });

      res.json({ member: newMember[0] });
    } catch (error) {
      console.error("Failed to add group member:", error);
      res.status(500).json({ error: "Failed to add group member" });
    }
  });

  app.delete("/api/admin/groups/:id/members/:userId", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id, userId } = req.params;

      const deletedMember = await db
        .delete(groupMembers)
        .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, userId)))
        .returning();

      if (deletedMember.length === 0) {
        return res.status(404).json({ error: "Member not found in group" });
      }

      await logActivity(req.user!.id, "admin_remove_group_member", {
        groupId: id,
        memberId: userId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove group member:", error);
      res.status(500).json({ error: "Failed to remove group member" });
    }
  });

  // User search API - stricter rate limit to prevent enumeration
  const searchRateLimitStore = new Map<string, { count: number; resetAt: number }>();
  app.get("/api/users/search", (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = searchRateLimitStore.get(ip);
    if (!entry || now > entry.resetAt) {
      searchRateLimitStore.set(ip, { count: 1, resetAt: now + 60000 });
      return next();
    }
    if (entry.count >= 15) {
      return res.status(429).json({ error: "Too many search requests" });
    }
    entry.count++;
    next();
  }, async (req, res) => {
    try {
      const { q, limit: queryLimit = "20", offset: queryOffset = "0" } = req.query;
      const searchQuery = String(q || "").trim().toLowerCase();

      if (!searchQuery || searchQuery.length < 2) {
        return res.json({ users: [], total: 0 });
      }

      // Search users by displayName (case-insensitive) using ilike
      const searchResults = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
          bio: users.bio,
        })
        .from(users)
        .where(sql`LOWER(${users.displayName}) LIKE ${"%" + searchQuery + "%"}`)
        .limit(Number(queryLimit))
        .offset(Number(queryOffset));

      const formattedUsers = searchResults.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        avatar: u.avatar,
        bio: u.bio,
        username: u.displayName?.toLowerCase().replace(/\s+/g, "") || "user",
      }));

      res.json({ users: formattedUsers });
    } catch (error) {
      console.error("Failed to search users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Update current user profile
  app.patch("/api/users/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { displayName, avatar, bio } = req.body;

      const updateData: Record<string, unknown> = {};

      if (displayName !== undefined) {
        if (typeof displayName !== "string" || displayName.trim().length < 1 || displayName.trim().length > 100) {
          return res.status(400).json({ error: "Display name must be 1-100 characters" });
        }
        updateData.displayName = displayName.trim();
      }

      if (bio !== undefined) {
        if (bio !== null && typeof bio === "string") {
          if (bio.length > 500) {
            return res.status(400).json({ error: "Bio must be 500 characters or less" });
          }
          updateData.bio = bio.trim() || null;
        } else if (bio === null) {
          updateData.bio = null;
        }
      }

      if (avatar !== undefined) {
        if (avatar !== null && typeof avatar === "string" && avatar.trim()) {
          updateData.avatar = avatar.trim();
        } else if (avatar === null) {
          updateData.avatar = null;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json({
        user: {
          id: updatedUser[0].id,
          displayName: updatedUser[0].displayName,
          avatar: updatedUser[0].avatar,
          bio: updatedUser[0].bio,
          email: updatedUser[0].email,
        },
      });
    } catch (error) {
      console.error("Failed to update user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Upload avatar
  app.post("/api/users/me/avatar", requireAuth, upload.single("avatar"), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const filename = `avatar-${req.user!.id}-${Date.now()}.webp`;
      const filepath = path.join(UPLOAD_DIR, filename);

      await sharp(req.file.buffer)
        .resize(400, 400, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(filepath);

      const avatarUrl = `/uploads/images/${filename}`;

      await db
        .update(users)
        .set({ avatar: avatarUrl })
        .where(eq(users.id, req.user!.id));

      res.json({ avatar: avatarUrl });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });

  // Get user privacy settings
  app.get("/api/users/me/privacy", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await db
        .select({ defaultPostVisibility: users.defaultPostVisibility })
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ defaultPostVisibility: user[0].defaultPostVisibility });
    } catch (error) {
      console.error("Failed to get privacy settings:", error);
      res.status(500).json({ error: "Failed to get privacy settings" });
    }
  });

  // Update user privacy settings
  app.patch("/api/users/me/privacy", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { defaultPostVisibility } = req.body;

      const validVisibilities = ["public", "followers", "private"];
      if (!validVisibilities.includes(defaultPostVisibility)) {
        return res.status(400).json({ error: "Invalid visibility option. Must be: public, followers, or private" });
      }

      await db
        .update(users)
        .set({ defaultPostVisibility })
        .where(eq(users.id, req.user!.id));

      res.json({ defaultPostVisibility });
    } catch (error) {
      console.error("Failed to update privacy settings:", error);
      res.status(500).json({ error: "Failed to update privacy settings" });
    }
  });

  // User profile API
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      let currentUserId: string | null = null;

      // Check for optional auth
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const session = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
        if (session.length > 0) {
          currentUserId = session[0].userId;
        }
      }

      const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get follower/following counts
      const [followerCount] = await db.select({ count: count() }).from(follows).where(eq(follows.followeeId, id));
      const [followingCount] = await db.select({ count: count() }).from(follows).where(eq(follows.followerId, id));

      // Check if current user follows this user and if they follow back (friend)
      let isFollowing = false;
      let isFriend = false;
      let isMuted = false;
      let isBlocked = false;
      let isBlockedBy = false;

      if (currentUserId && currentUserId !== id) {
        const followCheck = await db.select().from(follows)
          .where(and(eq(follows.followerId, currentUserId), eq(follows.followeeId, id)))
          .limit(1);
        isFollowing = followCheck.length > 0;

        // Check if they follow back (mutual follow = friend)
        if (isFollowing) {
          const followBackCheck = await db.select().from(follows)
            .where(and(eq(follows.followerId, id), eq(follows.followeeId, currentUserId)))
            .limit(1);
          isFriend = followBackCheck.length > 0;
        }

        // Check mute and block status
        const [muteCheck] = await db.select().from(userMutes)
          .where(and(eq(userMutes.muterId, currentUserId), eq(userMutes.mutedId, id)))
          .limit(1);

        const [blockCheck] = await db.select().from(userBlocks)
          .where(and(eq(userBlocks.blockerId, currentUserId), eq(userBlocks.blockedId, id)))
          .limit(1);

        const [blockedByCheck] = await db.select().from(userBlocks)
          .where(and(eq(userBlocks.blockerId, id), eq(userBlocks.blockedId, currentUserId)))
          .limit(1);

        isMuted = !!muteCheck;
        isBlocked = !!blockCheck;
        isBlockedBy = !!blockedByCheck;
      }

      // Get post count (only public posts for non-owners)
      const [postCount] = await db.select({ count: count() }).from(posts).where(eq(posts.userId, id));

      res.json({
        user: {
          id: user[0].id,
          displayName: user[0].displayName,
          avatar: user[0].avatar,
          bio: user[0].bio,
          role: user[0].role,
          createdAt: user[0].createdAt,
          followersCount: followerCount.count,
          followingCount: followingCount.count,
          postsCount: postCount.count,
          isFollowing,
          isFriend,
          isMuted,
          isBlocked,
          isBlockedBy,
          totalXp: user[0].totalXp ?? 0,
          level: user[0].level ?? 1,
          tierSlug: user[0].tierSlug,
        },
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // User posts API
  app.get("/api/users/:id/posts", async (req, res) => {
    try {
      const { id: userId } = req.params;
      const authHeader = req.headers.authorization;
      let currentUserId: string | null = null;

      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const session = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
        if (session.length > 0) {
          currentUserId = session[0].userId;
        }
      }

      // Check if there's a block relationship between users
      if (currentUserId && currentUserId !== userId) {
        const blockCheck = await db.select().from(userBlocks)
          .where(or(
            and(eq(userBlocks.blockerId, currentUserId), eq(userBlocks.blockedId, userId)),
            and(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedId, currentUserId))
          ))
          .limit(1);

        if (blockCheck.length > 0) {
          return res.json({ posts: [], blocked: true });
        }
      }

      // Determine visibility filter based on relationship
      let visibilityFilter;
      if (currentUserId === userId) {
        // User viewing own profile: show all posts
        visibilityFilter = eq(posts.userId, userId);
      } else if (currentUserId) {
        // Check if current user follows this user
        const isFollower = await db.select().from(follows)
          .where(and(eq(follows.followerId, currentUserId), eq(follows.followeeId, userId)))
          .limit(1);

        if (isFollower.length > 0) {
          // Follower: show public + followers posts
          visibilityFilter = and(
            eq(posts.userId, userId),
            or(eq(posts.visibility, "public"), eq(posts.visibility, "followers"))
          );
        } else {
          // Not following: only public posts
          visibilityFilter = and(eq(posts.userId, userId), eq(posts.visibility, "public"));
        }
      } else {
        // Not logged in: only public posts
        visibilityFilter = and(eq(posts.userId, userId), eq(posts.visibility, "public"));
      }

      const userPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            displayName: users.displayName,
            avatar: users.avatar,
            tierSlug: users.tierSlug,
            level: users.level,
            role: users.role,
          },
          video: uploadedVideos,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(uploadedVideos, eq(posts.videoId, uploadedVideos.id))
        .where(visibilityFilter)
        .orderBy(desc(posts.createdAt));

      let likedPostIds = new Set<string>();
      if (currentUserId) {
        const userLikes = await db
          .select({ postId: likes.postId })
          .from(likes)
          .where(eq(likes.userId, currentUserId));
        likedPostIds = new Set(userLikes.map((l) => l.postId));
      }

      const formattedPosts = userPosts.map((row) => ({
        id: row.post.id,
        userId: row.post.userId,
        user: row.user
          ? {
              ...row.user,
              username: row.user.displayName?.toLowerCase().replace(/\s+/g, "") || "user",
            }
          : null,
        platform: row.post.platform,
        mediaUrl: row.post.mediaUrl,
        embedCode: row.post.embedCode,
        caption: row.post.caption,
        captionRich: row.post.captionRich,
        images: row.post.images || [],
        video: row.video ? {
          id: row.video.id,
          bunnyVideoId: row.video.bunnyVideoId,
          title: row.video.title,
          duration: row.video.duration,
          width: row.video.width,
          height: row.video.height,
          playbackUrl: row.video.playbackUrl,
          thumbnailUrl: row.video.thumbnailUrl,
          previewUrl: row.video.previewUrl,
          status: row.video.status,
          encodingProgress: row.video.encodingProgress,
          failureReason: row.video.failureReason,
          createdAt: row.video.createdAt,
          readyAt: row.video.readyAt,
        } : null,
        videoId: row.post.videoId,
        visibility: row.post.visibility,
        likesCount: parseInt(row.post.likesCount || "0"),
        commentsCount: parseInt(row.post.commentsCount || "0"),
        isLiked: likedPostIds.has(row.post.id),
        createdAt: row.post.createdAt,
      }));

      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  });

  // Active users API - returns users who logged in within 30 days
  app.get("/api/users/active", async (req, res) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const activeUsers = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
        })
        .from(users)
        .where(gte(users.lastLoginAt, thirtyDaysAgo))
        .limit(50);

      const formattedUsers = activeUsers.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        avatar: u.avatar,
        username: u.displayName?.toLowerCase().replace(/\s+/g, "") || "user",
      }));

      res.json({ users: formattedUsers });
    } catch (error) {
      console.error("Failed to fetch active users:", error);
      res.status(500).json({ error: "Failed to fetch active users" });
    }
  });

  // Trending posts API
  app.get("/api/posts/trending", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let currentUserId: string | null = null;

      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const session = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
        if (session.length > 0) {
          currentUserId = session[0].userId;
        }
      }

      // Get blocked and muted users for filtering
      let blockedUserIds = new Set<string>();
      let mutedUserIds = new Set<string>();

      if (currentUserId) {
        // Get users that current user blocked
        const blockedByMe = await db
          .select({ blockedId: userBlocks.blockedId })
          .from(userBlocks)
          .where(eq(userBlocks.blockerId, currentUserId));

        // Get users that blocked current user
        const blockedMe = await db
          .select({ blockerId: userBlocks.blockerId })
          .from(userBlocks)
          .where(eq(userBlocks.blockedId, currentUserId));

        blockedByMe.forEach(b => blockedUserIds.add(b.blockedId));
        blockedMe.forEach(b => blockedUserIds.add(b.blockerId));

        // Get muted users
        const mutedByMe = await db
          .select({ mutedId: userMutes.mutedId })
          .from(userMutes)
          .where(eq(userMutes.muterId, currentUserId));

        mutedByMe.forEach(m => mutedUserIds.add(m.mutedId));
      }

      // Build query - exclude blocked users from the query
      let whereClause = eq(posts.visibility, "public");
      if (blockedUserIds.size > 0) {
        const blockedArray = Array.from(blockedUserIds);
        whereClause = and(
          eq(posts.visibility, "public"),
          not(inArray(posts.userId, blockedArray))
        )!;
      }

      // Only show public posts in trending
      const allPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            displayName: users.displayName,
            avatar: users.avatar,
            tierSlug: users.tierSlug,
            level: users.level,
            role: users.role,
          },
          video: uploadedVideos,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(uploadedVideos, eq(posts.videoId, uploadedVideos.id))
        .where(whereClause);

      let likedPostIds = new Set<string>();
      if (currentUserId) {
        const userLikes = await db
          .select({ postId: likes.postId })
          .from(likes)
          .where(eq(likes.userId, currentUserId));
        likedPostIds = new Set(userLikes.map((l) => l.postId));
      }

      const now = Date.now();
      const HOUR = 3600000;

      const scoredPosts = allPosts.map((row) => {
        const likesCount = parseInt(row.post.likesCount || "0");
        const commentsCount = parseInt(row.post.commentsCount || "0");
        const ageHours = (now - new Date(row.post.createdAt).getTime()) / HOUR;
        const recencyDecay = Math.max(0, 1 - ageHours / 168);
        const trendingScore = (likesCount * 2 + commentsCount * 3) * (0.5 + recencyDecay * 0.5);

        return {
          id: row.post.id,
          userId: row.post.userId,
          user: row.user
            ? {
                ...row.user,
                username: row.user.displayName?.toLowerCase().replace(/\s+/g, "") || "user",
              }
            : null,
          platform: row.post.platform,
          mediaUrl: row.post.mediaUrl,
          embedCode: row.post.embedCode,
          caption: row.post.caption,
          captionRich: row.post.captionRich,
          images: row.post.images || [],
          video: row.video ? {
            id: row.video.id,
            bunnyVideoId: row.video.bunnyVideoId,
            title: row.video.title,
            duration: row.video.duration,
            width: row.video.width,
            height: row.video.height,
            playbackUrl: row.video.playbackUrl,
            thumbnailUrl: row.video.thumbnailUrl,
            previewUrl: row.video.previewUrl,
            status: row.video.status,
            encodingProgress: row.video.encodingProgress,
            failureReason: row.video.failureReason,
            createdAt: row.video.createdAt,
            readyAt: row.video.readyAt,
          } : null,
          videoId: row.post.videoId,
          visibility: row.post.visibility,
          likesCount,
          commentsCount,
          isLiked: likedPostIds.has(row.post.id),
          createdAt: row.post.createdAt,
          trendingScore,
        };
      });

      // Filter out muted users from trending results
      const filteredPosts = scoredPosts.filter(post => !mutedUserIds.has(post.userId));
      // Sort by tier priority (gold>purple>blue>free), then by trending score
      filteredPosts.sort((a, b) => {
        const tierDiff = getTierPriority(b.user?.tierSlug ?? undefined) - getTierPriority(a.user?.tierSlug ?? undefined);
        if (tierDiff !== 0) return tierDiff;
        return b.trendingScore - a.trendingScore;
      });

      res.json({ posts: filteredPosts.slice(0, 50) });
    } catch (error) {
      console.error("Failed to fetch trending posts:", error);
      res.status(500).json({ error: "Failed to fetch trending posts" });
    }
  });

  // Following posts - posts from users the current user follows
  app.get("/api/posts/following", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userFollows = await db
        .select({ followeeId: follows.followeeId })
        .from(follows)
        .where(eq(follows.followerId, req.user!.id));

      let followeeIds = userFollows.map((f) => f.followeeId);

      if (followeeIds.length === 0) {
        return res.json({ posts: [] });
      }

      // Get blocked users (both directions) and filter them from followees
      const blockedByMe = await db
        .select({ blockedId: userBlocks.blockedId })
        .from(userBlocks)
        .where(eq(userBlocks.blockerId, req.user!.id));

      const blockedMe = await db
        .select({ blockerId: userBlocks.blockerId })
        .from(userBlocks)
        .where(eq(userBlocks.blockedId, req.user!.id));

      const blockedUserIds = new Set([
        ...blockedByMe.map(b => b.blockedId),
        ...blockedMe.map(b => b.blockerId)
      ]);

      // Filter out blocked users from followees
      followeeIds = followeeIds.filter(id => !blockedUserIds.has(id));

      if (followeeIds.length === 0) {
        return res.json({ posts: [] });
      }

      // Show public + followers-only posts from followed users
      const followingPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            displayName: users.displayName,
            avatar: users.avatar,
            tierSlug: users.tierSlug,
            level: users.level,
            role: users.role,
          },
          video: uploadedVideos,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(uploadedVideos, eq(posts.videoId, uploadedVideos.id))
        .where(and(
          inArray(posts.userId, followeeIds),
          or(eq(posts.visibility, "public"), eq(posts.visibility, "followers"))
        ))
        .orderBy(desc(posts.createdAt));

      const userLikes = await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(eq(likes.userId, req.user!.id));

      const likedPostIds = new Set(userLikes.map((l) => l.postId));

      const formattedPosts = followingPosts.map((row) => ({
        id: row.post.id,
        userId: row.post.userId,
        user: row.user
          ? {
              ...row.user,
              username: row.user.displayName?.toLowerCase().replace(/\s+/g, "") || "user",
            }
          : null,
        platform: row.post.platform,
        mediaUrl: row.post.mediaUrl,
        embedCode: row.post.embedCode,
        caption: row.post.caption,
        captionRich: row.post.captionRich,
        images: row.post.images || [],
        video: row.video ? {
          id: row.video.id,
          bunnyVideoId: row.video.bunnyVideoId,
          title: row.video.title,
          duration: row.video.duration,
          width: row.video.width,
          height: row.video.height,
          playbackUrl: row.video.playbackUrl,
          thumbnailUrl: row.video.thumbnailUrl,
          previewUrl: row.video.previewUrl,
          status: row.video.status,
          encodingProgress: row.video.encodingProgress,
          failureReason: row.video.failureReason,
          createdAt: row.video.createdAt,
          readyAt: row.video.readyAt,
        } : null,
        videoId: row.post.videoId,
        visibility: row.post.visibility,
        likesCount: parseInt(row.post.likesCount || "0"),
        commentsCount: parseInt(row.post.commentsCount || "0"),
        isLiked: likedPostIds.has(row.post.id),
        createdAt: row.post.createdAt,
      }));

      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error("Failed to fetch following posts:", error);
      res.status(500).json({ error: "Failed to fetch following posts" });
    }
  });

  // Follow/Unfollow a user
  app.post("/api/users/:userId/follow", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      
      if (userId === req.user!.id) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      const existingFollow = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, req.user!.id), eq(follows.followeeId, userId)))
        .limit(1);

      if (existingFollow.length > 0) {
        await db.delete(follows).where(
          and(eq(follows.followerId, req.user!.id), eq(follows.followeeId, userId))
        );
        res.json({ following: false });
      } else {
        await db.insert(follows).values({
          followerId: req.user!.id,
          followeeId: userId,
        });

        // Send push notification to the user being followed
        sendNewFollowerNotification(userId, req.user!.id).catch((err) => {
          console.error("Failed to send follow notification:", err);
        });

        res.json({ following: true });
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      res.status(500).json({ error: "Failed to toggle follow" });
    }
  });

  // Check if following a user
  app.get("/api/users/:userId/following", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;

      const existingFollow = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, req.user!.id), eq(follows.followeeId, userId)))
        .limit(1);

      res.json({ following: existingFollow.length > 0 });
    } catch (error) {
      console.error("Failed to check follow status:", error);
      res.status(500).json({ error: "Failed to check follow status" });
    }
  });

  // Mute/Unmute a user
  app.post("/api/users/:userId/mute", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user!.id) {
        return res.status(400).json({ error: "Cannot mute yourself" });
      }

      // Check if target user exists
      const targetUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if target user is an admin
      if (targetUser[0].role === "admin") {
        return res.status(403).json({ error: "Cannot mute administrators" });
      }

      // Check existing mute
      const existingMute = await db
        .select()
        .from(userMutes)
        .where(and(eq(userMutes.muterId, req.user!.id), eq(userMutes.mutedId, userId)))
        .limit(1);

      if (existingMute.length > 0) {
        // Unmute
        await db.delete(userMutes).where(eq(userMutes.id, existingMute[0].id));
        res.json({ muted: false, message: "User unmuted" });
      } else {
        // Mute
        await db.insert(userMutes).values({
          muterId: req.user!.id,
          mutedId: userId,
        });
        res.json({ muted: true, message: "User muted" });
      }
    } catch (error) {
      console.error("Failed to toggle mute:", error);
      res.status(500).json({ error: "Failed to update mute status" });
    }
  });

  // Block/Unblock a user
  app.post("/api/users/:userId/block", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user!.id) {
        return res.status(400).json({ error: "Cannot block yourself" });
      }

      // Check if target user exists
      const targetUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if target user is an admin
      if (targetUser[0].role === "admin") {
        return res.status(403).json({ error: "Cannot block administrators" });
      }

      // Check existing block
      const existingBlock = await db
        .select()
        .from(userBlocks)
        .where(and(eq(userBlocks.blockerId, req.user!.id), eq(userBlocks.blockedId, userId)))
        .limit(1);

      if (existingBlock.length > 0) {
        // Unblock
        await db.delete(userBlocks).where(eq(userBlocks.id, existingBlock[0].id));
        res.json({ blocked: false, message: "User unblocked" });
      } else {
        // Block - also remove any follows and mutes between users
        await db.delete(follows).where(
          or(
            and(eq(follows.followerId, req.user!.id), eq(follows.followeeId, userId)),
            and(eq(follows.followerId, userId), eq(follows.followeeId, req.user!.id))
          )
        );
        await db.delete(userMutes).where(
          or(
            and(eq(userMutes.muterId, req.user!.id), eq(userMutes.mutedId, userId)),
            and(eq(userMutes.muterId, userId), eq(userMutes.mutedId, req.user!.id))
          )
        );

        await db.insert(userBlocks).values({
          blockerId: req.user!.id,
          blockedId: userId,
        });
        res.json({ blocked: true, message: "User blocked" });
      }
    } catch (error) {
      console.error("Failed to toggle block:", error);
      res.status(500).json({ error: "Failed to update block status" });
    }
  });

  // Get list of muted users
  app.get("/api/users/me/muted", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const mutedUsers = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
          mutedAt: userMutes.createdAt,
        })
        .from(userMutes)
        .innerJoin(users, eq(userMutes.mutedId, users.id))
        .where(eq(userMutes.muterId, req.user!.id))
        .orderBy(desc(userMutes.createdAt));

      res.json({ mutedUsers });
    } catch (error) {
      console.error("Failed to fetch muted users:", error);
      res.status(500).json({ error: "Failed to fetch muted users" });
    }
  });

  // Get list of blocked users
  app.get("/api/users/me/blocked", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const blockedUsers = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
          blockedAt: userBlocks.createdAt,
        })
        .from(userBlocks)
        .innerJoin(users, eq(userBlocks.blockedId, users.id))
        .where(eq(userBlocks.blockerId, req.user!.id))
        .orderBy(desc(userBlocks.createdAt));

      res.json({ blockedUsers });
    } catch (error) {
      console.error("Failed to fetch blocked users:", error);
      res.status(500).json({ error: "Failed to fetch blocked users" });
    }
  });

  // Posts API
  app.get("/api/posts", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const allPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            displayName: users.displayName,
            avatar: users.avatar,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .orderBy(desc(posts.createdAt));

      const userLikes = await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(eq(likes.userId, req.user!.id));

      const likedPostIds = new Set(userLikes.map((l) => l.postId));

      const formattedPosts = allPosts.map((row) => ({
        id: row.post.id,
        userId: row.post.userId,
        user: row.user
          ? {
              ...row.user,
              username: row.user.displayName?.toLowerCase().replace(/\s+/g, "") || "user",
            }
          : null,
        platform: row.post.platform,
        mediaUrl: row.post.mediaUrl,
        embedCode: row.post.embedCode,
        caption: row.post.caption,
        captionRich: row.post.captionRich,
        images: row.post.images || [],
        likesCount: parseInt(row.post.likesCount || "0"),
        commentsCount: parseInt(row.post.commentsCount || "0"),
        isLiked: likedPostIds.has(row.post.id),
        createdAt: row.post.createdAt,
      }));

      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/upload/images-base64", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { images: base64Images } = req.body;
      if (!base64Images || !Array.isArray(base64Images) || base64Images.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      if (base64Images.length > 10) {
        return res.status(400).json({ error: "Maximum 10 images allowed" });
      }

      const uploadedImages: string[] = [];
      const useR2 = isR2Configured();

      for (let base64Data of base64Images) {
        if (base64Data.includes("base64,")) {
          base64Data = base64Data.split("base64,")[1];
        }

        const buffer = Buffer.from(base64Data, "base64");
        const processedBuffer = await sharp(buffer)
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        if (useR2) {
          const result = await uploadToR2(processedBuffer, {
            folder: "images",
            contentType: "image/webp",
          });
          // Use proxy URL instead of direct R2 URL for better compatibility
          uploadedImages.push(`/api/images/${result.key}`);
        } else {
          const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.webp`;
          const filepath = path.join(UPLOAD_DIR, filename);
          await sharp(processedBuffer).toFile(filepath);
          uploadedImages.push(`/uploads/images/${filename}`);
        }
      }

      res.json({ images: uploadedImages });
    } catch (error) {
      console.error("Failed to upload base64 images:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  });

  app.post("/api/upload/images", requireAuth, upload.array("images", 10), async (req: AuthenticatedRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      const uploadedImages: string[] = [];
      const useR2 = isR2Configured();

      for (const file of files) {
        const processedBuffer = await sharp(file.buffer)
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        if (useR2) {
          const result = await uploadToR2(processedBuffer, {
            folder: "images",
            contentType: "image/webp",
          });
          // Use proxy URL instead of direct R2 URL for better compatibility
          uploadedImages.push(`/api/images/${result.key}`);
        } else {
          const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.webp`;
          const filepath = path.join(UPLOAD_DIR, filename);
          await sharp(processedBuffer).toFile(filepath);
          uploadedImages.push(`/uploads/images/${filename}`);
        }
      }

      res.json({ images: uploadedImages });
    } catch (error) {
      console.error("Failed to upload images:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  });

  // Image proxy endpoint for R2 images
  app.get("/api/images/:folder/:filename", async (req, res) => {
    try {
      const { folder, filename } = req.params;
      const key = `${folder}/${filename}`;

      const result = await getObjectFromR2(key);
      if (!result) {
        return res.status(404).json({ error: "Image not found" });
      }

      res.set("Content-Type", result.contentType);
      res.set("Cache-Control", "public, max-age=31536000");
      res.send(result.body);
    } catch (error) {
      console.error("Failed to serve image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // ============================================
  // VIDEO UPLOAD ROUTES (Bunny.net Integration)
  // ============================================

  /**
   * Create video upload - returns upload URL for direct client upload to Bunny
   */
  app.post("/api/videos/create", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { filename, title, fileSize, mimeType } = req.body;

      // Validation
      if (!filename) {
        return res.status(400).json({ error: "Filename is required" });
      }

      if (fileSize && fileSize > VIDEO_MAX_SIZE_BYTES) {
        return res.status(400).json({
          error: `File too large. Maximum size is ${VIDEO_MAX_SIZE_BYTES / (1024 * 1024)}MB`,
        });
      }

      if (mimeType && !VIDEO_ALLOWED_TYPES.includes(mimeType)) {
        return res.status(400).json({
          error: "Invalid video format. Supported: MP4, MOV, AVI, WebM, MKV",
        });
      }

      const result = await createVideoUpload(req.user!.id, filename, title);

      // Return video ID for server-proxied upload (API key stays server-side)
      res.json({
        videoId: result.videoId,
        maxSizeBytes: VIDEO_MAX_SIZE_BYTES,
      });
    } catch (error) {
      console.error("[Video] Create failed:", error);
      res.status(500).json({ error: "Failed to create video upload" });
    }
  });

  /**
   * Proxy video upload to Bunny.net (keeps API key server-side)
   */
  app.put("/api/videos/:id/upload", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const chunks: Buffer[] = [];

      req.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on("end", async () => {
        const videoBuffer = Buffer.concat(chunks);

        if (videoBuffer.length > VIDEO_MAX_SIZE_BYTES) {
          return res.status(413).json({ error: "File too large" });
        }

        const result = await proxyVideoUpload(id, req.user!.id, videoBuffer);

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({ success: true });
      });

      req.on("error", (error) => {
        console.error("[Video] Upload stream error:", error);
        res.status(500).json({ error: "Upload failed" });
      });
    } catch (error) {
      console.error("[Video] Proxy upload failed:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  /**
   * Get video details
   */
  app.get("/api/videos/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const video = await getVideoById(id);

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Allow owner or admin to see full details
      const isOwner = video.userId === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isOwner && !isAdmin && video.status !== "ready") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({ video });
    } catch (error) {
      console.error("[Video] Get failed:", error);
      res.status(500).json({ error: "Failed to get video" });
    }
  });

  /**
   * Quick status check for polling
   */
  app.get("/api/videos/:id/status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const status = await getVideoStatus(id);

      if (!status) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json(status);
    } catch (error) {
      console.error("[Video] Status check failed:", error);
      res.status(500).json({ error: "Failed to get video status" });
    }
  });

  /**
   * Delete video
   */
  app.delete("/api/videos/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await deleteVideo(id, req.user!.id);

      if (!deleted) {
        return res.status(404).json({ error: "Video not found or access denied" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Video] Delete failed:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // ============================================
  // BUNNY.NET WEBHOOK
  // ============================================

  /**
   * Bunny.net webhook endpoint for video status updates
   *
   * WEBHOOK URL: https://mienkingdom.com/webhooks/bunny/video
   *
   * This endpoint receives POST requests from Bunny.net when video
   * encoding status changes. Payload format:
   * {
   *   "VideoLibraryId": 133,
   *   "VideoGuid": "657bb740-a71b-4529-a012-528021c31a92",
   *   "Status": 3
   * }
   */
  app.post("/webhooks/bunny/video", async (req: Request, res: Response) => {
    try {
      // Verify webhook signing secret if configured
      const webhookSecret = process.env.BUNNY_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers["x-bunny-webhook-secret"] || req.headers["authorization"];
        if (signature !== webhookSecret) {
          console.warn("[Bunny Webhook] Invalid webhook secret");
          return res.status(401).json({ error: "Unauthorized" });
        }
      }

      const { VideoLibraryId, VideoGuid, Status } = req.body;

      console.log("[Bunny Webhook] Received:", { VideoLibraryId, VideoGuid, Status });

      // Validate required fields
      if (!VideoLibraryId || !VideoGuid || Status === undefined) {
        console.warn("[Bunny Webhook] Invalid payload:", req.body);
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      // Verify the library ID matches our configured library
      const expectedLibraryId = parseInt(process.env.BUNNY_LIBRARY_ID || "0");
      if (expectedLibraryId && VideoLibraryId !== expectedLibraryId) {
        console.warn(
          `[Bunny Webhook] Library ID mismatch: expected ${expectedLibraryId}, got ${VideoLibraryId}`
        );
        return res.status(200).json({ received: true, processed: false });
      }

      // Process the webhook
      await updateVideoFromWebhook(VideoGuid, VideoLibraryId, Status);

      console.log(
        `[Bunny Webhook] Processed: VideoGuid=${VideoGuid}, Status=${Status}`
      );

      res.status(200).json({ received: true, processed: true });
    } catch (error) {
      console.error("[Bunny Webhook] Processing error:", error);
      // Return 200 to prevent Bunny from retrying on our errors
      res.status(200).json({ received: true, processed: false, error: "Internal error" });
    }
  });

  app.post("/api/posts", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { platform, mediaUrl, embedCode, caption, captionRich, images, visibility, videoId } = req.body;

      const hasContent = caption?.trim() || mediaUrl?.trim() || (images && images.length > 0) || videoId;
      if (!hasContent) {
        return res.status(400).json({ error: "Please add some text, images, or a video" });
      }

      // Validate video if provided
      if (videoId) {
        const video = await getVideoById(videoId, req.user!.id);
        if (!video) {
          return res.status(400).json({ error: "Video not found or not owned by you" });
        }
        if (video.status !== "ready") {
          return res.status(400).json({
            error: "Video is still processing. Please wait until encoding is complete.",
            videoStatus: video.status,
          });
        }
      }

      const validPlatforms = ["youtube", "tiktok", "instagram", "facebook", "twitter", null];
      if (platform && !validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      // Validate visibility
      const validVisibilities = ["public", "followers", "private"];
      const postVisibility = validVisibilities.includes(visibility) ? visibility : "public";

      const newPost = await db
        .insert(posts)
        .values({
          userId: req.user!.id,
          platform: mediaUrl?.trim() ? (platform || "youtube") : null,
          mediaUrl: mediaUrl?.trim() || null,
          embedCode: embedCode || null,
          caption: caption?.trim() || null,
          captionRich: captionRich || null,
          images: images || [],
          videoId: videoId || null,
          visibility: postVisibility,
        })
        .returning();

      // Send push notifications to followers (only for non-private posts)
      if (postVisibility !== "private") {
        sendNewPostNotifications(req.user!.id, newPost[0].id).catch((err) => {
          console.error("Failed to send new post notifications:", err);
        });
      }

      res.json({ post: newPost[0] });

      // Award XP (fire and forget)
      awardXp(req.user!.id, "post_created").catch(() => {});
    } catch (error) {
      console.error("Failed to create post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post[0].userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to delete this post" });
      }

      await db.delete(posts).where(eq(posts.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.patch("/api/posts/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { caption, captionRich, mediaUrl, platform, images, visibility } = req.body;

      const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post[0].userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to edit this post" });
      }

      const validPlatforms = ["youtube", "tiktok", "instagram", "facebook", "twitter"];
      if (platform !== undefined && platform !== null && !validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      const updateData: Record<string, unknown> = {};
      if (caption !== undefined) updateData.caption = caption?.trim() || null;
      if (captionRich !== undefined) updateData.captionRich = captionRich || null;
      if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl?.trim() || null;
      if (platform !== undefined) updateData.platform = mediaUrl?.trim() ? (platform || "youtube") : null;
      if (images !== undefined) updateData.images = images || [];

      // Handle visibility update
      if (visibility !== undefined) {
        const validVisibilities = ["public", "followers", "private"];
        if (validVisibilities.includes(visibility)) {
          updateData.visibility = visibility;
        }
      }

      const updatedPost = await db
        .update(posts)
        .set(updateData)
        .where(eq(posts.id, id))
        .returning();

      res.json({ post: updatedPost[0] });
    } catch (error) {
      console.error("Failed to update post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.post("/api/posts/:id/like", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const existingLike = await db
        .select()
        .from(likes)
        .where(and(eq(likes.postId, id), eq(likes.userId, req.user!.id)))
        .limit(1);

      if (existingLike.length > 0) {
        await db.delete(likes).where(eq(likes.id, existingLike[0].id));
        await db
          .update(posts)
          .set({ likesCount: String(Math.max(0, parseInt(post[0].likesCount || "0") - 1)) })
          .where(eq(posts.id, id));
        res.json({ liked: false });
      } else {
        await db.insert(likes).values({ userId: req.user!.id, postId: id });
        await db
          .update(posts)
          .set({ likesCount: String(parseInt(post[0].likesCount || "0") + 1) })
          .where(eq(posts.id, id));
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;

      const allComments = await db
        .select()
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, id))
        .orderBy(desc(comments.createdAt));

      const formattedComments = allComments.map((row) => ({
        id: row.comments.id,
        content: row.comments.content,
        createdAt: row.comments.createdAt,
        user: row.users ? {
          id: row.users.id,
          displayName: row.users.displayName,
          avatar: row.users.avatar,
        } : null,
      }));

      res.json({ comments: formattedComments });
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Comment cannot be empty" });
      }

      const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const newComment = await db
        .insert(comments)
        .values({ userId: req.user!.id, postId: id, content: content.trim() })
        .returning();

      await db
        .update(posts)
        .set({ commentsCount: String(parseInt(post[0].commentsCount || "0") + 1) })
        .where(eq(posts.id, id));

      res.json({
        comment: {
          ...newComment[0],
          user: {
            id: req.user!.id,
            displayName: req.user!.displayName,
            avatar: req.user!.avatar,
          },
        },
      });

      // Award XP (fire and forget)
      awardXp(req.user!.id, "comment_created").catch(() => {});
    } catch (error) {
      console.error("Failed to create comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const comment = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
      if (comment.length === 0) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (comment[0].userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to delete this comment" });
      }

      await db.delete(comments).where(eq(comments.id, id));

      const post = await db.select().from(posts).where(eq(posts.id, comment[0].postId)).limit(1);
      if (post.length > 0) {
        await db
          .update(posts)
          .set({ commentsCount: String(Math.max(0, parseInt(post[0].commentsCount || "0") - 1)) })
          .where(eq(posts.id, comment[0].postId));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.post("/api/admin/impersonate/:userId", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;

      const targetUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "impersonate_user",
        metadata: { targetUserId: userId, targetEmail: targetUser[0].email },
      });

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour max for impersonation

      await db.insert(sessions).values({
        userId: targetUser[0].id,
        token,
        expiresAt,
      });

      res.json({
        token,
        user: {
          id: targetUser[0].id,
          email: targetUser[0].email,
          displayName: targetUser[0].displayName,
          avatar: targetUser[0].avatar,
          role: targetUser[0].role,
        },
        impersonated: true,
      });
    } catch (error) {
      console.error("Failed to impersonate user:", error);
      res.status(500).json({ error: "Failed to impersonate user" });
    }
  });

  app.post("/api/admin/seed-demo-users", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const demoUsers = [
        { email: "mienliu@demo.com", displayName: "Mien Liu", provider: "demo", providerUserId: "demo-1", avatar: null },
        { email: "saeyang@demo.com", displayName: "Sae Yang", provider: "demo", providerUserId: "demo-2", avatar: null },
        { email: "waaneng@demo.com", displayName: "Waa Neng", provider: "demo", providerUserId: "demo-3", avatar: null },
        { email: "fongmeng@demo.com", displayName: "Fong Meng", provider: "demo", providerUserId: "demo-4", avatar: null },
        { email: "lauzanh@demo.com", displayName: "Lau Zanh", provider: "demo", providerUserId: "demo-5", avatar: null },
      ];

      const createdUsers = [];
      for (const demo of demoUsers) {
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, demo.email))
          .limit(1);

        if (existing.length === 0) {
          const newUser = await db.insert(users).values(demo).returning();
          createdUsers.push(newUser[0]);
        } else {
          createdUsers.push(existing[0]);
        }
      }

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "seed_demo_users",
        metadata: { count: createdUsers.length },
      });

      res.json({ users: createdUsers, message: `Created/found ${createdUsers.length} demo users` });
    } catch (error) {
      console.error("Failed to seed demo users:", error);
      res.status(500).json({ error: "Failed to seed demo users" });
    }
  });

  app.post("/api/admin/seed-ai-settings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      let promptsSeeded = 0;
      let promptsSkipped = 0;
      let servicesSeeded = 0;
      let servicesSkipped = 0;
      let avatarSeeded = false;

      // Seed default prompts
      for (const [key, promptData] of Object.entries(DEFAULT_PROMPTS)) {
        const existing = await db
          .select()
          .from(aiPrompts)
          .where(eq(aiPrompts.key, key))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(aiPrompts).values({
            key,
            name: promptData.name,
            description: promptData.description,
            category: promptData.category,
            prompt: promptData.prompt,
          });
          promptsSeeded++;
        } else {
          promptsSkipped++;
        }
      }

      // Seed default AI service configs
      for (const [serviceKey, config] of Object.entries(DEFAULT_SERVICE_CONFIGS)) {
        const existing = await db
          .select()
          .from(aiServiceConfigs)
          .where(eq(aiServiceConfigs.serviceKey, serviceKey))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(aiServiceConfigs).values({
            serviceKey,
            displayName: config.displayName,
            modelName: config.defaultModel,
            endpointUrl: config.endpointUrl,
            isEnabled: false,
            sourceType: "local",
          });
          servicesSeeded++;
        } else {
          servicesSkipped++;
        }
      }

      // Seed default avatar settings
      const existingAvatar = await db
        .select()
        .from(avatarSettings)
        .where(eq(avatarSettings.id, "default"))
        .limit(1);

      if (existingAvatar.length === 0) {
        await db.insert(avatarSettings).values({ id: "default" });
        avatarSeeded = true;
      }

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "seed_ai_settings",
        metadata: { promptsSeeded, promptsSkipped, servicesSeeded, servicesSkipped, avatarSeeded },
      });

      res.json({
        message: "AI settings seeded successfully",
        prompts: { seeded: promptsSeeded, skipped: promptsSkipped },
        services: { seeded: servicesSeeded, skipped: servicesSkipped },
        avatar: { seeded: avatarSeeded },
      });
    } catch (error) {
      console.error("Failed to seed AI settings:", error);
      res.status(500).json({ error: "Failed to seed AI settings" });
    }
  });

  app.get("/api/admin/integration-settings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await getIntegrationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to get integration settings:", error);
      res.status(500).json({ error: "Failed to get integration settings" });
    }
  });

  app.put("/api/admin/integration-settings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { baseUrl, enrollmentSecret } = req.body;
      
      if (baseUrl) {
        await setIntegrationSetting("three_tears_base_url", baseUrl);
        resetJwksClient();
      }
      if (enrollmentSecret) {
        await setIntegrationSetting("three_tears_enrollment_secret", enrollmentSecret);
      }

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "update_integration_settings",
        metadata: { 
          baseUrl: baseUrl ? "updated" : "unchanged",
          enrollmentSecret: enrollmentSecret ? "updated" : "unchanged",
        },
      });

      const updatedSettings = await getIntegrationSettings();
      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      console.error("Failed to update integration settings:", error);
      res.status(500).json({ error: "Failed to update integration settings" });
    }
  });

  app.post("/api/admin/integration/register", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { forceReregister } = req.body;
      
      const result = await registerWithThreeTears(forceReregister === true);

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "manual_registration_attempt",
        metadata: { result, forceReregister: forceReregister === true },
      });

      res.json(result);
    } catch (error: any) {
      console.error("Failed to register with Three Tears:", error);
      res.status(500).json({ success: false, message: `Registration failed: ${error.message}` });
    }
  });

  app.delete("/api/admin/integration/app-id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await db.delete(settings).where(eq(settings.key, "registered_app_id"));

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "clear_app_id",
        metadata: {},
      });

      res.json({ success: true, message: "App ID cleared. You can now re-register." });
    } catch (error) {
      console.error("Failed to clear app ID:", error);
      res.status(500).json({ error: "Failed to clear app ID" });
    }
  });

  // ============================================
  // BILLING PROVIDER MANAGEMENT
  // ============================================

  // Get all billing providers configuration (masked for UI)
  app.get("/api/admin/billing-providers", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const providers = await getBillingProviders();
      res.json(providers);
    } catch (error) {
      console.error("Failed to get billing providers:", error);
      res.status(500).json({ error: "Failed to get billing providers" });
    }
  });

  // Update a specific billing provider
  app.put("/api/admin/billing-providers/:provider", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { provider } = req.params;

      if (provider !== "stripe" && provider !== "revenuecat") {
        return res.status(400).json({ error: "Invalid billing provider. Must be 'stripe' or 'revenuecat'" });
      }

      const { apiKey, publicKey, webhookSecret, config, isEnabled } = req.body;

      const updated = await updateBillingProvider(provider, {
        apiKey,
        publicKey,
        webhookSecret,
        config,
        isEnabled,
        sourceType: "local",
      });

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "update_billing_provider",
        metadata: {
          provider,
          apiKeyUpdated: !!apiKey,
          publicKeyUpdated: !!publicKey,
          webhookSecretUpdated: !!webhookSecret,
          configUpdated: !!config,
          isEnabledUpdated: isEnabled !== undefined,
        },
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to update billing provider:", error);
      res.status(500).json({ error: "Failed to update billing provider" });
    }
  });

  // Test billing provider connection
  app.post("/api/admin/billing-providers/:provider/test", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { provider } = req.params;

      let result;
      if (provider === "stripe") {
        result = await testStripeConnection();
      } else if (provider === "revenuecat") {
        result = await testRevenueCatConnection();
      } else {
        return res.status(400).json({ error: "Invalid billing provider" });
      }

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "test_billing_provider",
        metadata: { provider, result },
      });

      res.json(result);
    } catch (error) {
      console.error("Failed to test billing provider:", error);
      res.status(500).json({ success: false, message: "Test failed" });
    }
  });

  // ============================================
  // THREE TEARS BILLING CREDENTIALS PUSH API
  // ============================================
  // This endpoint allows Three Tears to push billing credentials to Mien Kingdom
  // Authentication via JWT signed by Three Tears

  app.post("/api/billing/push-credentials", async (req: Request, res: Response) => {
    try {
      // Verify JWT from Three Tears
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
      }

      const token = authHeader.substring(7);
      const verification = await verifyJwt(token);

      if (!verification.valid) {
        console.warn("[Billing Push] JWT verification failed:", verification.error);
        return res.status(401).json({ error: verification.error || "Invalid token" });
      }

      // Validate payload structure
      const { stripe, revenuecat } = req.body;

      if (!stripe && !revenuecat) {
        return res.status(400).json({ error: "At least one billing provider configuration must be provided" });
      }

      // Update credentials
      const result = await updateBillingCredentialsFromThreeTears({ stripe, revenuecat });

      await db.insert(activityLogs).values({
        userId: null,
        action: "three_tears_push_billing_credentials",
        metadata: {
          stripeUpdated: stripe ? true : false,
          revenuecatUpdated: revenuecat ? true : false,
          result,
        },
      });

      console.log("[Billing Push] Credentials updated from Three Tears:", result);

      if (result.success) {
        res.json({
          success: true,
          message: "Billing credentials updated successfully",
          updated: result.updated,
        });
      } else {
        res.status(207).json({
          success: false,
          message: "Some credentials failed to update",
          updated: result.updated,
          errors: result.errors,
        });
      }
    } catch (error: any) {
      console.error("[Billing Push] Error processing credential push:", error);
      res.status(500).json({ error: "Failed to process credential push" });
    }
  });

  // Get billing provider public configuration (for client apps)
  // Returns only public keys and enabled status, no secrets
  app.get("/api/billing/config", async (req: Request, res: Response) => {
    try {
      const platform = (req.query.platform as string) || "web";
      const validPlatforms = ["web", "ios", "android"];

      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform. Must be 'web', 'ios', or 'android'" });
      }

      const providers = await getBillingProviders();
      const stripeProvider = providers.find(p => p.provider === "stripe");
      const revenuecatProvider = providers.find(p => p.provider === "revenuecat");

      // Determine which provider to use based on platform
      const recommendedProvider = getBillingProviderForPlatform(platform as any);

      res.json({
        platform,
        recommendedProvider,
        stripe: stripeProvider ? {
          isEnabled: stripeProvider.isEnabled,
          publicKey: stripeProvider.publicKey,
          isConfigured: stripeProvider.hasApiKey,
        } : { isEnabled: false, publicKey: null, isConfigured: false },
        revenuecat: revenuecatProvider ? {
          isEnabled: revenuecatProvider.isEnabled,
          publicKey: revenuecatProvider.publicKey,
          isConfigured: revenuecatProvider.hasApiKey,
          appAppleId: (revenuecatProvider.config as any)?.appAppleId || null,
          appGoogleId: (revenuecatProvider.config as any)?.appGoogleId || null,
          entitlementId: (revenuecatProvider.config as any)?.entitlementId || null,
        } : { isEnabled: false, publicKey: null, isConfigured: false },
      });
    } catch (error) {
      console.error("Failed to get billing config:", error);
      res.status(500).json({ error: "Failed to get billing config" });
    }
  });

  // AI Prompts Management
  app.get("/api/admin/prompts", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const prompts = await getAllPrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Failed to get prompts:", error);
      res.status(500).json({ error: "Failed to get prompts" });
    }
  });

  app.get("/api/admin/prompts/:key", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { key } = req.params;
      const prompt = await getPrompt(key);
      const defaultData = DEFAULT_PROMPTS[key];

      if (!prompt && !defaultData) {
        return res.status(404).json({ error: "Prompt not found" });
      }

      res.json({
        key,
        name: defaultData?.name || key,
        description: defaultData?.description || "",
        category: defaultData?.category || "custom",
        prompt,
        isDefault: !prompt || prompt === defaultData?.prompt,
      });
    } catch (error) {
      console.error("Failed to get prompt:", error);
      res.status(500).json({ error: "Failed to get prompt" });
    }
  });

  app.put("/api/admin/prompts/:key", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { key } = req.params;
      const { prompt, name, description, category } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt text is required" });
      }

      await setPrompt(key, prompt, name, description, category);

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "update_ai_prompt",
        metadata: { key, promptLength: prompt.length },
      });

      res.json({ success: true, message: `Prompt '${key}' updated successfully` });
    } catch (error) {
      console.error("Failed to update prompt:", error);
      res.status(500).json({ error: "Failed to update prompt" });
    }
  });

  app.post("/api/admin/prompts/:key/reset", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { key } = req.params;
      const success = await resetPrompt(key);

      if (!success) {
        return res.status(404).json({ error: "No default prompt found for this key" });
      }

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "reset_ai_prompt",
        metadata: { key },
      });

      res.json({ success: true, message: `Prompt '${key}' reset to default` });
    } catch (error) {
      console.error("Failed to reset prompt:", error);
      res.status(500).json({ error: "Failed to reset prompt" });
    }
  });

  // AI Service Configuration Management
  app.get("/api/admin/ai-services", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const configs = await getAllServiceConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Failed to get AI service configs:", error);
      res.status(500).json({ error: "Failed to get AI service configurations" });
    }
  });

  app.put("/api/admin/ai-services/:serviceKey", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { serviceKey } = req.params;
      const { modelName, apiKey, credentialsJson, projectId, region, endpointUrl, isEnabled } = req.body;

      // Validate service key
      if (!DEFAULT_SERVICE_CONFIGS[serviceKey as keyof typeof DEFAULT_SERVICE_CONFIGS]) {
        return res.status(404).json({ error: `Unknown service: ${serviceKey}` });
      }

      const config = await updateServiceConfig(serviceKey, {
        modelName,
        apiKey,
        credentialsJson,
        projectId,
        region,
        endpointUrl,
        isEnabled,
      });

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "update_ai_service_config",
        metadata: { serviceKey, updates: Object.keys(req.body).filter(k => k !== "apiKey" && k !== "credentialsJson") },
      });

      res.json(config);
    } catch (error) {
      console.error("Failed to update AI service config:", error);
      res.status(500).json({ error: "Failed to update AI service configuration" });
    }
  });

  app.post("/api/admin/ai-services/:serviceKey/test", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { serviceKey } = req.params;

      // Validate service key
      if (!DEFAULT_SERVICE_CONFIGS[serviceKey as keyof typeof DEFAULT_SERVICE_CONFIGS]) {
        return res.status(404).json({ error: `Unknown service: ${serviceKey}` });
      }

      console.log(`[AI Service Test] Testing connection for ${serviceKey}...`);
      const result = await testServiceConnection(serviceKey);

      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "test_ai_service_connection",
        metadata: { serviceKey, success: result.success },
      });

      console.log(`[AI Service Test] ${serviceKey}: ${result.success ? "SUCCESS" : "FAILED"}`);

      res.json(result);
    } catch (error: any) {
      console.error("Failed to test AI service connection");
      res.status(500).json({
        success: false,
        message: "Test failed unexpectedly",
      });
    }
  });

  // ============================================
  // AI Avatar Settings Endpoints
  // ============================================

  // Available voice options for Gemini Realtime API
  const AVATAR_VOICE_OPTIONS = [
    { value: "Charon", label: "Charon", description: "Male, deeper/mature tone" },
    { value: "Puck", label: "Puck", description: "Male, lighter tone" },
    { value: "Fenrir", label: "Fenrir", description: "Male" },
    { value: "Kore", label: "Kore", description: "Female" },
    { value: "Aoede", label: "Aoede", description: "Female, warm tone" },
  ];

  // Get avatar settings
  app.get("/api/admin/avatar-settings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const [settings] = await db.select().from(avatarSettings).where(eq(avatarSettings.id, "default"));

      // Return defaults if no settings exist
      const result = settings || {
        id: "default",
        voice: "Charon",
        prompt: `You are Ong, a friendly AI companion for the Mien Kingdom community.

Your role:
- Help users learn about Mien culture, traditions, and history
- Assist with Mien language translation and pronunciation
- Share knowledge about Mien cuisine, clothing, and customs
- Be warm, patient, and encouraging with users of all ages
- Speak naturally and conversationally, like a wise friend

Guidelines:
- Keep responses concise and conversational (1-3 sentences typically)
- Use simple, clear language
- Be respectful of Mien cultural traditions
- If you don't know something about Mien culture, admit it honestly
- Encourage users to explore and learn more about their heritage

Remember: You represent the Mien Kingdom community - be welcoming and inclusive!`,
      };

      res.json({
        ...result,
        voiceOptions: AVATAR_VOICE_OPTIONS,
      });
    } catch (error) {
      log(`Error fetching avatar settings: ${error}`);
      res.status(500).json({ error: "Failed to fetch avatar settings" });
    }
  });

  // Update avatar settings
  app.put("/api/admin/avatar-settings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { voice, prompt } = req.body;

      // Validate voice option
      if (voice && !AVATAR_VOICE_OPTIONS.find(v => v.value === voice)) {
        return res.status(400).json({ error: "Invalid voice option" });
      }

      // Upsert the settings
      const [existing] = await db.select().from(avatarSettings).where(eq(avatarSettings.id, "default"));

      if (existing) {
        // Update existing
        await db.update(avatarSettings)
          .set({
            ...(voice && { voice }),
            ...(prompt && { prompt }),
            updatedAt: new Date(),
          })
          .where(eq(avatarSettings.id, "default"));
      } else {
        // Insert new
        await db.insert(avatarSettings).values({
          id: "default",
          voice: voice || "Charon",
          prompt: prompt || existing?.prompt || "",
        });
      }

      // Log the activity
      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "update_avatar_settings",
        metadata: { voice, promptLength: prompt?.length },
      });

      // Fetch and return the updated settings
      const [updated] = await db.select().from(avatarSettings).where(eq(avatarSettings.id, "default"));

      res.json({
        ...updated,
        voiceOptions: AVATAR_VOICE_OPTIONS,
      });
    } catch (error) {
      log(`Error updating avatar settings: ${error}`);
      res.status(500).json({ error: "Failed to update avatar settings" });
    }
  });

  // Public endpoint for avatar agent to fetch settings (no auth required - internal use)
  app.get("/api/avatar/settings", async (req, res) => {
    try {
      const [settings] = await db.select().from(avatarSettings).where(eq(avatarSettings.id, "default"));

      const result = settings || {
        voice: "Charon",
        prompt: `You are Ong, a friendly AI companion for the Mien Kingdom community.

Your role:
- Help users learn about Mien culture, traditions, and history
- Assist with Mien language translation and pronunciation
- Share knowledge about Mien cuisine, clothing, and customs
- Be warm, patient, and encouraging with users of all ages
- Speak naturally and conversationally, like a wise friend

Guidelines:
- Keep responses concise and conversational (1-3 sentences typically)
- Use simple, clear language
- Be respectful of Mien cultural traditions
- If you don't know something about Mien culture, admit it honestly
- Encourage users to explore and learn more about their heritage

Remember: You represent the Mien Kingdom community - be welcoming and inclusive!`,
      };

      res.json({
        voice: result.voice,
        prompt: result.prompt,
      });
    } catch (error) {
      log(`Error fetching avatar settings for agent: ${error}`);
      res.status(500).json({ error: "Failed to fetch avatar settings" });
    }
  });

  // Admin endpoint to get avatar agent process status
  app.get("/api/admin/avatar-agent/status", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const status = getAvatarAgentStatus();
      res.json(status);
    } catch (error) {
      log(`Error getting avatar agent status: ${error}`);
      res.status(500).json({ error: "Failed to get avatar agent status" });
    }
  });

  // Admin endpoint to restart the avatar agent process
  app.post("/api/admin/avatar-agent/restart", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const result = restartAvatarAgent();

      // Log the activity
      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "restart_avatar_agent",
        category: "system",
        metadata: JSON.stringify({ result }),
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      });

      res.json(result);
    } catch (error) {
      log(`Error restarting avatar agent: ${error}`);
      res.status(500).json({ error: "Failed to restart avatar agent" });
    }
  });

  // Admin endpoint to stop the avatar agent process
  app.post("/api/admin/avatar-agent/stop", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const stopped = stopAvatarAgent();

      // Log the activity
      await db.insert(activityLogs).values({
        userId: req.user!.id,
        action: "stop_avatar_agent",
        category: "system",
        metadata: JSON.stringify({ stopped }),
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      });

      res.json({
        success: true,
        message: stopped ? "Avatar agent is stopping..." : "Avatar agent was not running",
      });
    } catch (error) {
      log(`Error stopping avatar agent: ${error}`);
      res.status(500).json({ error: "Failed to stop avatar agent" });
    }
  });

  // Admin Utilities - Test Veo 3.1 Connection
  app.post("/api/admin/test-veo-connection", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    const steps: { step: string; status: "success" | "error" | "warning" | "info"; message: string }[] = [];
    
    try {
      // Step 1: Load and verify credentials
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      
      if (!projectId) {
        steps.push({
          step: "Configuration",
          status: "error",
          message: "GOOGLE_CLOUD_PROJECT_ID is NOT set",
        });
        return res.json({ success: false, steps, summary: "Missing GOOGLE_CLOUD_PROJECT_ID" });
      }

      if (!serviceAccountJson) {
        steps.push({
          step: "Configuration",
          status: "error",
          message: "GOOGLE_SERVICE_ACCOUNT_JSON is NOT set",
        });
        return res.json({ success: false, steps, summary: "Missing GOOGLE_SERVICE_ACCOUNT_JSON" });
      }

      // Step 2: Parse and validate service account
      let serviceAccount: any;
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
        const keyProjectId = serviceAccount.project_id;
        const clientEmail = serviceAccount.client_email;

        steps.push({
          step: "Load Credentials",
          status: "success",
          message: `Service Account: ${clientEmail}`,
        });

        if (keyProjectId !== projectId) {
          steps.push({
            step: "Project Verification",
            status: "error",
            message: `Key is for '${keyProjectId}', but you're targeting '${projectId}' - MISMATCH!`,
          });
          steps.push({
            step: "Solution",
            status: "warning",
            message: `Download the JSON key from the '${projectId}' Google Cloud project (Service Accounts page)`,
          });
          return res.json({
            success: false,
            steps,
            summary: "Service account key project ID mismatch",
          });
        }

        steps.push({
          step: "Project Verification",
          status: "success",
          message: `Key matches target project '${projectId}'`,
        });
      } catch (parseError: any) {
        steps.push({
          step: "Load Credentials",
          status: "error",
          message: `Invalid JSON: ${parseError.message}`,
        });
        return res.json({ success: false, steps, summary: "Invalid service account JSON" });
      }

      // Step 3: Get access token
      let accessToken: string;
      try {
        accessToken = await getVertexAIAccessToken();
        steps.push({
          step: "Authentication",
          status: "success",
          message: "Access token generated successfully",
        });
      } catch (authError: any) {
        steps.push({
          step: "Authentication",
          status: "error",
          message: `Failed to generate token: ${authError.message}`,
        });
        return res.json({
          success: false,
          steps,
          summary: "Authentication failed",
        });
      }

      // Step 4: Check project visibility
      const projectCheckUrl = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`;
      try {
        const projectResp = await fetch(projectCheckUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (projectResp.status === 200) {
          const projData = await projectResp.json();
          steps.push({
            step: "Project Visibility",
            status: "success",
            message: `Project '${projectId}' is ACTIVE (${projData.lifecycleState || "ACTIVE"})`,
          });
        } else if (projectResp.status === 403) {
          steps.push({
            step: "Project Visibility",
            status: "error",
            message: `403 Forbidden - Service account lacks 'Viewer' or 'Vertex AI User' role on project`,
          });
          steps.push({
            step: "Solution",
            status: "warning",
            message: `In Google Cloud Console: Go to IAM -> Grant role 'Vertex AI User' to ${serviceAccount.client_email}`,
          });
          return res.json({
            success: false,
            steps,
            summary: "Service account lacks required permissions",
          });
        } else if (projectResp.status === 404) {
          steps.push({
            step: "Project Visibility",
            status: "error",
            message: `404 Not Found - Project '${projectId}' doesn't exist or has been deleted`,
          });
          return res.json({ success: false, steps, summary: "Project not found" });
        } else {
          steps.push({
            step: "Project Visibility",
            status: "warning",
            message: `Unexpected response ${projectResp.status} - proceeding with model check`,
          });
        }
      } catch (projError: any) {
        steps.push({
          step: "Project Visibility",
          status: "warning",
          message: `Could not verify project: ${projError.message} - proceeding with model check`,
        });
      }

      // Step 5: Check Veo 3.1 model availability (v1 endpoint first)
      const location = "us-central1";
      const modelId = "veo-3.1-fast-generate-001";
      const modelUrlV1 = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}`;

      let modelFound = false;
      let usedEndpoint = "v1";

      try {
        const modelResp = await fetch(modelUrlV1, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (modelResp.status === 200) {
          const modelData = await modelResp.json();
          steps.push({
            step: "Veo 3.1 Model (v1)",
            status: "success",
            message: `Model '${modelId}' is AVAILABLE on v1 endpoint`,
          });
          modelFound = true;
        } else if (modelResp.status === 404) {
          steps.push({
            step: "Veo 3.1 Model (v1)",
            status: "warning",
            message: `Model not found on v1 endpoint. Checking v1beta1...`,
          });

          // Fallback to v1beta1
          const modelUrlBeta = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models/veo-3.1-fast-generate-preview`;
          const betaResp = await fetch(modelUrlBeta, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (betaResp.status === 200) {
            steps.push({
              step: "Veo 3.1 Model (v1beta1)",
              status: "success",
              message: `Model 'veo-3.1-fast-generate-preview' found on v1beta1 endpoint`,
            });
            steps.push({
              step: "Note",
              status: "info",
              message: `Movie Star feature should use 'v1beta1' endpoint with model 'veo-3.1-fast-generate-preview'`,
            });
            modelFound = true;
            usedEndpoint = "v1beta1";
          } else if (betaResp.status === 403) {
            steps.push({
              step: "Veo 3.1 Model (v1beta1)",
              status: "error",
              message: `403 Forbidden - Vertex AI API may not be enabled or model access denied`,
            });
            steps.push({
              step: "Solution",
              status: "warning",
              message: `1. Go to Google Cloud Console\n2. Search for 'Vertex AI API' and click ENABLE\n3. Ensure your service account has 'Vertex AI User' role`,
            });
          } else if (betaResp.status === 404) {
            steps.push({
              step: "Veo 3.1 Model (v1beta1)",
              status: "error",
              message: `Model not found on v1beta1 - model may not be available in your region or project`,
            });
          } else {
            const errorText = await betaResp.text();
            steps.push({
              step: "Veo 3.1 Model (v1beta1)",
              status: "error",
              message: `Unexpected error ${betaResp.status}: ${errorText.substring(0, 150)}`,
            });
          }
        } else if (modelResp.status === 403) {
          steps.push({
            step: "Veo 3.1 Model (v1)",
            status: "error",
            message: `403 Forbidden - Vertex AI API may not be enabled or permissions denied`,
          });
          steps.push({
            step: "Solution",
            status: "warning",
            message: `1. Enable Vertex AI API in Google Cloud Console\n2. Ensure service account has 'Vertex AI User' role`,
          });
        } else {
          const errorText = await modelResp.text();
          steps.push({
            step: "Veo 3.1 Model (v1)",
            status: "error",
            message: `Error ${modelResp.status}: ${errorText.substring(0, 150)}`,
          });
        }
      } catch (fetchError: any) {
        steps.push({
          step: "Veo 3.1 Model",
          status: "error",
          message: `Network error: ${fetchError.message}`,
        });
      }

      // Final summary
      if (modelFound) {
        await db.insert(activityLogs).values({
          userId: req.user!.id,
          action: "test_veo_connection",
          metadata: { success: true, projectId, endpoint: usedEndpoint },
        });

        return res.json({
          success: true,
          steps,
          summary: `Success! Veo 3.1 is accessible on ${usedEndpoint} endpoint.`,
        });
      } else {
        await db.insert(activityLogs).values({
          userId: req.user!.id,
          action: "test_veo_connection",
          metadata: { success: false, projectId, error: "Model not accessible" },
        });

        return res.json({
          success: false,
          steps,
          summary: "Veo 3.1 model is not accessible - see diagnostic steps above",
        });
      }
    } catch (error: any) {
      steps.push({
        step: "Unexpected Error",
        status: "error",
        message: error.message || "Unknown error occurred",
      });

      return res.json({
        success: false,
        steps,
        summary: "Test failed with unexpected error",
      });
    }
  });

  app.post("/api/admin/command", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
      }

      const token = authHeader.substring(7);
      const verification = await verifyJwt(token);
      
      if (!verification.valid) {
        return res.status(401).json({ error: verification.error || "Invalid token" });
      }

      const { action, params, data } = req.body;
      if (!action) {
        return res.status(400).json({ error: "action is required" });
      }

      const commandParams = data || params || {};
      const result = await handleAdminCommand(action, commandParams);
      
      await db.insert(activityLogs).values({
        userId: null,
        action: `three_tears_command:${action}`,
        metadata: { params: commandParams, result, tokenPayload: verification.payload },
      });

      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Admin command error:", error);
      res.status(500).json({ error: "Command execution failed" });
    }
  });

  app.post("/api/support/ticket", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { message, subject } = req.body;
      const appId = await getAppId();

      if (!appId) {
        return res.status(503).json({ error: "Support system not available" });
      }

      const mainAppBaseUrl = await getMainAppBaseUrl();
      const ticketResponse = await fetch(`${mainAppBaseUrl}/api/ingest/ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: appId,
          user_email: req.user!.email,
          user_name: req.user!.displayName,
          subject: subject || "Support Request",
          message,
        }),
      });

      if (ticketResponse.ok) {
        const data = await ticketResponse.json();
        res.json({ success: true, ticketId: data.ticket_id });
      } else {
        res.status(500).json({ error: "Failed to submit ticket" });
      }
    } catch (error) {
      console.error("Support ticket error:", error);
      res.status(500).json({ error: "Failed to submit support ticket" });
    }
  });

  function generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `MK-${timestamp}-${random}`;
  }

  app.post("/api/support/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { message } = req.body;
      const user = req.user!;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const ticketNumber = generateTicketNumber();
      const appId = await getAppId();

      await db.insert(activityLogs).values({
        userId: user.id,
        action: "support_chat_request",
        metadata: { ticketNumber, userEmail: user.email, userName: user.displayName, message: message.substring(0, 500) },
      });

      try {
        const mainAppBaseUrl = await getMainAppBaseUrl();
        const chatResponse = await fetch(`${mainAppBaseUrl}/api/support/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            app_id: appId,
            ticket_number: ticketNumber,
            user_email: user.email,
            user_name: user.displayName,
            user_id: user.id,
            message,
          }),
        });

        if (chatResponse.ok) {
          console.log(`[Support] Chat ticket ${ticketNumber} forwarded to Three Tears`);
        } else {
          console.warn(`[Support] Failed to forward chat to Three Tears: ${chatResponse.status}`);
        }
      } catch (forwardError) {
        console.warn("[Support] Could not forward to Three Tears:", forwardError);
      }

      res.json({ success: true, ticketNumber });
    } catch (error) {
      console.error("Support chat error:", error);
      res.status(500).json({ error: "Failed to initiate chat" });
    }
  });

  app.post("/api/support/email", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { subject, message } = req.body;
      const user = req.user!;

      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }

      const ticketNumber = generateTicketNumber();
      const appId = await getAppId();

      await db.insert(activityLogs).values({
        userId: user.id,
        action: "support_email_request",
        metadata: { 
          ticketNumber, 
          userEmail: user.email, 
          userName: user.displayName, 
          subject, 
          message: message.substring(0, 500),
          recipient: "support@mienkingdom.com"
        },
      });

      try {
        const mainAppBaseUrl = await getMainAppBaseUrl();
        const emailResponse = await fetch(`${mainAppBaseUrl}/api/support/email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            app_id: appId,
            ticket_number: ticketNumber,
            user_email: user.email,
            user_name: user.displayName,
            user_id: user.id,
            subject,
            message,
            recipient: "support@mienkingdom.com",
          }),
        });

        if (emailResponse.ok) {
          console.log(`[Support] Email ticket ${ticketNumber} forwarded to Three Tears`);
        } else {
          console.warn(`[Support] Failed to forward email to Three Tears: ${emailResponse.status}`);
        }
      } catch (forwardError) {
        console.warn("[Support] Could not forward to Three Tears:", forwardError);
      }

      res.json({ success: true, ticketNumber });
    } catch (error) {
      console.error("Support email error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Middleware to check if user has a paid tier or is admin/moderator
  const requirePaidTier = async (req: AuthenticatedRequest, res: Response, next: Function) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const fullUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      if (fullUser.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }
      
      const tierSlug = fullUser[0].tierSlug || "free";
      const userRole = fullUser[0].role || "user";
      
      // Allow access if user is admin/moderator OR has paid tier
      const isAdminOrModerator = userRole === "admin" || userRole === "moderator";
      if (tierSlug === "free" && !isAdminOrModerator) {
        return res.status(403).json({ 
          error: "This feature is only available to paid subscribers",
          redirect_url: "/subscription"
        });
      }
      
      next();
    } catch (error) {
      console.error("Paid tier check error:", error);
      return res.status(500).json({ error: "Failed to verify subscription status" });
    }
  };

  // Support Ticket System - JWT authenticated with Three Tears
  // GET /api/tickets - List user's tickets
  app.get("/api/tickets", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const tickets = await getUserTickets(user.id, user.email);
      res.json(tickets);
    } catch (error: any) {
      console.error("[Tickets] Fetch tickets error:", error);
      if (error.message?.includes("not registered")) {
        return res.status(503).json({ error: "Support system not available" });
      }
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // POST /api/tickets - Create a new ticket
  app.post("/api/tickets", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { subject, body, category = "general" } = req.body;
      const user = req.user!;

      if (!subject || !body) {
        return res.status(400).json({ error: "Subject and body are required" });
      }

      const ticket = await createTicket(user.id, user.email, subject, body, category);

      await db.insert(activityLogs).values({
        userId: user.id,
        action: "ticket_created",
        metadata: { ticketId: ticket.id, subject, category },
      });

      res.json(ticket);
    } catch (error: any) {
      console.error("[Tickets] Create ticket error:", error);
      if (error.message?.includes("not registered")) {
        return res.status(503).json({ error: "Support system not available" });
      }
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  // GET /api/tickets/:id - Get ticket details with messages
  app.get("/api/tickets/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const user = req.user!;
      const ticket = await getTicketDetails(user.id, id, user.email);
      res.json(ticket);
    } catch (error: any) {
      console.error("[Tickets] Fetch ticket error:", error);
      if (error.message?.includes("not registered")) {
        return res.status(503).json({ error: "Support system not available" });
      }
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  // POST /api/tickets/:id/reply - Reply to a ticket
  app.post("/api/tickets/:id/reply", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const user = req.user!;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const reply = await replyToTicket(user.id, id, message, user.email);

      await db.insert(activityLogs).values({
        userId: user.id,
        action: "ticket_reply",
        metadata: { ticketId: id },
      });

      res.json(reply);
    } catch (error: any) {
      console.error("[Tickets] Reply error:", error);
      if (error.message?.includes("not registered")) {
        return res.status(503).json({ error: "Support system not available" });
      }
      res.status(500).json({ error: "Failed to send reply" });
    }
  });

  // JWKS endpoint for Three Tears integration
  app.get("/.well-known/jwks.json", async (req: Request, res: Response) => {
    try {
      const jwks = await getAppJwks();
      res.json(jwks);
    } catch (error) {
      console.error("[JWKS] Error getting app JWKS:", error);
      res.json({ keys: [] });
    }
  });

  // Snapshot endpoint for Three Tears full re-sync
  app.get("/api/sync/snapshot", async (req: Request, res: Response) => {
    try {
      const authResult = await verifySyncAuth(req.headers.authorization);
      if (!authResult.valid) {
        return res.status(401).json({ error: authResult.error });
      }

      const snapshot = await generateSnapshot();
      
      await logActivity(null, "sync_snapshot_requested", {
        generatedAt: snapshot.generatedAt,
        usersCount: snapshot.users.total,
        groupsCount: snapshot.groups.total,
      });

      res.json(snapshot);
    } catch (error) {
      console.error("[Sync] Snapshot generation error:", error);
      res.status(500).json({ error: "Failed to generate snapshot" });
    }
  });

  // Billing webhook from Three Tears
  app.post("/webhooks/billing", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const payload = req.body;

      // Verify JWT from Three Tears
      const isValid = await verifyJwt(authHeader?.replace("Bearer ", "") || "");
      if (!isValid.valid) {
        console.error("[Billing] Invalid JWT signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const { event, user_id, tier_slug, credits_refill, subscription_end } = payload;

      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }

      console.log(`[Billing] Received ${event} for user ${user_id}`);

      if (event === "subscription.updated" || event === "subscription.renewed") {
        const creditsToSet = credits_refill || getCreditsForTier(tier_slug || "free");
        const subEnd = subscription_end ? new Date(subscription_end) : null;

        // Update subscription with new credits
        await db
          .update(users)
          .set({
            tierSlug: tier_slug || "free",
            credits: creditsToSet,
            subscriptionActive: tier_slug !== "free",
            subscriptionExpiresAt: subEnd,
            lastCreditReset: new Date(),
          })
          .where(eq(users.id, user_id));

        await db.insert(creditTransactions).values({
          userId: user_id,
          type: "refill",
          amount: creditsToSet,
          balanceAfter: creditsToSet,
          feature: null,
          description: event === "subscription.renewed"
            ? `Subscription refill: ${creditsToSet} credits for ${tier_slug || "free"} tier`
            : `Upgraded to ${tier_slug || "free"}: ${creditsToSet} credits`,
        });

        await logActivity(user_id, "subscription_updated", {
          event,
          tierSlug: tier_slug,
          credits: creditsToSet,
          subscriptionExpiresAt: subEnd?.toISOString(),
        });

        // Push updated user to Three Tears
        const [updatedUser] = await db.select().from(users).where(eq(users.id, user_id));
        if (updatedUser) {
          pushUserUpdated({
            id: updatedUser.id,
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            role: updatedUser.role,
            provider: updatedUser.provider,
            createdAt: updatedUser.createdAt.toISOString(),
            lastLoginAt: updatedUser.lastLoginAt.toISOString(),
          });
        }

        console.log(`[Billing] Updated subscription for user ${user_id}: tier=${tier_slug}, credits=${creditsToSet}`);
      }

      // Subscription cancellation
      if (event === "subscription.cancelled" || event === "subscription.expired") {
        await db
          .update(users)
          .set({
            tierSlug: "free",
            subscriptionActive: false,
            credits: 0,
          })
          .where(eq(users.id, user_id));

        console.log(`[Billing] Subscription cancelled for user ${user_id}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Billing] Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // ============================================
  // STRIPE WEBHOOK HANDLER (Web payments)
  // ============================================
  app.post("/webhooks/stripe", async (req: Request, res: Response) => {
    try {
      const sig = req.headers["stripe-signature"] as string;

      // Get webhook secret from database
      const stripeConfig = await getBillingProviderWithKeys("stripe");

      if (!stripeConfig || !stripeConfig.isEnabled) {
        console.warn("[Stripe Webhook] Stripe is not enabled");
        return res.status(400).json({ error: "Stripe is not enabled" });
      }

      // Verify the webhook signature (required in all environments)
      let event;
      if (!stripeConfig.webhookSecret) {
        console.error("[Stripe Webhook] No webhook secret configured - rejecting");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      if (!sig) {
        console.warn("[Stripe Webhook] No signature provided - rejecting");
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }

      try {
        const timestamp = sig.split(",").find((s: string) => s.startsWith("t="))?.split("=")[1];
        const signatures = sig.split(",").filter((s: string) => s.startsWith("v1=")).map((s: string) => s.split("=")[1]);

        if (!timestamp || signatures.length === 0) {
          return res.status(400).json({ error: "Invalid signature format" });
        }

        // Reject replayed webhooks (5 minute tolerance)
        const webhookAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
        if (webhookAge > 300) {
          console.warn("[Stripe Webhook] Timestamp too old:", webhookAge, "seconds");
          return res.status(400).json({ error: "Webhook timestamp too old" });
        }

        // Use the raw body for signature verification (JSON.stringify may differ from the original payload Stripe signed)
        const rawBody = (req as any).rawBody;
        if (!rawBody) {
          console.error("[Stripe Webhook] No raw body available for signature verification");
          return res.status(500).json({ error: "Raw body not available" });
        }
        const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
        const signedPayload = `${timestamp}.${bodyString}`;
        const expectedSignature = crypto
          .createHmac("sha256", stripeConfig.webhookSecret)
          .update(signedPayload)
          .digest("hex");

        // Use timing-safe comparison to prevent timing attacks
        const isValid = signatures.some((s: string) => {
          try {
            return crypto.timingSafeEqual(Buffer.from(s, 'hex'), Buffer.from(expectedSignature, 'hex'));
          } catch { return false; }
        });

        if (!isValid) {
          console.warn("[Stripe Webhook] Invalid signature");
          return res.status(400).json({ error: "Invalid signature" });
        }

        event = req.body;
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification error:", err);
        return res.status(400).json({ error: "Signature verification failed" });
      }

      console.log("[Stripe Webhook] Received event:", event.type);

      // Handle different Stripe events
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.client_reference_id || session.metadata?.user_id;
          const tierSlug = session.metadata?.tier_slug;

          if (userId && tierSlug) {
            // Subscription purchase
            const credits = getCreditsForTier(tierSlug);
            const subscriptionExpiresAt = new Date();
            subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);

            await handleSubscriptionUpdate({
              userId,
              tierSlug,
              credits,
              subscriptionExpiresAt,
              source: "stripe",
              transactionId: session.id,
            });
          }
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.renewed": {
          const subscription = event.data.object;
          const userId = subscription.metadata?.user_id;
          const tierSlug = subscription.metadata?.tier_slug;

          if (userId && tierSlug) {
            const credits = getCreditsForTier(tierSlug);
            const subscriptionExpiresAt = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined;

            await handleSubscriptionUpdate({
              userId,
              tierSlug,
              credits,
              subscriptionExpiresAt,
              source: "stripe",
              transactionId: subscription.id,
            });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const userId = subscription.metadata?.user_id;

          if (userId) {
            // Downgrade to free tier
            await handleSubscriptionUpdate({
              userId,
              tierSlug: "free",
              credits: getCreditsForTier("free"),
              source: "stripe",
              transactionId: subscription.id,
            });
          }
          break;
        }
      }

      await db.insert(activityLogs).values({
        userId: null,
        action: "stripe_webhook",
        metadata: { eventType: event.type, eventId: event.id },
      });

      res.json({ received: true });
    } catch (error: any) {
      console.error("[Stripe Webhook] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // ============================================
  // REVENUECAT WEBHOOK HANDLER (iOS/Android payments)
  // ============================================
  app.post("/webhooks/revenuecat", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;

      // Get webhook secret from database
      const revenuecatConfig = await getBillingProviderWithKeys("revenuecat");

      if (!revenuecatConfig || !revenuecatConfig.isEnabled) {
        console.warn("[RevenueCat Webhook] RevenueCat is not enabled");
        return res.status(400).json({ error: "RevenueCat is not enabled" });
      }

      // Verify webhook authorization (required)
      if (!revenuecatConfig.webhookSecret) {
        console.error("[RevenueCat Webhook] No webhook secret configured - rejecting");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      if (!authHeader) {
        console.warn("[RevenueCat Webhook] No authorization header - rejecting");
        return res.status(401).json({ error: "Missing authorization" });
      }

      const expectedAuth = `Bearer ${revenuecatConfig.webhookSecret}`;
      // Use timing-safe comparison
      const authMatch = authHeader.length === expectedAuth.length &&
        crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth));
      if (!authMatch) {
        console.warn("[RevenueCat Webhook] Invalid authorization header");
        return res.status(401).json({ error: "Invalid authorization" });
      }

      const event = req.body;
      console.log("[RevenueCat Webhook] Received event:", event.event?.type || event.type);

      // RevenueCat event structure
      const eventData = event.event || event;
      const eventType = eventData.type;
      const appUserId = eventData.app_user_id;
      const productId = eventData.product_id;
      const entitlementIds = eventData.entitlement_ids || [];

      // Map RevenueCat product IDs to tier slugs
      const productToTier: Record<string, string> = {
        "tier_5": "tier_5",
        "tier_15": "tier_15",
        "tier_30": "tier_30",
        "tier_60": "tier_60",
        "mien_kingdom_tier_5": "tier_5",
        "mien_kingdom_tier_15": "tier_15",
        "mien_kingdom_tier_30": "tier_30",
        "mien_kingdom_tier_60": "tier_60",
      };

      // Map product IDs to credit pack amounts
      const productToCredits: Record<string, number> = {
        "pack_500": 500,
        "pack_1000": 1000,
        "pack_2000": 2000,
        "pack_4000": 4000,
        "mien_kingdom_pack_500": 500,
        "mien_kingdom_pack_1000": 1000,
        "mien_kingdom_pack_2000": 2000,
        "mien_kingdom_pack_4000": 4000,
      };

      switch (eventType) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "PRODUCT_CHANGE": {
          const tierSlug = productToTier[productId];

          if (appUserId && tierSlug) {
            const credits = getCreditsForTier(tierSlug);
            const expirationDate = eventData.expiration_at_ms
              ? new Date(eventData.expiration_at_ms)
              : undefined;

            await handleSubscriptionUpdate({
              userId: appUserId,
              tierSlug,
              credits,
              subscriptionExpiresAt: expirationDate,
              source: "revenuecat",
              transactionId: eventData.id || eventData.transaction_id,
            });
          }
          break;
        }

        case "CANCELLATION":
        case "EXPIRATION": {
          if (appUserId) {
            // Downgrade to free tier
            await handleSubscriptionCancellation({
              userId: appUserId,
              source: "revenuecat",
              transactionId: eventData.id || eventData.transaction_id,
            });
          }
          break;
        }

        case "BILLING_ISSUE": {
          console.warn(`[RevenueCat Webhook] Billing issue for user ${appUserId}`);
          // Could send notification to user or admin
          break;
        }
      }

      await db.insert(activityLogs).values({
        userId: appUserId || null,
        action: "revenuecat_webhook",
        metadata: { eventType, productId, appUserId },
      });

      res.json({ received: true });
    } catch (error: any) {
      console.error("[RevenueCat Webhook] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Get checkout URL - routes based on platform (web=Stripe, ios/android=RevenueCat)
  app.get("/api/billing/get-checkout-url", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tier, platform } = req.query;
      const userId = req.user?.id;
      const clientPlatform = (platform as string) || "web";

      if (!tier || typeof tier !== "string") {
        return res.status(400).json({ error: "tier is required" });
      }

      if (!TIER_CONFIG[tier]) {
        return res.status(400).json({ error: "Invalid tier" });
      }

      // For local development, return a mock checkout URL with mock flag
      const isLocalhost = process.env.EXPO_PUBLIC_DOMAIN?.includes("localhost") ||
                          process.env.EXPO_PUBLIC_DOMAIN?.includes("127.0.0.1");
      if (isLocalhost) {
        console.log("[Billing] Local dev mode - returning mock checkout URL for tier:", tier);
        await logActivity(userId || null, "checkout_initiated", { tier, platform: clientPlatform, mock: true });
        const mockCheckoutUrl = `http://localhost:3000/api/billing/mock-checkout?tier=${tier}&user_id=${userId}`;
        return res.json({ checkout_url: mockCheckoutUrl, mock: true, provider: "mock" });
      }

      // Determine billing provider based on platform
      const billingProvider = getBillingProviderForPlatform(clientPlatform as any);
      const providerReady = await isBillingProviderReady(billingProvider);

      // For iOS/Android, return RevenueCat product info instead of URL
      if (clientPlatform === "ios" || clientPlatform === "android") {
        if (!providerReady) {
          console.warn(`[Billing] RevenueCat not configured, falling back to Three Tears`);
          // Fallback to Three Tears
        } else {
          // Return RevenueCat product ID for the tier
          const productIdPrefix = "mien_kingdom_";
          const productId = `${productIdPrefix}${tier}`;

          await logActivity(userId || null, "checkout_initiated", { tier, platform: clientPlatform, provider: "revenuecat" });

          return res.json({
            provider: "revenuecat",
            productId,
            tier,
            platform: clientPlatform,
            // Client should use RevenueCat SDK to initiate purchase
          });
        }
      }

      // For web, try Stripe first
      if (clientPlatform === "web" && providerReady) {
        const stripeConfig = await getBillingProviderWithKeys("stripe");

        if (stripeConfig && stripeConfig.apiKey) {
          // Create Stripe checkout session
          try {
            const tierConfig = TIER_CONFIG[tier];
            const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${stripeConfig.apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                "mode": "subscription",
                "success_url": `https://mienkingdom.com/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
                "cancel_url": `https://mienkingdom.com/subscription?cancelled=true`,
                "client_reference_id": userId || "",
                "line_items[0][price_data][currency]": (stripeConfig.config as any)?.currency || "usd",
                "line_items[0][price_data][product_data][name]": `Mien Kingdom ${tierConfig.name}`,
                "line_items[0][price_data][unit_amount]": String(tierConfig.priceUsd * 100),
                "line_items[0][price_data][recurring][interval]": "month",
                "line_items[0][quantity]": "1",
                "metadata[user_id]": userId || "",
                "metadata[tier_slug]": tier,
              }),
            });

            if (response.ok) {
              const session = await response.json();
              await logActivity(userId || null, "checkout_initiated", { tier, platform: clientPlatform, provider: "stripe" });
              return res.json({
                checkout_url: session.url,
                provider: "stripe",
                sessionId: session.id,
              });
            } else {
              const error = await response.json();
              console.error("[Billing] Stripe checkout session creation failed:", error);
              // Fall through to Three Tears
            }
          } catch (stripeError) {
            console.error("[Billing] Stripe error:", stripeError);
            // Fall through to Three Tears
          }
        }
      }

      // Fallback to Three Tears for checkout
      const mainAppUrl = await getMainAppBaseUrl();
      const appId = await getAppId();
      const params = new URLSearchParams({
        user_id: userId || "",
        target_tier_slug: tier,
        app_id: appId,
        return_url: `https://mienkingdom.com/subscription?success=true`,
        cancel_url: `https://mienkingdom.com/subscription?cancelled=true`,
      });
      const checkoutResponse = await fetch(`${mainAppUrl}/api/billing/checkout-url?${params.toString()}`, {
        method: "GET",
      });

      const responseText = await checkoutResponse.text();
      const contentType = checkoutResponse.headers.get("content-type") || "";

      if (!checkoutResponse.ok) {
        console.error(`[Billing] Failed to get checkout URL: status=${checkoutResponse.status}, content-type=${contentType}, body=${responseText.substring(0, 500)}`);
        return res.status(500).json({ error: "Failed to get checkout URL" });
      }

      if (!contentType.includes("application/json")) {
        console.error(`[Billing] Expected JSON but got ${contentType}. URL: ${mainAppUrl}/api/billing/checkout-url`);
        return res.status(500).json({ error: "Billing service returned invalid response" });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Billing] JSON parse error. Response was: ${responseText.substring(0, 500)}`);
        return res.status(500).json({ error: "Failed to parse billing response" });
      }

      const { checkout_url } = data;

      if (!checkout_url) {
        console.error(`[Billing] No checkout_url in response:`, data);
        return res.status(500).json({ error: "Billing service did not return checkout URL" });
      }

      await logActivity(userId || null, "checkout_initiated", { tier, platform: clientPlatform, provider: "three_tears" });

      res.json({ checkout_url, provider: "three_tears" });
    } catch (error) {
      console.error("[Billing] Checkout URL error:", error);
      res.status(500).json({ error: "Failed to get checkout URL" });
    }
  });

  // Mock checkout endpoint for local development
  // This simulates what would happen after a successful Stripe payment
  // Supports both redirect (browser) and JSON response (fetch)
  app.get("/api/billing/mock-checkout", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const isDev = process.env.NODE_ENV === "development";
    const isLocalhost = process.env.EXPO_PUBLIC_DOMAIN?.includes("localhost") ||
                        process.env.EXPO_PUBLIC_DOMAIN?.includes("127.0.0.1");

    if (!isDev || !isLocalhost) {
      return res.status(404).json({ error: "Not found" });
    }

    const { tier } = req.query;
    // Use authenticated user's ID instead of query parameter to prevent IDOR
    const user_id = req.user!.id;
    const wantsJson = req.headers.accept?.includes("application/json");

    try {
      if (tier && typeof tier === "string") {
        // Handle tier upgrade
        const tierConfig = TIER_CONFIG[tier];
        if (!tierConfig) {
          return wantsJson
            ? res.status(400).json({ error: "Invalid tier" })
            : res.status(400).send("Invalid tier");
        }

        const tierCredits = getCreditsForTier(tier);
        const subscriptionExpiresAt = new Date();
        subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);

        await db.update(users)
          .set({
            tierSlug: tier,
            credits: tierCredits,
            subscriptionActive: tier !== "free",
            subscriptionExpiresAt,
            lastCreditReset: new Date(),
          })
          .where(eq(users.id, user_id as string));

        console.log(`[Mock Billing] Upgraded user ${user_id} to tier ${tier} with ${tierCredits} credits`);
        await logActivity(user_id as string, "mock_tier_upgrade", { tier, credits: tierCredits });

        // Return JSON for fetch, redirect for browser
        if (wantsJson) {
          return res.json({
            success: true,
            type: "tier_upgrade",
            tier,
            credits: tierCredits,
            subscriptionExpiresAt: subscriptionExpiresAt.toISOString(),
          });
        }
        return res.redirect("http://localhost:3000/subscription?success=true");
      }

      return wantsJson
        ? res.status(400).json({ error: "Invalid parameters" })
        : res.status(400).send("Invalid parameters");
    } catch (error) {
      console.error("[Mock Billing] Error:", error);
      return wantsJson
        ? res.status(500).json({ error: "Mock checkout failed" })
        : res.status(500).send("Mock checkout failed");
    }
  });

  // Get subscription info
  app.get("/api/subscription", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Disable caching to always return fresh data after CRM updates
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [user] = await db
        .select({
          tierSlug: users.tierSlug,
          credits: users.credits,
          subscriptionActive: users.subscriptionActive,
          subscriptionExpiresAt: users.subscriptionExpiresAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        tierSlug: user.tierSlug,
        credits: user.credits,
        subscriptionActive: user.subscriptionActive,
        subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() || null,
        tiers: TIER_ORDER.map(slug => TIER_CONFIG[slug]),
      });
    } catch (error) {
      console.error("[Subscription] Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  app.get("/api/credits/history", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ total }] = await db
        .select({ total: count() })
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId));

      const featureStats = await db
        .select({
          feature: creditTransactions.feature,
          totalUsed: count(),
        })
        .from(creditTransactions)
        .where(and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.type, "deduction")
        ))
        .groupBy(creditTransactions.feature);

      res.json({
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          feature: t.feature,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
        total,
        featureStats: featureStats.reduce((acc, stat) => {
          if (stat.feature) acc[stat.feature] = Number(stat.totalUsed);
          return acc;
        }, {} as Record<string, number>),
      });
    } catch (error) {
      console.error("[Credits] Error fetching credit history:", error);
      res.status(500).json({ error: "Failed to fetch credit history" });
    }
  });

  // Help Center - AI Chat with Rate Limiting
  // GET /api/help/query-count - Get user's query count for today
  app.get("/api/help/query-count", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [result] = await db
        .select({ count: count() })
        .from(helpQueries)
        .where(and(
          eq(helpQueries.userId, user.id),
          gte(helpQueries.createdAt, today)
        ));

      res.json({ count: result?.count || 0, limit: 30 });
    } catch (error) {
      console.error("[Help] Error fetching query count:", error);
      res.status(500).json({ error: "Failed to fetch query count" });
    }
  });

  // POST /api/help/chat - AI chat with RAG on help articles
  app.post("/api/help/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { message, context } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check rate limit (30 queries per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [queryCount] = await db
        .select({ count: count() })
        .from(helpQueries)
        .where(and(
          eq(helpQueries.userId, user.id),
          gte(helpQueries.createdAt, today)
        ));

      if ((queryCount?.count || 0) >= 30) {
        return res.status(429).json({ 
          error: "Daily query limit reached", 
          response: "You've reached your daily limit of 30 questions. Please try again tomorrow or contact support for urgent issues." 
        });
      }

      // Use Gemini Flash for RAG response
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const genAI = new GoogleGenAI({ apiKey });

      const systemPrompt = `You are a helpful assistant for Mien Kingdom, a social app for the Mien ethnic community. 
Answer questions based on the following help articles. Be concise and helpful. 
If you don't know the answer or the question is not covered in the articles, say "I'm not sure about that. Would you like to contact our support team for more help?"

Help Articles Context:
${context || "No context provided"}

User Question: ${message}`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: systemPrompt,
      });

      const responseText = result.text || "I apologize, I couldn't generate a response. Please try again.";

      // Log the query
      await db.insert(helpQueries).values({
        userId: user.id,
        query: message,
        response: responseText,
      });

      await logActivity(user.id, "help_chat_query", { query: message.substring(0, 100) });

      // Log feature usage
      logFeatureUsage({
        userId: user.id,
        category: "ai_assistant",
        featureName: "help_chat",
        metadata: { queryLength: message.length },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ response: responseText });
    } catch (error) {
      console.error("[Help] Chat error:", error);
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_assistant",
        featureName: "help_chat",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Failed to process question", response: "Sorry, something went wrong. Please try again." });
    }
  });

  // Sync endpoints for Three Tears (server-to-server, requires shared secret)
  const requireSyncAuth = (req: Request, res: Response, next: NextFunction) => {
    const syncSecret = process.env.THREE_TEARS_ENROLLMENT_SECRET;
    if (!syncSecret) {
      return res.status(500).json({ error: "Sync not configured" });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${syncSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  app.post("/api/sync/tickets", requireSyncAuth, async (req: Request, res: Response) => {
    try {
      const { tickets } = req.body;
      console.log("[Sync] Received tickets sync request");
      await logActivity(null, "sync_tickets_received", { count: tickets?.length || 0 });
      res.json({ success: true });
    } catch (error) {
      console.error("[Sync] Tickets sync error:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  app.post("/api/sync/users", requireSyncAuth, async (req: Request, res: Response) => {
    try {
      const { users: syncUsers } = req.body;
      console.log("[Sync] Received users sync request");
      await logActivity(null, "sync_users_received", { count: syncUsers?.length || 0 });
      res.json({ success: true });
    } catch (error) {
      console.error("[Sync] Users sync error:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // ============================================
  // ENCRYPTED MESSAGING API ROUTES
  // ============================================

  // Get user's friends list (mutual followers) - admins see all users
  app.get("/api/messages/friends", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const isAdmin = req.user!.role === "admin";

      if (isAdmin) {
        // Admins can message anyone - return all users except themselves
        const allUsers = await db
          .select({
            id: users.id,
            displayName: users.displayName,
            avatar: users.avatar,
          })
          .from(users)
          .where(sql`${users.id} != ${req.user!.id}`)
          .orderBy(users.displayName)
          .limit(500);
        res.json({ friends: allUsers });
      } else {
        const friends = await getFriendsList(req.user!.id);
        res.json({ friends });
      }
    } catch (error) {
      console.error("[Messages] Get friends error:", error);
      res.status(500).json({ error: "Failed to get friends list" });
    }
  });

  // Get all conversations for the user
  app.get("/api/messages/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const conversations = await getUserConversations(req.user!.id);
      res.json({ conversations });
    } catch (error) {
      console.error("[Messages] Get conversations error:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  // Get or create a conversation with another user
  app.post("/api/messages/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { participantId } = req.body;

      if (!participantId) {
        return res.status(400).json({ error: "Participant ID is required" });
      }

      if (participantId === req.user!.id) {
        return res.status(400).json({ error: "Cannot create conversation with yourself" });
      }

      // Verify they are friends (mutual followers) - admins can message anyone
      const isAdmin = req.user!.role === "admin";
      if (!isAdmin) {
        const areFriends = await areMutualFollowers(req.user!.id, participantId);
        if (!areFriends) {
          return res.status(403).json({ error: "You can only message friends (mutual followers)" });
        }
      }

      const conversation = await getOrCreateConversation(req.user!.id, participantId);

      // Get participant info
      const [participant] = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
        })
        .from(users)
        .where(eq(users.id, participantId));

      res.json({
        conversation: {
          ...conversation,
          participant,
        },
      });
    } catch (error) {
      console.error("[Messages] Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Get messages in a conversation
  app.get("/api/messages/conversations/:conversationId/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { conversationId } = req.params;
      const { before, limit } = req.query;

      // Verify user is participant
      const isParticipant = await isConversationParticipant(conversationId, req.user!.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized to view this conversation" });
      }

      const messages = await getConversationMessages(
        conversationId,
        limit ? parseInt(limit as string) : 50,
        before as string | undefined
      );

      res.json({ messages });
    } catch (error) {
      console.error("[Messages] Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Send an encrypted message
  app.post("/api/messages/conversations/:conversationId/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { conversationId } = req.params;
      const { encryptedContent, encryptedContentIv, messageType } = req.body;

      if (!encryptedContent || !encryptedContentIv) {
        return res.status(400).json({ error: "Encrypted content and IV are required" });
      }

      // Verify user is participant
      const isParticipant = await isConversationParticipant(conversationId, req.user!.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized to send messages in this conversation" });
      }

      const message = await sendEncryptedMessage(
        conversationId,
        req.user!.id,
        encryptedContent,
        encryptedContentIv,
        messageType || "text"
      );

      // Get conversation to broadcast to participants
      const conversation = await getConversation(conversationId);
      if (conversation) {
        broadcastNewMessage(conversationId, [conversation.participant1Id, conversation.participant2Id], {
          id: message.id,
          senderId: message.senderId,
          encryptedContent: message.encryptedContent,
          encryptedContentIv: message.encryptedContentIv,
          messageType: message.messageType,
          createdAt: message.createdAt.toISOString(),
        });
      }

      res.json({ message });
    } catch (error) {
      console.error("[Messages] Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Mark messages as read
  app.post("/api/messages/conversations/:conversationId/read", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { conversationId } = req.params;
      const { messageIds } = req.body;

      // Verify user is participant
      const isParticipant = await isConversationParticipant(conversationId, req.user!.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await markMessagesAsRead(conversationId, req.user!.id, messageIds);

      res.json({ success: true });
    } catch (error) {
      console.error("[Messages] Mark read error:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread-count", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const count = await getUnreadMessageCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("[Messages] Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Get another user's public key bundle
  app.get("/api/messages/keys/:userId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;

      const keys = await getUserPublicKeys(userId);
      if (!keys) {
        return res.status(404).json({ error: "User has not set up encryption keys" });
      }

      res.json({
        publicKey: keys.publicKey,
        identityPublicKey: keys.identityPublicKey,
        signedPreKey: keys.signedPreKey,
        preKeySignature: keys.preKeySignature,
      });
    } catch (error) {
      console.error("[Messages] Get public keys error:", error);
      res.status(500).json({ error: "Failed to get public keys" });
    }
  });

  // Upload/update own public keys
  app.post("/api/messages/keys", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { publicKey, identityPublicKey, signedPreKey, preKeySignature } = req.body;

      if (!publicKey || !identityPublicKey || !signedPreKey || !preKeySignature) {
        return res.status(400).json({ error: "All key fields are required" });
      }

      const keys = await saveUserPublicKeys(
        req.user!.id,
        publicKey,
        identityPublicKey,
        signedPreKey,
        preKeySignature
      );

      res.json({ success: true, keys });
    } catch (error) {
      console.error("[Messages] Save public keys error:", error);
      res.status(500).json({ error: "Failed to save public keys" });
    }
  });

  // Get own public keys
  app.get("/api/messages/keys", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const keys = await getUserPublicKeys(req.user!.id);
      res.json({ keys });
    } catch (error) {
      console.error("[Messages] Get own keys error:", error);
      res.status(500).json({ error: "Failed to get keys" });
    }
  });

  // Save conversation key
  app.post("/api/messages/conversations/:conversationId/key", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { conversationId } = req.params;
      const { encryptedSharedKey, encryptedSharedKeyIv } = req.body;

      // Verify user is participant
      const isParticipant = await isConversationParticipant(conversationId, req.user!.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const key = await saveConversationKey(
        conversationId,
        req.user!.id,
        encryptedSharedKey,
        encryptedSharedKeyIv
      );

      res.json({ success: true, key });
    } catch (error) {
      console.error("[Messages] Save conversation key error:", error);
      res.status(500).json({ error: "Failed to save conversation key" });
    }
  });

  // Get conversation key
  app.get("/api/messages/conversations/:conversationId/key", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { conversationId } = req.params;

      // Verify user is participant
      const isParticipant = await isConversationParticipant(conversationId, req.user!.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const key = await getConversationKey(conversationId, req.user!.id);
      res.json({ key });
    } catch (error) {
      console.error("[Messages] Get conversation key error:", error);
      res.status(500).json({ error: "Failed to get conversation key" });
    }
  });

  // ==================== AI Avatar Routes ====================

  // Track last credit deduction per user for rate limiting
  const avatarLastDeduction = new Map<string, number>();
  const AVATAR_MIN_DEDUCTION_INTERVAL_MS = 55000; // At least 55 seconds between deductions
  const AVATAR_CREDITS_PER_MINUTE = 20;

  // Deduct credits for avatar session (called every minute during active session)
  app.post("/api/avatar/deduct-credits", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { credits } = req.body;
      const userId = req.user!.id;

      // Rate limiting: Prevent too frequent deductions
      const lastDeduction = avatarLastDeduction.get(userId);
      const now = Date.now();
      if (lastDeduction && (now - lastDeduction) < AVATAR_MIN_DEDUCTION_INTERVAL_MS) {
        return res.status(429).json({
          error: "Too many requests",
          message: "Credit deduction rate limit exceeded",
          retryAfter: Math.ceil((AVATAR_MIN_DEDUCTION_INTERVAL_MS - (now - lastDeduction)) / 1000),
        });
      }

      // Validate credit amount (must be exactly 16 for avatar)
      if (credits !== AVATAR_CREDITS_PER_MINUTE) {
        return res.status(400).json({
          error: "Invalid credits amount",
          message: `Avatar session requires exactly ${AVATAR_CREDITS_PER_MINUTE} credits per minute`,
        });
      }


      // Get current credit balances
      const [user] = await db
        .select({
          subscriptionCredits: users.credits,
          packCredits: users.packCredits,
          tierSlug: users.tierSlug
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const totalCredits = user.subscriptionCredits + user.packCredits;

      // Check if user has enough credits
      if (totalCredits < credits) {
        await db.insert(activityLogs).values({
          userId,
          action: "avatar_insufficient_credits",
          metadata: {
            required: credits,
            subscriptionCredits: user.subscriptionCredits,
            packCredits: user.packCredits,
            totalCredits,
          },
        });

        return res.status(402).json({
          error: "Insufficient credits",
          message: "You don't have enough credits to continue the avatar session",
          required: credits,
          available: totalCredits,
        });
      }

      // Deduct credits atomically: first from subscription credits, then from pack credits
      let remainingCost = credits;
      let newSubscriptionCredits = user.subscriptionCredits;
      let newPackCredits = user.packCredits;

      if (newSubscriptionCredits >= remainingCost) {
        newSubscriptionCredits -= remainingCost;
        remainingCost = 0;
      } else {
        remainingCost -= newSubscriptionCredits;
        newSubscriptionCredits = 0;
        newPackCredits -= remainingCost;
        remainingCost = 0;
      }

      // Update user credits
      await db
        .update(users)
        .set({
          credits: newSubscriptionCredits,
          packCredits: newPackCredits
        })
        .where(eq(users.id, userId));

      const newTotalCredits = newSubscriptionCredits + newPackCredits;

      // Log the transaction
      await db.insert(creditTransactions).values({
        userId,
        type: "deduction",
        amount: -credits,
        balanceAfter: newTotalCredits,
        feature: "avatar_talk_to_ong",
        description: `Used ${credits} credits for AI avatar conversation`,
      });

      await db.insert(activityLogs).values({
        userId,
        action: "avatar_credits_deducted",
        metadata: {
          cost: credits,
          subscriptionCredits: newSubscriptionCredits,
          packCredits: newPackCredits,
          totalRemaining: newTotalCredits,
        },
      });

      // Update rate limiting tracker
      avatarLastDeduction.set(userId, Date.now());

      res.json({
        success: true,
        remainingCredits: newTotalCredits,
        subscriptionCredits: newSubscriptionCredits,
        packCredits: newPackCredits,
      });
    } catch (error) {
      console.error("[Avatar] Credit deduction error:", error);
      res.status(500).json({ error: "Failed to deduct credits" });
    }
  });

  // Public endpoint to check if avatar agent is available
  app.get("/api/avatar/status", async (req, res) => {
    try {
      const agentStatus = getAvatarAgentStatus();
      const isAvailable = agentStatus.running && !agentStatus.disabled;

      res.json({
        available: isAvailable,
        disabled: agentStatus.disabled,
        disabledReason: agentStatus.disabledReason,
      });
    } catch (error) {
      res.json({
        available: false,
        disabled: true,
        disabledReason: "Unable to check agent status",
      });
    }
  });

  // Start avatar session with LiveKit room and token
  app.post("/api/avatar/session/start", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;

      // Check if Gemini is configured
      if (!isGeminiConfigured()) {
        return res.status(503).json({
          error: "Avatar service not configured",
          message: "The AI avatar service is not available at this time",
        });
      }

      // Check LiveKit configuration
      const livekitUrl = process.env.LIVEKIT_URL;
      const livekitApiKey = process.env.LIVEKIT_API_KEY;
      const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
      const simliApiKey = process.env.SIMLI_API_KEY;
      const simliFaceId = process.env.SIMLI_FACE_ID;

      if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
        return res.status(503).json({
          error: "LiveKit not configured",
          message: "The real-time communication service is not available",
        });
      }

      if (!simliApiKey || !simliFaceId) {
        return res.status(503).json({
          error: "Avatar rendering not configured",
          message: "The avatar rendering service is not available",
        });
      }

      const sessionId = `avatar_${userId}_${Date.now()}`;
      const roomName = `ong-room-${userId}-${Date.now()}`;

      // Get a Gemini API key for this session
      const apiKey = getNextGeminiApiKey(sessionId);
      if (!apiKey) {
        return res.status(503).json({
          error: "No API keys available",
          message: "Unable to start avatar session. Please try again later.",
        });
      }

      // Get the key index for the Python agent
      const geminiKeyIndex = getGeminiKeyForSession(sessionId);

      // Generate LiveKit access token for the user
      const { AccessToken, RoomServiceClient } = await import("livekit-server-sdk");
      const at = new AccessToken(livekitApiKey, livekitApiSecret, {
        identity: userId,
        name: `User ${userId}`,
        ttl: "1h",
      });

      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const token = await at.toJwt();

      // Create the room with metadata for the Python agent
      const roomService = new RoomServiceClient(livekitUrl, livekitApiKey, livekitApiSecret);
      try {
        await roomService.createRoom({
          name: roomName,
          metadata: JSON.stringify({
            geminiKeyIndex,
            sessionId,
            userId,
          }),
        });
        console.log(`[Avatar] Created LiveKit room: ${roomName}`);
      } catch (roomError) {
        console.log(`[Avatar] Room may already exist or creation skipped: ${roomError}`);
      }

      // Note: Python avatar agent should be running separately via: python avatar-agent/agent.py dev
      // It will automatically connect when a room is created
      console.log(`[Avatar] Room ${roomName} ready for Python agent connection`);

      await db.insert(activityLogs).values({
        userId,
        action: "avatar_session_started",
        metadata: { sessionId, roomName, geminiKeyIndex },
      });

      // Create avatar session for tracking
      const avatarSessionId = await createAvatarSession(userId, "ong", undefined, req.get("User-Agent")?.includes("Mobile") ? "mobile" : "web");

      // Log feature usage
      logFeatureUsage({
        userId,
        category: "avatar",
        featureName: "avatar_session",
        subFeature: "ong",
        metadata: { sessionId, roomName, avatarSessionId },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        sessionId,
        roomName,
        token,
        livekitUrl,
        avatarSessionId,
        simliConfig: {
          faceId: simliFaceId,
        },
      });
    } catch (error) {
      console.error("[Avatar] Session start error:", error);
      logFeatureUsage({
        userId: req.user?.id,
        category: "avatar",
        featureName: "avatar_session",
        subFeature: "ong",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Failed to start avatar session" });
    }
  });

  // End avatar session
  app.post("/api/avatar/session/end", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId, avatarSessionId, messageCount, userMessageCount, avatarResponseCount } = req.body;
      const userId = req.user!.id;

      if (sessionId) {
        releaseGeminiApiKey(sessionId);
      }

      // End the avatar session tracking
      if (avatarSessionId) {
        await endAvatarSession(avatarSessionId, messageCount, userMessageCount, avatarResponseCount, "completed");
      }

      // Clear rate limiting tracker for this user
      avatarLastDeduction.delete(userId);

      await db.insert(activityLogs).values({
        userId,
        action: "avatar_session_ended",
        metadata: { sessionId, avatarSessionId, messageCount },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[Avatar] Session end error:", error);
      res.status(500).json({ error: "Failed to end avatar session" });
    }
  });

  // Get avatar service status (for admin)
  app.get("/api/avatar/status", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const keyStatus = getKeyStatus();

      res.json({
        configured: isGeminiConfigured(),
        geminiKeys: keyStatus,
        livekitConfigured: !!(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY),
        simliConfigured: !!(process.env.SIMLI_API_KEY && process.env.SIMLI_FACE_ID),
      });
    } catch (error) {
      console.error("[Avatar] Status check error:", error);
      res.status(500).json({ error: "Failed to get avatar status" });
    }
  });

  // ============================================
  // USAGE REPORTING ROUTES (Admin)
  // ============================================

  // Get feature usage summary with filters
  app.get("/api/admin/usage/summary", requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const { startDate, endDate, category } = req.query;

      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const start = startDate ? new Date(startDate as string) : defaultStartDate;
      const end = endDate ? new Date(endDate as string) : now;

      // Build where conditions
      const conditions = [
        gte(featureUsage.createdAt, start),
        gte(end, featureUsage.createdAt),
      ];

      if (category && category !== "all") {
        conditions.push(eq(featureUsage.category, category as FeatureCategory));
      }

      // Get usage counts by feature
      const usageByFeature = await db
        .select({
          category: featureUsage.category,
          featureName: featureUsage.featureName,
          totalCount: count(),
          successCount: sql<number>`COUNT(*) FILTER (WHERE ${featureUsage.status} = 'success')`,
          failedCount: sql<number>`COUNT(*) FILTER (WHERE ${featureUsage.status} = 'failed')`,
          totalCredits: sql<number>`COALESCE(SUM(${featureUsage.creditsUsed}), 0)`,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${featureUsage.userId})`,
        })
        .from(featureUsage)
        .where(and(...conditions))
        .groupBy(featureUsage.category, featureUsage.featureName)
        .orderBy(desc(sql`COUNT(*)`));

      // Get usage counts by sub-feature (for drill-down)
      const usageBySubFeature = await db
        .select({
          category: featureUsage.category,
          featureName: featureUsage.featureName,
          subFeature: featureUsage.subFeature,
          totalCount: count(),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${featureUsage.userId})`,
        })
        .from(featureUsage)
        .where(and(...conditions, sql`${featureUsage.subFeature} IS NOT NULL`))
        .groupBy(featureUsage.category, featureUsage.featureName, featureUsage.subFeature)
        .orderBy(desc(sql`COUNT(*)`));

      // Get daily trends
      const dailyTrends = await db
        .select({
          date: sql<string>`DATE(${featureUsage.createdAt})`,
          totalCount: count(),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${featureUsage.userId})`,
        })
        .from(featureUsage)
        .where(and(...conditions))
        .groupBy(sql`DATE(${featureUsage.createdAt})`)
        .orderBy(sql`DATE(${featureUsage.createdAt})`);

      // Get totals
      const [totals] = await db
        .select({
          totalUsage: count(),
          totalCreditsUsed: sql<number>`COALESCE(SUM(${featureUsage.creditsUsed}), 0)`,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${featureUsage.userId})`,
          successRate: sql<number>`ROUND(100.0 * COUNT(*) FILTER (WHERE ${featureUsage.status} = 'success') / NULLIF(COUNT(*), 0), 1)`,
        })
        .from(featureUsage)
        .where(and(...conditions));

      res.json({
        summary: {
          totalUsage: totals?.totalUsage || 0,
          totalCreditsUsed: totals?.totalCreditsUsed || 0,
          uniqueUsers: totals?.uniqueUsers || 0,
          successRate: totals?.successRate || 0,
          dateRange: { start, end },
        },
        byFeature: usageByFeature,
        bySubFeature: usageBySubFeature,
        dailyTrends,
      });
    } catch (error) {
      console.error("Failed to fetch usage summary:", error);
      res.status(500).json({ error: "Failed to fetch usage summary" });
    }
  });

  // Get AI feature usage breakdown
  app.get("/api/admin/usage/ai-features", requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const { startDate, endDate } = req.query;

      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const start = startDate ? new Date(startDate as string) : defaultStartDate;
      const end = endDate ? new Date(endDate as string) : now;

      // AI generation features from featureUsage
      const aiGenerationUsage = await db
        .select({
          featureName: featureUsage.featureName,
          subFeature: featureUsage.subFeature,
          totalCount: count(),
          successCount: sql<number>`COUNT(*) FILTER (WHERE ${featureUsage.status} = 'success')`,
          totalCredits: sql<number>`COALESCE(SUM(${featureUsage.creditsUsed}), 0)`,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${featureUsage.userId})`,
          avgDuration: sql<number>`ROUND(AVG(${featureUsage.durationMs}))`,
        })
        .from(featureUsage)
        .where(and(
          gte(featureUsage.createdAt, start),
          gte(end, featureUsage.createdAt),
          inArray(featureUsage.category, ["ai_generation", "ai_translation", "ai_assistant"])
        ))
        .groupBy(featureUsage.featureName, featureUsage.subFeature)
        .orderBy(desc(sql`COUNT(*)`));

      // Also get from artGenerations for historical data
      const artGenerationsUsage = await db
        .select({
          type: artGenerations.type,
          totalCount: count(),
          totalCredits: sql<number>`COALESCE(SUM(${artGenerations.creditsUsed}), 0)`,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${artGenerations.userId})`,
        })
        .from(artGenerations)
        .where(and(
          gte(artGenerations.createdAt, start),
          gte(end, artGenerations.createdAt)
        ))
        .groupBy(artGenerations.type)
        .orderBy(desc(sql`COUNT(*)`));

      // Translation usage from help queries
      const helpChatUsage = await db
        .select({
          totalCount: count(),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${helpQueries.userId})`,
        })
        .from(helpQueries)
        .where(and(
          gte(helpQueries.createdAt, start),
          gte(end, helpQueries.createdAt)
        ));

      res.json({
        aiFeatures: aiGenerationUsage,
        artGenerations: artGenerationsUsage,
        helpChat: helpChatUsage[0] || { totalCount: 0, uniqueUsers: 0 },
        dateRange: { start, end },
      });
    } catch (error) {
      console.error("Failed to fetch AI feature usage:", error);
      res.status(500).json({ error: "Failed to fetch AI feature usage" });
    }
  });

  // Get avatar session analytics
  app.get("/api/admin/usage/avatar-sessions", requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const { startDate, endDate } = req.query;

      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const start = startDate ? new Date(startDate as string) : defaultStartDate;
      const end = endDate ? new Date(endDate as string) : now;

      // Avatar session stats
      const sessionStats = await db
        .select({
          avatarType: avatarSessions.avatarType,
          voiceUsed: avatarSessions.voiceUsed,
          totalSessions: count(),
          completedSessions: sql<number>`COUNT(*) FILTER (WHERE ${avatarSessions.status} = 'completed')`,
          failedSessions: sql<number>`COUNT(*) FILTER (WHERE ${avatarSessions.status} = 'failed')`,
          totalDurationSeconds: sql<number>`COALESCE(SUM(${avatarSessions.durationSeconds}), 0)`,
          avgDurationSeconds: sql<number>`ROUND(AVG(${avatarSessions.durationSeconds}))`,
          totalMessages: sql<number>`COALESCE(SUM(${avatarSessions.messageCount}), 0)`,
          avgMessagesPerSession: sql<number>`ROUND(AVG(${avatarSessions.messageCount}))`,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${avatarSessions.userId})`,
        })
        .from(avatarSessions)
        .where(and(
          gte(avatarSessions.createdAt, start),
          gte(end, avatarSessions.createdAt)
        ))
        .groupBy(avatarSessions.avatarType, avatarSessions.voiceUsed)
        .orderBy(desc(sql`COUNT(*)`));

      // Daily avatar usage trends
      const dailyTrends = await db
        .select({
          date: sql<string>`DATE(${avatarSessions.createdAt})`,
          totalSessions: count(),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${avatarSessions.userId})`,
          avgDurationSeconds: sql<number>`ROUND(AVG(${avatarSessions.durationSeconds}))`,
        })
        .from(avatarSessions)
        .where(and(
          gte(avatarSessions.createdAt, start),
          gte(end, avatarSessions.createdAt)
        ))
        .groupBy(sql`DATE(${avatarSessions.createdAt})`)
        .orderBy(sql`DATE(${avatarSessions.createdAt})`);

      // Platform breakdown
      const platformStats = await db
        .select({
          platform: avatarSessions.platform,
          totalSessions: count(),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${avatarSessions.userId})`,
        })
        .from(avatarSessions)
        .where(and(
          gte(avatarSessions.createdAt, start),
          gte(end, avatarSessions.createdAt)
        ))
        .groupBy(avatarSessions.platform)
        .orderBy(desc(sql`COUNT(*)`));

      // Overall totals
      const [totals] = await db
        .select({
          totalSessions: count(),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${avatarSessions.userId})`,
          totalDurationHours: sql<number>`ROUND(COALESCE(SUM(${avatarSessions.durationSeconds}), 0) / 3600.0, 1)`,
          avgSessionDuration: sql<number>`ROUND(AVG(${avatarSessions.durationSeconds}))`,
          successRate: sql<number>`ROUND(100.0 * COUNT(*) FILTER (WHERE ${avatarSessions.status} = 'completed') / NULLIF(COUNT(*), 0), 1)`,
        })
        .from(avatarSessions)
        .where(and(
          gte(avatarSessions.createdAt, start),
          gte(end, avatarSessions.createdAt)
        ));

      res.json({
        summary: {
          totalSessions: totals?.totalSessions || 0,
          uniqueUsers: totals?.uniqueUsers || 0,
          totalDurationHours: totals?.totalDurationHours || 0,
          avgSessionDuration: totals?.avgSessionDuration || 0,
          successRate: totals?.successRate || 0,
        },
        byAvatarType: sessionStats,
        byPlatform: platformStats,
        dailyTrends,
        dateRange: { start, end },
      });
    } catch (error) {
      console.error("Failed to fetch avatar session analytics:", error);
      res.status(500).json({ error: "Failed to fetch avatar session analytics" });
    }
  });

  // Get detailed usage logs with pagination
  app.get("/api/admin/usage/logs", requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const { page = "1", limit = "50", category, featureName, status } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const offset = (pageNum - 1) * limitNum;

      const conditions = [];
      if (category && category !== "all") {
        conditions.push(eq(featureUsage.category, category as FeatureCategory));
      }
      if (featureName && featureName !== "all") {
        conditions.push(eq(featureUsage.featureName, featureName as FeatureName));
      }
      if (status && status !== "all") {
        conditions.push(eq(featureUsage.status, status as string));
      }

      const [logs, totalResult] = await Promise.all([
        db
          .select({
            id: featureUsage.id,
            userId: featureUsage.userId,
            category: featureUsage.category,
            featureName: featureUsage.featureName,
            subFeature: featureUsage.subFeature,
            status: featureUsage.status,
            creditsUsed: featureUsage.creditsUsed,
            durationMs: featureUsage.durationMs,
            createdAt: featureUsage.createdAt,
            userDisplayName: users.displayName,
            userEmail: users.email,
          })
          .from(featureUsage)
          .leftJoin(users, eq(featureUsage.userId, users.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(featureUsage.createdAt))
          .limit(limitNum)
          .offset(offset),
        db
          .select({ count: count() })
          .from(featureUsage)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      res.json({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResult[0]?.count || 0,
          totalPages: Math.ceil((totalResult[0]?.count || 0) / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to fetch usage logs:", error);
      res.status(500).json({ error: "Failed to fetch usage logs" });
    }
  });

  // Get top users by feature usage
  app.get("/api/admin/usage/top-users", requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const { startDate, endDate, limit = "10" } = req.query;

      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const start = startDate ? new Date(startDate as string) : defaultStartDate;
      const end = endDate ? new Date(endDate as string) : now;
      const limitNum = Math.min(parseInt(limit as string), 50);

      const topUsers = await db
        .select({
          userId: featureUsage.userId,
          displayName: users.displayName,
          email: users.email,
          avatar: users.avatar,
          totalUsage: count(),
          totalCreditsUsed: sql<number>`COALESCE(SUM(${featureUsage.creditsUsed}), 0)`,
          featuresUsed: sql<number>`COUNT(DISTINCT ${featureUsage.featureName})`,
        })
        .from(featureUsage)
        .innerJoin(users, eq(featureUsage.userId, users.id))
        .where(and(
          gte(featureUsage.createdAt, start),
          gte(end, featureUsage.createdAt)
        ))
        .groupBy(featureUsage.userId, users.displayName, users.email, users.avatar)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(limitNum);

      res.json({
        topUsers,
        dateRange: { start, end },
      });
    } catch (error) {
      console.error("Failed to fetch top users:", error);
      res.status(500).json({ error: "Failed to fetch top users" });
    }
  });

  // ============================================
  // RECIPE STORAGE ENDPOINTS
  // ============================================

  // Helper function to initialize default categories for a user
  async function initializeDefaultCategories(userId: string) {
    const existingCategories = await db
      .select()
      .from(recipeCategories)
      .where(eq(recipeCategories.userId, userId))
      .limit(1);

    if (existingCategories.length === 0) {
      const categoriesToInsert = DEFAULT_RECIPE_CATEGORIES.map((cat) => ({
        userId,
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isDefault: true,
      }));

      await db.insert(recipeCategories).values(categoriesToInsert);
    }
  }

  // GET /api/recipe-categories - List all categories for current user
  app.get("/api/recipe-categories", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Auto-create default categories if user has none
      await initializeDefaultCategories(req.user!.id);

      // Get categories with recipe counts
      const categories = await db
        .select({
          id: recipeCategories.id,
          name: recipeCategories.name,
          description: recipeCategories.description,
          thumbnailUrl: recipeCategories.thumbnailUrl,
          thumbnailRecipeId: recipeCategories.thumbnailRecipeId,
          displayOrder: recipeCategories.displayOrder,
          isDefault: recipeCategories.isDefault,
          createdAt: recipeCategories.createdAt,
          recipeCount: sql<number>`(SELECT COUNT(*) FROM saved_recipes WHERE category_id = ${recipeCategories.id})`,
        })
        .from(recipeCategories)
        .where(eq(recipeCategories.userId, req.user!.id))
        .orderBy(recipeCategories.displayOrder);

      res.json({ categories });
    } catch (error) {
      console.error("Failed to fetch recipe categories:", error);
      res.status(500).json({ error: "Failed to fetch recipe categories" });
    }
  });

  // POST /api/recipe-categories - Create new category
  app.post("/api/recipe-categories", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }

      // Get max display order
      const maxOrder = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(display_order), 0)` })
        .from(recipeCategories)
        .where(eq(recipeCategories.userId, req.user!.id));

      const newCategory = await db
        .insert(recipeCategories)
        .values({
          userId: req.user!.id,
          name: name.trim(),
          description: description?.trim() || null,
          displayOrder: (maxOrder[0]?.maxOrder || 0) + 1,
          isDefault: false,
        })
        .returning();

      res.json({ category: newCategory[0] });
    } catch (error) {
      console.error("Failed to create recipe category:", error);
      res.status(500).json({ error: "Failed to create recipe category" });
    }
  });

  // PATCH /api/recipe-categories/:id - Update category
  app.patch("/api/recipe-categories/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { name, description, displayOrder } = req.body;

      // Verify ownership
      const category = await db
        .select()
        .from(recipeCategories)
        .where(and(eq(recipeCategories.id, id), eq(recipeCategories.userId, req.user!.id)))
        .limit(1);

      if (category.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

      const updatedCategory = await db
        .update(recipeCategories)
        .set(updateData)
        .where(eq(recipeCategories.id, id))
        .returning();

      res.json({ category: updatedCategory[0] });
    } catch (error) {
      console.error("Failed to update recipe category:", error);
      res.status(500).json({ error: "Failed to update recipe category" });
    }
  });

  // DELETE /api/recipe-categories/:id - Delete category
  app.delete("/api/recipe-categories/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const category = await db
        .select()
        .from(recipeCategories)
        .where(and(eq(recipeCategories.id, id), eq(recipeCategories.userId, req.user!.id)))
        .limit(1);

      if (category.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Delete category (cascades to recipes)
      await db.delete(recipeCategories).where(eq(recipeCategories.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete recipe category:", error);
      res.status(500).json({ error: "Failed to delete recipe category" });
    }
  });

  // PATCH /api/recipe-categories/:id/thumbnail - Update category thumbnail from a recipe
  app.patch("/api/recipe-categories/:id/thumbnail", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { recipeId } = req.body;

      // Verify category ownership
      const category = await db
        .select()
        .from(recipeCategories)
        .where(and(eq(recipeCategories.id, id), eq(recipeCategories.userId, req.user!.id)))
        .limit(1);

      if (category.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      let thumbnailUrl = null;
      let thumbnailRecipeId = null;

      if (recipeId) {
        // Verify recipe ownership and get its photo
        const recipe = await db
          .select()
          .from(savedRecipes)
          .where(and(eq(savedRecipes.id, recipeId), eq(savedRecipes.userId, req.user!.id)))
          .limit(1);

        if (recipe.length === 0) {
          return res.status(404).json({ error: "Recipe not found" });
        }

        thumbnailUrl = recipe[0].primaryPhotoUrl;
        thumbnailRecipeId = recipe[0].id;
      }

      const updatedCategory = await db
        .update(recipeCategories)
        .set({
          thumbnailUrl,
          thumbnailRecipeId,
          updatedAt: new Date(),
        })
        .where(eq(recipeCategories.id, id))
        .returning();

      res.json({ category: updatedCategory[0] });
    } catch (error) {
      console.error("Failed to update category thumbnail:", error);
      res.status(500).json({ error: "Failed to update category thumbnail" });
    }
  });

  // GET /api/saved-recipes - List saved recipes with optional filters
  app.get("/api/saved-recipes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { categoryId, isFavorite, isMienDish, limit = "50", offset = "0" } = req.query;

      const conditions = [eq(savedRecipes.userId, req.user!.id)];

      if (categoryId) {
        conditions.push(eq(savedRecipes.categoryId, categoryId as string));
      }
      if (isFavorite === "true") {
        conditions.push(eq(savedRecipes.isFavorite, true));
      }
      if (isMienDish === "true") {
        conditions.push(eq(savedRecipes.isMienDish, true));
      }

      const recipes = await db
        .select({
          id: savedRecipes.id,
          recipeName: savedRecipes.recipeName,
          description: savedRecipes.description,
          prepTime: savedRecipes.prepTime,
          cookTime: savedRecipes.cookTime,
          isMienDish: savedRecipes.isMienDish,
          primaryPhotoUrl: savedRecipes.primaryPhotoUrl,
          isFavorite: savedRecipes.isFavorite,
          categoryId: savedRecipes.categoryId,
          createdAt: savedRecipes.createdAt,
        })
        .from(savedRecipes)
        .where(and(...conditions))
        .orderBy(desc(savedRecipes.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json({ recipes });
    } catch (error) {
      console.error("Failed to fetch saved recipes:", error);
      res.status(500).json({ error: "Failed to fetch saved recipes" });
    }
  });

  // GET /api/saved-recipes/:id - Get single recipe detail
  app.get("/api/saved-recipes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const recipe = await db
        .select()
        .from(savedRecipes)
        .where(and(eq(savedRecipes.id, id), eq(savedRecipes.userId, req.user!.id)))
        .limit(1);

      if (recipe.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.json({ recipe: recipe[0] });
    } catch (error) {
      console.error("Failed to fetch recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // POST /api/saved-recipes - Save a new recipe
  app.post("/api/saved-recipes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { categoryId, recipe, photos, sourceImageUrl } = req.body;

      if (!categoryId) {
        return res.status(400).json({ error: "Category ID is required" });
      }
      if (!recipe?.recipeName) {
        return res.status(400).json({ error: "Recipe name is required" });
      }

      // Verify category ownership
      const category = await db
        .select()
        .from(recipeCategories)
        .where(and(eq(recipeCategories.id, categoryId), eq(recipeCategories.userId, req.user!.id)))
        .limit(1);

      if (category.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Upload photos to R2
      const uploadedPhotoUrls: string[] = [];
      if (photos && Array.isArray(photos) && photos.length > 0) {
        for (const photo of photos) {
          try {
            if (isR2Configured()) {
              const result = await uploadBase64ToR2(photo, {
                folder: `recipes/${req.user!.id}`,
              });
              uploadedPhotoUrls.push(`/api/images/${result.key}`);
            }
          } catch (uploadErr) {
            console.error("Failed to upload recipe photo:", uploadErr);
          }
        }
      }

      // Create the recipe
      const newRecipe = await db
        .insert(savedRecipes)
        .values({
          userId: req.user!.id,
          categoryId,
          recipeName: recipe.recipeName,
          description: recipe.description || null,
          servings: recipe.servings || null,
          prepTime: recipe.prepTime || null,
          cookTime: recipe.cookTime || null,
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          shoppingList: recipe.shoppingList || [],
          isMienDish: recipe.isMienDish || false,
          mienHighlights: recipe.mienHighlights || null,
          mienModifications: recipe.mienModifications || null,
          similarMienDish: recipe.similarMienDish || null,
          photos: uploadedPhotoUrls,
          primaryPhotoUrl: uploadedPhotoUrls[0] || null,
          sourceImageUrl: sourceImageUrl || null,
        })
        .returning();

      // If this is the first recipe in the category, set it as thumbnail
      const recipeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(savedRecipes)
        .where(eq(savedRecipes.categoryId, categoryId));

      if (parseInt(String(recipeCount[0].count)) === 1 && uploadedPhotoUrls[0]) {
        await db
          .update(recipeCategories)
          .set({
            thumbnailUrl: uploadedPhotoUrls[0],
            thumbnailRecipeId: newRecipe[0].id,
            updatedAt: new Date(),
          })
          .where(eq(recipeCategories.id, categoryId));
      }

      res.json({ recipe: newRecipe[0] });
    } catch (error) {
      console.error("Failed to save recipe:", error);
      res.status(500).json({ error: "Failed to save recipe" });
    }
  });

  // PATCH /api/saved-recipes/:id - Update recipe
  app.patch("/api/saved-recipes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { categoryId, notes, isFavorite, primaryPhotoUrl } = req.body;

      // Verify ownership
      const recipe = await db
        .select()
        .from(savedRecipes)
        .where(and(eq(savedRecipes.id, id), eq(savedRecipes.userId, req.user!.id)))
        .limit(1);

      if (recipe.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (categoryId !== undefined) {
        // Verify new category ownership
        const category = await db
          .select()
          .from(recipeCategories)
          .where(and(eq(recipeCategories.id, categoryId), eq(recipeCategories.userId, req.user!.id)))
          .limit(1);

        if (category.length === 0) {
          return res.status(404).json({ error: "Category not found" });
        }
        updateData.categoryId = categoryId;
      }

      if (notes !== undefined) updateData.notes = notes;
      if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
      if (primaryPhotoUrl !== undefined) updateData.primaryPhotoUrl = primaryPhotoUrl;

      const updatedRecipe = await db
        .update(savedRecipes)
        .set(updateData)
        .where(eq(savedRecipes.id, id))
        .returning();

      res.json({ recipe: updatedRecipe[0] });
    } catch (error) {
      console.error("Failed to update recipe:", error);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  // DELETE /api/saved-recipes/:id - Delete recipe
  app.delete("/api/saved-recipes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const recipe = await db
        .select()
        .from(savedRecipes)
        .where(and(eq(savedRecipes.id, id), eq(savedRecipes.userId, req.user!.id)))
        .limit(1);

      if (recipe.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const categoryId = recipe[0].categoryId;

      // Delete the recipe
      await db.delete(savedRecipes).where(eq(savedRecipes.id, id));

      // If this recipe was the category thumbnail, update to next recipe
      const category = await db
        .select()
        .from(recipeCategories)
        .where(eq(recipeCategories.id, categoryId))
        .limit(1);

      if (category[0]?.thumbnailRecipeId === id) {
        // Find next recipe in category to use as thumbnail
        const nextRecipe = await db
          .select()
          .from(savedRecipes)
          .where(eq(savedRecipes.categoryId, categoryId))
          .orderBy(savedRecipes.createdAt)
          .limit(1);

        await db
          .update(recipeCategories)
          .set({
            thumbnailUrl: nextRecipe[0]?.primaryPhotoUrl || null,
            thumbnailRecipeId: nextRecipe[0]?.id || null,
            updatedAt: new Date(),
          })
          .where(eq(recipeCategories.id, categoryId));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // POST /api/saved-recipes/:id/share - Share recipe as a post
  app.post("/api/saved-recipes/:id/share", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { visibility = "public", caption } = req.body;

      // Get recipe
      const recipe = await db
        .select()
        .from(savedRecipes)
        .where(and(eq(savedRecipes.id, id), eq(savedRecipes.userId, req.user!.id)))
        .limit(1);

      if (recipe.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const r = recipe[0];

      // Check if already shared
      if (r.sharedPostId) {
        return res.status(400).json({
          error: "Recipe already shared",
          postId: r.sharedPostId,
        });
      }

      // Generate caption if not provided
      let postCaption = caption;
      if (!postCaption) {
        postCaption = `${r.recipeName}`;
        if (r.isMienDish) {
          postCaption += ` - A traditional Mien dish!`;
        }
        if (r.description) {
          postCaption += `\n\n${r.description}`;
        }
        postCaption += `\n\n#MienKingdom #Recipe`;
        if (r.isMienDish) {
          postCaption += ` #MienCuisine #TraditionalMien`;
        }
      }

      // Create post
      const validVisibilities = ["public", "followers", "private"];
      const postVisibility = validVisibilities.includes(visibility) ? visibility : "public";

      const newPost = await db
        .insert(posts)
        .values({
          userId: req.user!.id,
          caption: postCaption,
          images: (r.photos as string[]) || [],
          visibility: postVisibility,
        })
        .returning();

      // Update recipe with post reference
      await db
        .update(savedRecipes)
        .set({
          sharedPostId: newPost[0].id,
          updatedAt: new Date(),
        })
        .where(eq(savedRecipes.id, id));

      res.json({
        post: newPost[0],
        recipe: { ...r, sharedPostId: newPost[0].id },
      });
    } catch (error) {
      console.error("Failed to share recipe:", error);
      res.status(500).json({ error: "Failed to share recipe" });
    }
  });

  // ============================================
  // PUSH NOTIFICATION ENDPOINTS
  // ============================================

  // Register push token
  app.post("/api/push-tokens", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { token, platform, deviceId } = req.body;

      if (!token || !platform) {
        return res.status(400).json({ error: "Token and platform are required" });
      }

      if (!["web", "ios", "android"].includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      const result = await registerPushToken(req.user!.id, token, platform, deviceId);
      res.json({ success: true, token: result[0] });
    } catch (error) {
      console.error("Failed to register push token:", error);
      res.status(500).json({ error: "Failed to register push token" });
    }
  });

  // Remove push token (on logout)
  app.delete("/api/push-tokens", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      await deactivatePushToken(req.user!.id, token);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove push token:", error);
      res.status(500).json({ error: "Failed to remove push token" });
    }
  });

  // Get notification settings (global)
  app.get("/api/notification-settings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await getOrCreateUserNotificationSettings(req.user!.id);
      res.json({ settings });
    } catch (error) {
      console.error("Failed to get notification settings:", error);
      res.status(500).json({ error: "Failed to get notification settings" });
    }
  });

  // Update global notification settings
  app.patch("/api/notification-settings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { pushEnabled, newFollowerNotifications, newPostNotifications } = req.body;

      // Get or create settings first
      await getOrCreateUserNotificationSettings(req.user!.id);

      const [updated] = await db
        .update(userNotificationSettings)
        .set({
          ...(pushEnabled !== undefined && { pushEnabled }),
          ...(newFollowerNotifications !== undefined && { newFollowerNotifications }),
          ...(newPostNotifications !== undefined && { newPostNotifications }),
          updatedAt: new Date(),
        })
        .where(eq(userNotificationSettings.userId, req.user!.id))
        .returning();

      res.json({ settings: updated });
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Get per-follower notification preferences (people I follow)
  app.get("/api/notification-preferences", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Get list of users I follow
      const following = await db
        .select({
          followeeId: follows.followeeId,
          user: {
            id: users.id,
            displayName: users.displayName,
            avatar: users.avatar,
          },
        })
        .from(follows)
        .leftJoin(users, eq(follows.followeeId, users.id))
        .where(eq(follows.followerId, req.user!.id));

      // Get existing preferences
      const followeeIds = following.map((f) => f.followeeId);
      const preferences = followeeIds.length > 0
        ? await db
            .select()
            .from(notificationPreferences)
            .where(
              and(
                eq(notificationPreferences.userId, req.user!.id),
                inArray(notificationPreferences.followeeId, followeeIds)
              )
            )
        : [];

      // Create preference map
      const prefMap = new Map(preferences.map((p) => [p.followeeId, p]));

      // Merge with following list
      const result = following.map((f) => ({
        followee: f.user,
        preferences: prefMap.get(f.followeeId) || {
          notifyOnNewPost: true,
        },
      }));

      res.json({ preferences: result });
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      res.status(500).json({ error: "Failed to get notification preferences" });
    }
  });

  // Update per-follower notification preferences
  app.patch("/api/notification-preferences/:followeeId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { followeeId } = req.params;
      const { notifyOnNewPost } = req.body;

      // Check if preference exists
      const [existing] = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, req.user!.id),
            eq(notificationPreferences.followeeId, followeeId)
          )
        );

      if (existing) {
        const [updated] = await db
          .update(notificationPreferences)
          .set({
            notifyOnNewPost: notifyOnNewPost ?? existing.notifyOnNewPost,
            updatedAt: new Date(),
          })
          .where(eq(notificationPreferences.id, existing.id))
          .returning();
        return res.json({ preference: updated });
      }

      // Create new preference
      const [created] = await db
        .insert(notificationPreferences)
        .values({
          userId: req.user!.id,
          followeeId,
          notifyOnNewPost: notifyOnNewPost ?? true,
        })
        .returning();

      res.json({ preference: created });
    } catch (error) {
      console.error("Failed to update notification preference:", error);
      res.status(500).json({ error: "Failed to update notification preference" });
    }
  });

  // Get notifications list
  app.get("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const notificationsList = await db
        .select({
          notification: notifications,
          actor: {
            id: users.id,
            displayName: users.displayName,
            avatar: users.avatar,
          },
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.actorId, users.id))
        .where(eq(notifications.userId, req.user!.id))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({ notifications: notificationsList });
    } catch (error) {
      console.error("Failed to get notifications:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Mark notifications as read
  app.patch("/api/notifications/read", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { notificationIds } = req.body;

      if (notificationIds && notificationIds.length > 0) {
        await db
          .update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(notifications.userId, req.user!.id),
              inArray(notifications.id, notificationIds)
            )
          );
      } else {
        // Mark all as read
        await db
          .update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(notifications.userId, req.user!.id),
              eq(notifications.isRead, false)
            )
          );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, req.user!.id),
            eq(notifications.isRead, false)
          )
        );

      res.json({ count: Number(result?.count || 0) });
    } catch (error) {
      console.error("Failed to get unread count:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // ===== Mien Insights & Literature API =====

  // Helper to parse a CSV line handling quoted fields
  function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  // Helper to clean Mien text: replace dots between syllables with spaces
  function cleanMienText(text: string): string {
    return text.replace(/(\w)\.(\w)/g, "$1 $2");
  }

  // Get today's insight of the day
  app.get("/api/insights/today", async (req, res) => {
    try {
      const csvPath = path.join(process.cwd(), "server", "data", "mien_insights.csv");
      if (!fs.existsSync(csvPath)) {
        return res.json({ insight: null });
      }

      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const dataLines = lines.slice(1);

      // Parse all lines and filter to only phrase-level entries (at least 2 words in Mien)
      const insights = dataLines
        .map((line) => {
          const fields = parseCsvLine(line);
          if (fields.length < 4 || !fields[1] || !fields[2]) return null;
          const mien = cleanMienText(fields[1]);
          // Only include entries where the Mien text has at least 2 words
          if (mien.split(/\s+/).length < 2) return null;
          return {
            id: fields[0],
            mien,
            english: fields[2],
            category: fields[3],
            source: fields[4] || "An Iu Mien Grammar by Dr. Tatsuro Daniel Arisawa",
          };
        })
        .filter(Boolean);

      if (insights.length === 0) {
        return res.json({ insight: null });
      }

      // Select insight based on day of year
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
      const index = dayOfYear % insights.length;

      res.json({
        insight: insights[index],
        totalInsights: insights.length,
        dayIndex: index,
      });
    } catch (error) {
      console.error("Failed to get insight:", error);
      res.status(500).json({ error: "Failed to get insight" });
    }
  });

  // Get all insights (paginated)
  app.get("/api/insights", async (req, res) => {
    try {
      const csvPath = path.join(process.cwd(), "server", "data", "mien_insights.csv");
      if (!fs.existsSync(csvPath)) {
        return res.json({ insights: [], total: 0 });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const category = req.query.category as string;

      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const dataLines = lines.slice(1);

      // Parse all lines using shared helper
      const allInsights = dataLines.map((line) => {
        const fields = parseCsvLine(line);
        if (fields.length < 4 || !fields[1] || !fields[2]) return null;
        return {
          id: fields[0],
          mien: cleanMienText(fields[1]),
          english: fields[2],
          category: fields[3],
          source: fields[4] || "",
        };
      }).filter(Boolean) as { id: string; mien: string; english: string; category: string; source: string }[];

      // Filter by category if specified
      const filtered = category
        ? allInsights.filter((i) => i.category === category)
        : allInsights;

      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      res.json({
        insights: paginated,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      });
    } catch (error) {
      console.error("Failed to get insights:", error);
      res.status(500).json({ error: "Failed to get insights" });
    }
  });

  // --- Grammar Book E-Reader: Split PDF into individual pages for fast loading ---
  const GRAMMAR_CACHE_DIR = path.join(process.cwd(), ".cache", "grammar-book-pages");
  let grammarBookDoc: any = null;
  let grammarBookTotalPages = 0;
  let grammarSplitPromise: Promise<void> | null = null;

  async function loadGrammarBookDoc() {
    if (grammarBookDoc) return;
    const pdfPath = path.join(process.cwd(), "assets", "grammar_book.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);
    grammarBookDoc = await PDFDocument.load(pdfBytes);
    grammarBookTotalPages = grammarBookDoc.getPageCount();
    fs.mkdirSync(GRAMMAR_CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(GRAMMAR_CACHE_DIR, "info.json"),
      JSON.stringify({ totalPages: grammarBookTotalPages }),
    );
  }

  async function getGrammarPagePdf(pageNum: number): Promise<Buffer> {
    const cachedPath = path.join(GRAMMAR_CACHE_DIR, `page-${pageNum}.pdf`);
    if (fs.existsSync(cachedPath)) {
      return fs.readFileSync(cachedPath);
    }
    await loadGrammarBookDoc();
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(grammarBookDoc!, [pageNum - 1]);
    newDoc.addPage(copiedPage);
    const pageBytes = Buffer.from(await newDoc.save());
    fs.writeFileSync(cachedPath, pageBytes);
    return pageBytes;
  }

  // Background task: split all remaining pages so future requests are instant
  async function splitAllPagesBackground() {
    if (grammarSplitPromise) return grammarSplitPromise;
    grammarSplitPromise = (async () => {
      try {
        await loadGrammarBookDoc();
        for (let i = 1; i <= grammarBookTotalPages; i++) {
          const cachedPath = path.join(GRAMMAR_CACHE_DIR, `page-${i}.pdf`);
          if (!fs.existsSync(cachedPath)) {
            const newDoc = await PDFDocument.create();
            const [copiedPage] = await newDoc.copyPages(grammarBookDoc!, [i - 1]);
            newDoc.addPage(copiedPage);
            fs.writeFileSync(cachedPath, Buffer.from(await newDoc.save()));
          }
        }
        // Free source document from memory after all pages cached
        grammarBookDoc = null;
      } catch (err) {
        console.error("Grammar book background split error:", err);
      }
    })();
    return grammarSplitPromise;
  }

  // Get grammar book info (total pages)
  app.get("/api/literature/grammar-book/info", async (_req, res) => {
    try {
      const infoPath = path.join(GRAMMAR_CACHE_DIR, "info.json");
      if (fs.existsSync(infoPath)) {
        const info = JSON.parse(fs.readFileSync(infoPath, "utf-8"));
        return res.json(info);
      }
      await loadGrammarBookDoc();
      res.json({ totalPages: grammarBookTotalPages });
    } catch (err) {
      console.error("Grammar book info error:", err);
      res.status(500).json({ error: "Failed to load grammar book info" });
    }
  });

  // Serve an individual page as a small standalone PDF
  app.get("/api/literature/grammar-book/page/:num", async (req, res) => {
    try {
      const pageNum = parseInt(req.params.num, 10);
      // Get total pages from cache or by loading
      const infoPath = path.join(GRAMMAR_CACHE_DIR, "info.json");
      let total = grammarBookTotalPages;
      if (!total && fs.existsSync(infoPath)) {
        total = JSON.parse(fs.readFileSync(infoPath, "utf-8")).totalPages;
      }
      if (!total) {
        await loadGrammarBookDoc();
        total = grammarBookTotalPages;
      }
      if (isNaN(pageNum) || pageNum < 1 || pageNum > total) {
        return res.status(400).json({ error: `Invalid page number. Must be 1-${total}` });
      }
      const pageBytes = await getGrammarPagePdf(pageNum);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pageBytes.length);
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.send(pageBytes);
      // After serving the first request, start splitting all pages in background
      splitAllPagesBackground().catch(() => {});
    } catch (err) {
      console.error("Grammar book page error:", err);
      res.status(500).json({ error: "Failed to load page" });
    }
  });

  // Keep the full PDF endpoint for download/compatibility
  app.get("/api/literature/grammar-book", (req, res) => {
    const pdfPath = path.join(process.cwd(), "assets", "grammar_book.pdf");
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Grammar book not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=\"An_Iu_Mien_Grammar_Arisawa.pdf\"");
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
  });

  // Serve the grammar book e-reader viewer (HTML page with PDF.js)
  app.get("/api/literature/grammar-book/viewer", (_req, res) => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch}
body{background:var(--bg,#F5EDD8);display:flex;justify-content:center;font-family:system-ui,-apple-system,sans-serif}
body.dark{--bg:#1a1a1a}
#page-container{width:100%;max-width:800px;display:flex;justify-content:center;padding:8px}
canvas{width:100%;height:auto;display:none;background:#fff;border-radius:2px;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
body.dark canvas{background:#262626;box-shadow:0 1px 4px rgba(0,0,0,0.3)}
#loading{position:fixed;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;background:var(--bg,#F5EDD8);color:#9CA3AF;font-size:14px;transition:opacity 0.3s ease}
#loading.fade{opacity:0;pointer-events:none}
.spinner{width:28px;height:28px;border:2.5px solid rgba(156,163,175,0.3);border-top-color:#9CA3AF;border-radius:50%;animation:spin 0.7s linear infinite;margin-bottom:10px}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head>
<body>
<div id="loading"><div class="spinner"></div><span>Loading page...</span></div>
<div id="page-container"><canvas id="pdf-canvas"></canvas></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
var params=new URLSearchParams(location.search);
if(params.get('dark')==='1')document.body.classList.add('dark');
var canvas=document.getElementById('pdf-canvas');
var ctx=canvas.getContext('2d');
var loadingEl=document.getElementById('loading');
var totalPages=0,currentPage=1,rendering=false,pendingPage=null;
var prefetched={};
function notify(d){var m=JSON.stringify(d);try{window.parent.postMessage(m,'*')}catch(e){}try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(m)}catch(e){}}
function prefetchNearby(page){
for(var i=1;i<=5;i++){var p=page+i;if(p<=totalPages&&!prefetched[p]){prefetched[p]=true;
var link=document.createElement('link');link.rel='prefetch';link.as='fetch';
link.href='/api/literature/grammar-book/page/'+p;document.head.appendChild(link)}}
for(var j=1;j<=2;j++){var pb=page-j;if(pb>=1&&!prefetched[pb]){prefetched[pb]=true;
var lb=document.createElement('link');lb.rel='prefetch';lb.as='fetch';
lb.href='/api/literature/grammar-book/page/'+pb;document.head.appendChild(lb)}}}
function renderPage(num){
if(num<1||num>totalPages)return;
if(rendering){pendingPage=num;return}
rendering=true;currentPage=num;
loadingEl.classList.remove('fade');
pdfjsLib.getDocument('/api/literature/grammar-book/page/'+num).promise
.then(function(pdf){return pdf.getPage(1).then(function(page){
var dpr=Math.min(window.devicePixelRatio||2,3);
var viewport=page.getViewport({scale:dpr});
canvas.width=viewport.width;canvas.height=viewport.height;
return page.render({canvasContext:ctx,viewport:viewport}).promise.then(function(){pdf.destroy()})})})
.then(function(){
canvas.style.display='block';loadingEl.classList.add('fade');
window.scrollTo(0,0);
notify({type:'pageRendered',currentPage:currentPage,totalPages:totalPages});
rendering=false;prefetchNearby(currentPage);
if(pendingPage!==null){var p=pendingPage;pendingPage=null;renderPage(p)}
}).catch(function(err){rendering=false;notify({type:'error',message:err.message})})}
var resizeTimer;window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(function(){if(totalPages)renderPage(currentPage)},300)});
function handleMsg(data){if(typeof data==='string'){try{data=JSON.parse(data)}catch(e){return}}
if(data&&data.type==='goToPage'&&data.page)renderPage(data.page);
if(data&&data.type==='setTheme'){if(data.dark)document.body.classList.add('dark');else document.body.classList.remove('dark')}}
window.addEventListener('message',function(e){handleMsg(e.data)});
document.addEventListener('message',function(e){handleMsg(e.data)});
fetch('/api/literature/grammar-book/info').then(function(r){return r.json()})
.then(function(info){totalPages=info.totalPages;notify({type:'pdfLoaded',totalPages:totalPages});renderPage(1)})
.catch(function(err){loadingEl.innerHTML='<span style="color:#EF4444">Failed to load document</span>';notify({type:'error',message:err.message})});
</script></body></html>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(html);
  });

  // ============================================
  // MIEN DICTIONARY ROUTES
  // ============================================

  // Search dictionary entries
  app.get("/api/dictionary/search", async (req, res) => {
    try {
      const query = (req.query.q as string || "").trim();
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = (page - 1) * limit;

      if (!query || query.length < 1) {
        return res.json({ entries: [], total: 0, page, limit });
      }

      const searchTerm = `%${query.toLowerCase()}%`;

      const [entries, countResult] = await Promise.all([
        db.select()
          .from(dictionaryEntries)
          .where(
            or(
              sql`LOWER(${dictionaryEntries.mienWord}) LIKE ${searchTerm}`,
              sql`LOWER(${dictionaryEntries.englishDefinition}) LIKE ${searchTerm}`
            )
          )
          .orderBy(
            sql`CASE WHEN LOWER(${dictionaryEntries.mienWord}) = ${query.toLowerCase()} THEN 0
                      WHEN LOWER(${dictionaryEntries.mienWord}) LIKE ${query.toLowerCase() + '%'} THEN 1
                      WHEN LOWER(${dictionaryEntries.mienWord}) LIKE ${searchTerm} THEN 2
                      ELSE 3 END`,
            dictionaryEntries.mienWord
          )
          .limit(limit)
          .offset(offset),
        db.select({ count: count() })
          .from(dictionaryEntries)
          .where(
            or(
              sql`LOWER(${dictionaryEntries.mienWord}) LIKE ${searchTerm}`,
              sql`LOWER(${dictionaryEntries.englishDefinition}) LIKE ${searchTerm}`
            )
          ),
      ]);

      res.json({
        entries,
        total: Number(countResult[0]?.count || 0),
        page,
        limit,
      });
    } catch (err) {
      console.error("Dictionary search error:", err);
      res.status(500).json({ error: "Failed to search dictionary" });
    }
  });

  // Get dictionary entry count
  app.get("/api/dictionary/count", async (_req, res) => {
    try {
      const result = await db.select({ count: count() }).from(dictionaryEntries);
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (err) {
      console.error("Dictionary count error:", err);
      res.status(500).json({ error: "Failed to get dictionary count" });
    }
  });

  // Story cover image generation
  app.post("/api/stories/generate-cover", requireAuth, requireCredits(3, "story_cover"), async (req: AuthenticatedRequest, res) => {
    try {
      const { storyId, prompt } = req.body;

      if (!storyId || !prompt) {
        return res.status(400).json({ error: "Story ID and prompt are required" });
      }

      console.log(`Generating story cover for: ${storyId}`);

      const coverPrompt = `Create a beautiful book cover illustration. ${prompt}. The art style should be vivid, detailed, and culturally respectful. No text or lettering on the image. High quality digital painting suitable for a book cover.`;

      const coverAI = getDressMeAI();
      const generationStartTime = Date.now();

      const response = await coverAI.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: coverPrompt }],
          },
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

      if (!imagePart?.inlineData?.data) {
        console.error("No cover image generated by Gemini");
        return res.status(500).json({ error: "Failed to generate cover image. Please try again." });
      }

      const generationDuration = Date.now() - generationStartTime;
      console.log(`Story cover generated for ${storyId} in ${generationDuration}ms`);

      let imageUrl: string | null = null;

      // Upload to R2 if configured
      if (isR2Configured()) {
        try {
          const result = await uploadBase64ToR2(imagePart.inlineData.data, {
            folder: `story-covers`,
            contentType: imagePart.inlineData.mimeType || "image/png",
          });
          imageUrl = result.url;
        } catch (r2Error) {
          console.error("R2 upload failed for story cover:", r2Error);
        }
      }

      // Fallback to base64 data URI if R2 not available
      if (!imageUrl) {
        const mimeType = imagePart.inlineData.mimeType || "image/png";
        imageUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
      }

      logFeatureUsage({
        userId: req.user!.id,
        category: "ai_generation",
        featureName: "story_cover",
        subFeature: storyId,
        creditsUsed: 3,
        durationMs: generationDuration,
        metadata: {
          storyId,
          modelUsed: "gemini-3-pro-image-preview",
          uploadedToR2: imageUrl.startsWith("http"),
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ imageUrl });

      // Award XP (fire and forget)
      awardXp(req.user!.id, "ai_image_story_cover").catch(() => {});
    } catch (error) {
      console.error("Story cover generation error:", error);
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_generation",
        featureName: "story_cover",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Cover generation failed. Please try again." });
    }
  });

  // Story completion - award XP
  app.post("/api/stories/:storyId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { storyId } = req.params;
      const result = await awardXp(req.user!.id, "story_completed", { storyId });
      res.json({
        success: result.awarded,
        xp: result.xpAwarded || 0,
        leveledUp: result.leveledUp || false,
        newLevel: result.level,
        reason: result.reason,
      });
    } catch (error) {
      console.error("Story completion XP error:", error);
      res.json({ success: false, xp: 0, leveledUp: false });
    }
  });

  // NOTE: Story translations are now pre-generated in client/data/mienTranslations.ts
  // To regenerate, run: node scripts/translate-stories.mjs
  // The batch-translate endpoint has been removed in favor of static translations.

  // ===== Wheel of Fortune Game API =====

  // Get random Mien phrases for the game
  app.get("/api/game/phrases", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const count = Math.min(parseInt(req.query.count as string) || 5, 10);
      const csvPath = path.join(process.cwd(), "server", "data", "mien_insights.csv");
      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ error: "Phrase data not found" });
      }

      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const dataLines = lines.slice(1);

      // Parse and filter to phrases with 3-7 words
      const phrases = dataLines
        .map((line) => {
          const fields = parseCsvLine(line);
          if (fields.length < 4 || !fields[1] || !fields[2]) return null;
          const mien = cleanMienText(fields[1]);
          const wordCount = mien.split(/\s+/).length;
          if (wordCount < 3 || wordCount > 7) return null;
          return { mien, english: fields[2], category: fields[3] };
        })
        .filter(Boolean) as { mien: string; english: string; category: string }[];

      if (phrases.length === 0) {
        return res.json({ phrases: [] });
      }

      // Shuffle and pick `count` random phrases
      const shuffled = [...phrases].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      res.json({ phrases: selected });
    } catch (error) {
      console.error("Failed to get game phrases:", error);
      res.status(500).json({ error: "Failed to get game phrases" });
    }
  });

  // Save a game score
  app.post("/api/game/scores", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { score, phrasesCompleted, gameType } = req.body;
      if (typeof score !== "number" || typeof phrasesCompleted !== "number") {
        return res.status(400).json({ error: "score and phrasesCompleted are required" });
      }

      const resolvedGameType = gameType || "wheel_of_fortune";

      const [newScore] = await db
        .insert(gameScores)
        .values({
          userId: req.user!.id,
          score,
          phrasesCompleted,
          gameType: resolvedGameType,
        })
        .returning();

      // Award 20 XP for game completion (max 5 per game per day)
      const gameXpType = `game_${resolvedGameType}` as import("./db/schema").XpActivityType;
      const xpResult = await awardXp(req.user!.id, gameXpType, { gameType: resolvedGameType, score });

      // Check if this score lands in top 3 for the leaderboard
      const top3 = await db
        .select({ score: gameScores.score })
        .from(gameScores)
        .where(eq(gameScores.gameType, resolvedGameType))
        .orderBy(desc(gameScores.score))
        .limit(3);

      const isTop3 = top3.length < 3 || score >= (top3[top3.length - 1]?.score ?? 0);
      let leaderboardXp: { awarded: boolean; xpAwarded?: number } = { awarded: false };
      if (isTop3) {
        leaderboardXp = await awardXp(req.user!.id, "game_leaderboard_top3", { gameType: resolvedGameType, score });
      }

      res.json({
        score: newScore,
        xp: {
          completion: xpResult.awarded ? xpResult.xpAwarded : 0,
          leaderboard: leaderboardXp.awarded ? leaderboardXp.xpAwarded : 0,
          totalXp: xpResult.totalXp,
          level: xpResult.level,
          leveledUp: xpResult.leveledUp,
        },
      });
    } catch (error) {
      console.error("Failed to save game score:", error);
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  // Get leaderboard (top 20)
  app.get("/api/game/leaderboard", async (req, res) => {
    try {
      const gameType = (req.query.gameType as string) || "wheel_of_fortune";
      const results = await db
        .select({
          id: gameScores.id,
          score: gameScores.score,
          phrasesCompleted: gameScores.phrasesCompleted,
          createdAt: gameScores.createdAt,
          userId: gameScores.userId,
          displayName: users.displayName,
          avatar: users.avatar,
        })
        .from(gameScores)
        .innerJoin(users, eq(gameScores.userId, users.id))
        .where(eq(gameScores.gameType, gameType))
        .orderBy(desc(gameScores.score))
        .limit(20);

      res.json({ leaderboard: results });
    } catch (error) {
      console.error("Failed to get leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  // Get current user's top scores
  app.get("/api/game/my-scores", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const gameType = (req.query.gameType as string) || "wheel_of_fortune";
      const results = await db
        .select()
        .from(gameScores)
        .where(and(eq(gameScores.userId, req.user!.id), eq(gameScores.gameType, gameType)))
        .orderBy(desc(gameScores.score))
        .limit(5);

      res.json({ scores: results });
    } catch (error) {
      console.error("Failed to get user scores:", error);
      res.status(500).json({ error: "Failed to get scores" });
    }
  });

  // ===== Game Background Images (xAI Grok) =====

  const GAME_BG_DIR = path.resolve(process.cwd(), "public/generated/game-backgrounds");
  const GAME_BG_PROMPTS: Record<string, string> = {
    wheel_of_fortune: "A vibrant, mystical game background for a Wheel of Fortune word-guessing game. Features a glowing golden spinning wheel with ornate Southeast Asian patterns, floating letters scattered in the air, and a rich deep purple and gold color scheme. Magical sparkles and light rays emanate from the wheel. The style is polished mobile game art, 1024x1024, no text or words.",
    vocab_match: "A colorful, playful game background for a vocabulary matching game. Features an open enchanted book with pictures and words floating out of it, surrounded by nature elements like trees, animals, and household items in a whimsical illustrated style. Warm greens, oranges, and teals with a soft gradient sky. Mobile game art style, 1024x1024, no text or words.",
    mien_wordle: "A sleek, modern game background for a word puzzle game. Features a grid of letter tiles floating in a cosmic deep blue space with glowing neon green and yellow highlights. Abstract geometric patterns and subtle circuit-like designs. Clean, minimalist mobile game aesthetic with depth and dimension, 1024x1024, no text or words.",
  };

  app.get("/api/game/backgrounds", async (_req, res) => {
    try {
      // Check which backgrounds already exist
      if (!fs.existsSync(GAME_BG_DIR)) {
        fs.mkdirSync(GAME_BG_DIR, { recursive: true });
      }

      const backgrounds: Record<string, string> = {};
      for (const gameType of Object.keys(GAME_BG_PROMPTS)) {
        const filePath = path.join(GAME_BG_DIR, `${gameType}.png`);
        if (fs.existsSync(filePath)) {
          backgrounds[gameType] = `/generated/game-backgrounds/${gameType}.png`;
        }
      }

      res.json({ backgrounds });
    } catch (error) {
      console.error("Failed to get game backgrounds:", error);
      res.status(500).json({ error: "Failed to get game backgrounds" });
    }
  });

  app.post("/api/game/backgrounds/generate", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const xaiKey = process.env.XAI_API;
      if (!xaiKey) {
        return res.status(500).json({ error: "XAI_API key not configured" });
      }

      if (!fs.existsSync(GAME_BG_DIR)) {
        fs.mkdirSync(GAME_BG_DIR, { recursive: true });
      }

      const results: Record<string, string> = {};
      const gameTypes = Object.keys(GAME_BG_PROMPTS);

      for (const gameType of gameTypes) {
        const filePath = path.join(GAME_BG_DIR, `${gameType}.png`);

        // Skip if already generated (unless force regenerate)
        if (fs.existsSync(filePath) && !req.body?.force) {
          results[gameType] = `/generated/game-backgrounds/${gameType}.png`;
          continue;
        }

        console.log(`Generating background for ${gameType}...`);

        const response = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${xaiKey}`,
          },
          body: JSON.stringify({
            model: "grok-2-image",
            prompt: GAME_BG_PROMPTS[gameType],
            n: 1,
            response_format: "b64_json",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`xAI image generation failed for ${gameType}:`, errText);
          continue;
        }

        const data = await response.json() as { data: { b64_json: string }[] };
        const base64Image = data.data?.[0]?.b64_json;

        if (base64Image) {
          const imageBuffer = Buffer.from(base64Image, "base64");
          fs.writeFileSync(filePath, imageBuffer);
          results[gameType] = `/generated/game-backgrounds/${gameType}.png`;
          console.log(`Background generated for ${gameType}`);
        }
      }

      res.json({ backgrounds: results });
    } catch (error) {
      console.error("Failed to generate game backgrounds:", error);
      res.status(500).json({ error: "Failed to generate game backgrounds" });
    }
  });

  // ===== Mien Wordle Game API =====

  // Get random words from dictionary for Wordle game
  app.get("/api/game/wordle/words", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const count = Math.min(Math.max(parseInt(req.query.count as string) || 5, 1), 10);

      // Get all dictionary entries
      const allEntries = await db
        .select({
          mienWord: dictionaryEntries.mienWord,
          englishDefinition: dictionaryEntries.englishDefinition,
          partOfSpeech: dictionaryEntries.partOfSpeech,
        })
        .from(dictionaryEntries);

      // Filter to words with 2-15 alpha characters (allows phrases with spaces)
      const validEntries = allEntries.filter((entry) => {
        const alphaOnly = entry.mienWord.replace(/[^a-zA-Z]/g, "");
        return alphaOnly.length >= 2 && alphaOnly.length <= 15;
      });

      // Shuffle and pick
      const shuffled = [...validEntries].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      res.json({ words: selected });
    } catch (error) {
      console.error("Failed to get wordle words:", error);
      res.status(500).json({ error: "Failed to get wordle words" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time messaging
  setupWebSocket(httpServer);

  return httpServer;
}
