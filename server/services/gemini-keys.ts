// Gemini API Key Rotation Service
// Manages load balancing across multiple Gemini API keys for the AI avatar feature

interface KeyUsage {
  key: string;
  usageCount: number;
  lastUsed: Date;
  sessionId: string | null;
}

// Store for key usage tracking
const keyUsageMap = new Map<string, KeyUsage>();

// Session to key mapping for consistent key assignment per session
const sessionKeyMap = new Map<string, string>();

// Get all configured Gemini API keys
function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  
  // Check for numbered keys (GEMINI_API_KEY_1 through GEMINI_API_KEY_5)
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      keys.push(key.trim());
    }
  }
  
  // Fallback to single key if no numbered keys are configured
  if (keys.length === 0) {
    const singleKey = process.env.GEMINI_AVATAR_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (singleKey && singleKey.trim()) {
      keys.push(singleKey.trim());
    }
  }
  
  return keys;
}

// Initialize key usage tracking
function initializeKeys(): void {
  const keys = getGeminiApiKeys();
  
  for (const key of keys) {
    if (!keyUsageMap.has(key)) {
      keyUsageMap.set(key, {
        key,
        usageCount: 0,
        lastUsed: new Date(0),
        sessionId: null,
      });
    }
  }
}

// Get the key index for a session (returns index 0-4)
export function getGeminiKeyForSession(sessionId: string): number {
  initializeKeys();
  
  const keys = getGeminiApiKeys();
  
  if (keys.length === 0) {
    console.error("[Gemini Keys] No API keys configured");
    return 0;
  }
  
  // If session already has an assigned key, return its index
  if (sessionKeyMap.has(sessionId)) {
    const assignedKey = sessionKeyMap.get(sessionId)!;
    const index = keys.indexOf(assignedKey);
    if (index !== -1) {
      return index;
    }
    sessionKeyMap.delete(sessionId);
  }
  
  // Find the key with the lowest active session count
  let selectedKey: string | null = null;
  let minUsage = Infinity;
  
  for (const key of keys) {
    const usage = keyUsageMap.get(key);
    if (usage && usage.usageCount < minUsage) {
      minUsage = usage.usageCount;
      selectedKey = key;
    }
  }
  
  if (!selectedKey) {
    selectedKey = keys[0];
  }
  
  // Increment usage count (track active sessions)
  const usage = keyUsageMap.get(selectedKey);
  if (usage) {
    usage.usageCount++;
    usage.lastUsed = new Date();
    usage.sessionId = sessionId;
    sessionKeyMap.set(sessionId, selectedKey);
  }
  
  const keyIndex = keys.indexOf(selectedKey);
  console.log(`[Gemini Keys] Assigned key index ${keyIndex} to session ${sessionId}`);
  
  return keyIndex;
}

// Release a key when session ends and decrement usage count
export function releaseGeminiKeyForSession(sessionId: string): void {
  if (sessionKeyMap.has(sessionId)) {
    const key = sessionKeyMap.get(sessionId)!;
    const usage = keyUsageMap.get(key);
    if (usage) {
      // Decrement usage count when session ends
      usage.usageCount = Math.max(0, usage.usageCount - 1);
      if (usage.sessionId === sessionId) {
        usage.sessionId = null;
      }
    }
    sessionKeyMap.delete(sessionId);
    console.log(`[Gemini Keys] Released key for session ${sessionId}`);
  }
}

// Get the next available API key using round-robin with session affinity
export function getNextGeminiApiKey(sessionId?: string): string | null {
  initializeKeys();
  
  const keys = getGeminiApiKeys();
  
  if (keys.length === 0) {
    console.error("[Gemini Keys] No API keys configured");
    return null;
  }
  
  // If session already has an assigned key, return it (session affinity)
  if (sessionId && sessionKeyMap.has(sessionId)) {
    const assignedKey = sessionKeyMap.get(sessionId)!;
    // Verify the key is still valid
    if (keys.includes(assignedKey)) {
      return assignedKey;
    }
    // Key no longer valid, remove from session map
    sessionKeyMap.delete(sessionId);
  }
  
  // Find the key with the lowest usage count (round-robin with load balancing)
  let selectedKey: string | null = null;
  let minUsage = Infinity;
  
  for (const key of keys) {
    const usage = keyUsageMap.get(key);
    if (usage && usage.usageCount < minUsage) {
      minUsage = usage.usageCount;
      selectedKey = key;
    }
  }
  
  if (!selectedKey) {
    selectedKey = keys[0];
  }
  
  // Update usage tracking
  const usage = keyUsageMap.get(selectedKey);
  if (usage) {
    usage.usageCount++;
    usage.lastUsed = new Date();
    if (sessionId) {
      usage.sessionId = sessionId;
      sessionKeyMap.set(sessionId, selectedKey);
    }
  }
  
  console.log(`[Gemini Keys] Assigned key ${maskApiKey(selectedKey)} to session ${sessionId || "unknown"}`);
  
  return selectedKey;
}

// Release a key when session ends
export function releaseGeminiApiKey(sessionId: string): void {
  if (sessionKeyMap.has(sessionId)) {
    const key = sessionKeyMap.get(sessionId)!;
    const usage = keyUsageMap.get(key);
    if (usage && usage.sessionId === sessionId) {
      usage.sessionId = null;
    }
    sessionKeyMap.delete(sessionId);
    console.log(`[Gemini Keys] Released key for session ${sessionId}`);
  }
}

// Get status of all keys (for admin/monitoring)
export function getKeyStatus(): { total: number; configured: number; active: number } {
  initializeKeys();
  
  const keys = getGeminiApiKeys();
  const activeCount = Array.from(keyUsageMap.values()).filter(u => u.sessionId !== null).length;
  
  return {
    total: 5, // Maximum possible keys
    configured: keys.length,
    active: activeCount,
  };
}

// Reset usage counts (useful for periodic rebalancing)
export function resetKeyUsage(): void {
  for (const usage of keyUsageMap.values()) {
    usage.usageCount = 0;
  }
  console.log("[Gemini Keys] Reset all usage counts");
}

// Mask API key for logging (show only first 4 and last 4 characters)
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return "****";
  }
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

// Check if Gemini API keys are configured
export function isGeminiConfigured(): boolean {
  return getGeminiApiKeys().length > 0;
}
