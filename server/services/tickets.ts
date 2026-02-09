import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";
import { getMainAppBaseUrl, getAppId } from "../integration/three-tears";
import { encryptApiKey, decryptApiKey, type EncryptedData } from "../utils/encryption";

// Key pair storage keys
const PRIVATE_KEY_SETTING = "app_jwt_private_key";
const PUBLIC_KEY_SETTING = "app_jwt_public_key";
const KEY_ID_SETTING = "app_jwt_key_id";

interface KeyPair {
  privateKey: string;
  publicKey: string;
  keyId: string;
}

// Generate a new RSA key pair
async function generateKeyPair(): Promise<KeyPair> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
        },
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
          return;
        }
        const keyId = crypto.randomBytes(8).toString("hex");
        resolve({ privateKey, publicKey, keyId });
      }
    );
  });
}

// Store key pair in database (private key encrypted at rest)
async function storeKeyPair(keyPair: KeyPair): Promise<void> {
  // Encrypt the private key before storing
  const encryptedPrivateKey = encryptApiKey(keyPair.privateKey);

  const entries = [
    { key: PRIVATE_KEY_SETTING, value: JSON.stringify(encryptedPrivateKey) },
    { key: PUBLIC_KEY_SETTING, value: keyPair.publicKey },
    { key: KEY_ID_SETTING, value: keyPair.keyId },
  ];

  for (const entry of entries) {
    await db
      .insert(settings)
      .values(entry)
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: entry.value, updatedAt: new Date() },
      });
  }
}

// Get or create key pair
async function getOrCreateKeyPair(): Promise<KeyPair> {
  const results = await db
    .select()
    .from(settings)
    .where(eq(settings.key, PRIVATE_KEY_SETTING));

  if (results.length > 0 && results[0].value) {
    const [pubResult] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, PUBLIC_KEY_SETTING));
    const [kidResult] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, KEY_ID_SETTING));

    if (pubResult?.value && kidResult?.value) {
      // Decrypt private key (stored as encrypted JSON or legacy plaintext PEM)
      let privateKey: string;
      const storedValue = results[0].value;
      try {
        const parsed = JSON.parse(storedValue) as EncryptedData;
        privateKey = decryptApiKey(parsed);
      } catch {
        // Legacy: plaintext PEM stored before encryption was added
        privateKey = storedValue;
      }
      return {
        privateKey,
        publicKey: pubResult.value,
        keyId: kidResult.value,
      };
    }
  }

  // Generate new key pair
  console.log("[Tickets] Generating new JWT signing key pair...");
  const keyPair = await generateKeyPair();
  await storeKeyPair(keyPair);
  console.log("[Tickets] Key pair generated and stored with kid:", keyPair.keyId);
  return keyPair;
}

// Convert PEM public key to JWK format
function pemToJwk(pem: string, keyId: string): object {
  const key = crypto.createPublicKey(pem);
  const jwk = key.export({ format: "jwk" });
  return {
    ...jwk,
    kid: keyId,
    use: "sig",
    alg: "RS256",
  };
}

// Get JWKS for the app (public keys)
export async function getAppJwks(): Promise<{ keys: object[] }> {
  try {
    const keyPair = await getOrCreateKeyPair();
    const jwk = pemToJwk(keyPair.publicKey, keyPair.keyId);
    return { keys: [jwk] };
  } catch (error) {
    console.error("[Tickets] Failed to get JWKS:", error);
    return { keys: [] };
  }
}

// Sign a JWT for Three Tears API calls
export async function signJwtForUser(userId: string, email?: string): Promise<string> {
  const keyPair = await getOrCreateKeyPair();
  const appId = await getAppId();

  const payload: jwt.JwtPayload = {
    sub: userId,
    iss: appId || "mien-kingdom",
    aud: "three-tears",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
  };

  if (email) {
    payload.email = email;
  }

  return jwt.sign(payload, keyPair.privateKey, {
    algorithm: "RS256",
    keyid: keyPair.keyId,
  });
}

// Ticket types
export interface Ticket {
  id: string;
  subject: string;
  body?: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  message: string;
  senderType: "user" | "support" | "system";
  createdAt: string;
}

export interface TicketWithMessages extends Ticket {
  messages: TicketMessage[];
}

// Create a new ticket
export async function createTicket(
  userId: string,
  email: string,
  subject: string,
  body: string,
  category: string = "general"
): Promise<Ticket> {
  const appId = await getAppId();
  if (!appId) {
    throw new Error("App not registered with Three Tears");
  }

  const mainAppBaseUrl = await getMainAppBaseUrl();
  const token = await signJwtForUser(userId, email);

  console.log("[Tickets] Creating ticket for user:", userId, "category:", category);

  const response = await fetch(`${mainAppBaseUrl}/api/apps/${appId}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subject, body, category }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tickets] Create ticket failed:", response.status, errorText);
    throw new Error(`Failed to create ticket: ${response.status}`);
  }

  const ticket = await response.json();
  console.log("[Tickets] Ticket created:", ticket.id);
  return ticket;
}

// Get user's tickets
export async function getUserTickets(userId: string, email?: string): Promise<Ticket[]> {
  const appId = await getAppId();
  if (!appId) {
    throw new Error("App not registered with Three Tears");
  }

  const mainAppBaseUrl = await getMainAppBaseUrl();
  const token = await signJwtForUser(userId, email);

  console.log("[Tickets] Fetching tickets for user:", userId);

  const response = await fetch(`${mainAppBaseUrl}/api/apps/${appId}/tickets`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tickets] Fetch tickets failed:", response.status, errorText);
    throw new Error(`Failed to fetch tickets: ${response.status}`);
  }

  const tickets = await response.json();
  console.log("[Tickets] Fetched", tickets.length, "tickets");
  return tickets;
}

// Get ticket details with messages
export async function getTicketDetails(
  userId: string,
  ticketId: string,
  email?: string
): Promise<TicketWithMessages> {
  const appId = await getAppId();
  if (!appId) {
    throw new Error("App not registered with Three Tears");
  }

  const mainAppBaseUrl = await getMainAppBaseUrl();
  const token = await signJwtForUser(userId, email);

  console.log("[Tickets] Fetching ticket details:", ticketId);

  const response = await fetch(`${mainAppBaseUrl}/api/apps/${appId}/tickets/${ticketId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tickets] Fetch ticket details failed:", response.status, errorText);
    throw new Error(`Failed to fetch ticket details: ${response.status}`);
  }

  return response.json();
}

// Reply to a ticket
export async function replyToTicket(
  userId: string,
  ticketId: string,
  message: string,
  email?: string
): Promise<TicketMessage> {
  const appId = await getAppId();
  if (!appId) {
    throw new Error("App not registered with Three Tears");
  }

  const mainAppBaseUrl = await getMainAppBaseUrl();
  const token = await signJwtForUser(userId, email);

  console.log("[Tickets] Replying to ticket:", ticketId);

  const response = await fetch(`${mainAppBaseUrl}/api/apps/${appId}/tickets/${ticketId}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tickets] Reply failed:", response.status, errorText);
    throw new Error(`Failed to reply to ticket: ${response.status}`);
  }

  const reply = await response.json();
  console.log("[Tickets] Reply sent to ticket:", ticketId);
  return reply;
}
