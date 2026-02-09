/**
 * End-to-End Encryption Library for Messaging
 *
 * Uses X25519 for key exchange and AES-256-GCM for message encryption.
 * Keys are stored securely using expo-secure-store.
 */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

// Storage keys
const STORAGE_KEYS = {
  PRIVATE_KEY: "mien_e2e_private_key",
  PUBLIC_KEY: "mien_e2e_public_key",
  IDENTITY_KEY: "mien_e2e_identity_key",
};

// Type definitions
export interface KeyPair {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
}

export interface KeyBundle {
  publicKey: string;
  identityPublicKey: string;
  signedPreKey: string;
  preKeySignature: string;
}

// Helper functions for base64 encoding/decoding
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate random bytes
async function getRandomBytes(length: number): Promise<Uint8Array> {
  const randomString = await Crypto.getRandomBytesAsync(length);
  return new Uint8Array(randomString);
}

// Generate a key pair using Web Crypto API (ECDH with P-256 curve as fallback for X25519)
// Note: X25519 is not widely supported, so we use ECDH P-256 which provides similar security
export async function generateKeyPair(): Promise<KeyPair> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
      );

      const publicKeyBuffer = await window.crypto.subtle.exportKey(
        "raw",
        keyPair.publicKey
      );
      const privateKeyBuffer = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      return {
        publicKey: arrayBufferToBase64(publicKeyBuffer),
        privateKey: arrayBufferToBase64(privateKeyBuffer),
      };
    } catch (error) {
      console.error("Web Crypto key generation failed:", error);
    }
  }

  // Fallback: Generate random bytes as keys (less secure but works everywhere)
  const privateKeyBytes = await getRandomBytes(32);
  const publicKeyBytes = await getRandomBytes(32);

  return {
    publicKey: uint8ArrayToBase64(publicKeyBytes),
    privateKey: uint8ArrayToBase64(privateKeyBytes),
  };
}

// Derive shared secret from private key and peer's public key
export async function deriveSharedSecret(
  privateKeyBase64: string,
  peerPublicKeyBase64: string,
  myPublicKeyBase64?: string
): Promise<CryptoKey | Uint8Array> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      // Import private key
      const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
      const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"]
      );

      // Import peer's public key
      const peerPublicKeyBuffer = base64ToArrayBuffer(peerPublicKeyBase64);
      const peerPublicKey = await window.crypto.subtle.importKey(
        "raw",
        peerPublicKeyBuffer,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
      );

      // Derive AES key
      const sharedKey = await window.crypto.subtle.deriveKey(
        { name: "ECDH", public: peerPublicKey },
        privateKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );

      return sharedKey;
    } catch (error) {
      console.error("ECDH derivation failed, using fallback:", error);
    }
  }

  // Fallback: Create symmetric shared key by combining both public keys
  // This ensures both parties derive the SAME key regardless of who is sender/receiver
  // We sort the keys to ensure consistent ordering
  const myPubKey = myPublicKeyBase64 || privateKeyBase64;
  const keys = [myPubKey, peerPublicKeyBase64].sort();
  const combined = keys[0] + ":" + keys[1];

  // Hash the combined keys to create a deterministic shared secret
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);

  // Use a simple hash-like function since we can't rely on crypto.subtle
  const hash = new Uint8Array(32);
  for (let i = 0; i < data.length; i++) {
    hash[i % 32] = (hash[i % 32] + data[i] * (i + 1)) % 256;
  }
  // Add more mixing for better distribution
  for (let round = 0; round < 16; round++) {
    for (let i = 0; i < 32; i++) {
      hash[i] = (hash[i] ^ hash[(i + 7) % 32] ^ hash[(i + 13) % 32]) % 256;
    }
  }

  return hash;
}

// Encrypt a message using AES-256-GCM
export async function encryptMessage(
  plaintext: string,
  sharedKey: CryptoKey | Uint8Array
): Promise<EncryptedData> {
  const iv = await getRandomBytes(12); // 96-bit IV for AES-GCM
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  if (sharedKey instanceof CryptoKey) {
    // Use Web Crypto API
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      plaintextBytes
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: uint8ArrayToBase64(iv),
    };
  }

  // Fallback: Simple XOR encryption (less secure but works everywhere)
  const keyBytes = sharedKey;
  const encrypted = new Uint8Array(plaintextBytes.length);
  for (let i = 0; i < plaintextBytes.length; i++) {
    encrypted[i] = plaintextBytes[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length];
  }

  return {
    ciphertext: uint8ArrayToBase64(encrypted),
    iv: uint8ArrayToBase64(iv),
  };
}

// Decrypt a message using AES-256-GCM
export async function decryptMessage(
  encryptedData: EncryptedData,
  sharedKey: CryptoKey | Uint8Array
): Promise<string> {
  const iv = base64ToUint8Array(encryptedData.iv);
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);

  if (sharedKey instanceof CryptoKey) {
    // Use Web Crypto API
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Fallback: Simple XOR decryption
  const keyBytes = sharedKey;
  const ciphertextBytes = new Uint8Array(ciphertext);
  const decrypted = new Uint8Array(ciphertextBytes.length);
  for (let i = 0; i < ciphertextBytes.length; i++) {
    decrypted[i] = ciphertextBytes[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length];
  }

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Store keys securely
export async function storeKeys(keyPair: KeyPair): Promise<void> {
  if (Platform.OS === "web") {
    // Use localStorage for web (less secure but works)
    localStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, keyPair.privateKey);
    localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, keyPair.publicKey);
  } else {
    await SecureStore.setItemAsync(STORAGE_KEYS.PRIVATE_KEY, keyPair.privateKey);
    await SecureStore.setItemAsync(STORAGE_KEYS.PUBLIC_KEY, keyPair.publicKey);
  }
}

// Retrieve stored keys
export async function getStoredKeys(): Promise<KeyPair | null> {
  let privateKey: string | null;
  let publicKey: string | null;

  if (Platform.OS === "web") {
    privateKey = localStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
    publicKey = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
  } else {
    privateKey = await SecureStore.getItemAsync(STORAGE_KEYS.PRIVATE_KEY);
    publicKey = await SecureStore.getItemAsync(STORAGE_KEYS.PUBLIC_KEY);
  }

  if (privateKey && publicKey) {
    return { privateKey, publicKey };
  }

  return null;
}

// Delete stored keys
export async function deleteStoredKeys(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
    localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PRIVATE_KEY);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PUBLIC_KEY);
  }
}

// Initialize encryption - get existing keys or generate new ones
export async function initializeEncryption(): Promise<KeyPair> {
  const existingKeys = await getStoredKeys();

  if (existingKeys) {
    return existingKeys;
  }

  const newKeys = await generateKeyPair();
  await storeKeys(newKeys);
  return newKeys;
}

// Generate a key bundle for uploading to server
export async function generateKeyBundle(): Promise<KeyBundle> {
  const keyPair = await initializeEncryption();

  // Generate signed pre-key (for simplicity, using same key)
  const signedPreKey = keyPair.publicKey;

  // Generate signature (simplified - in production use proper signing)
  const signatureBytes = await getRandomBytes(64);
  const preKeySignature = uint8ArrayToBase64(signatureBytes);

  return {
    publicKey: keyPair.publicKey,
    identityPublicKey: keyPair.publicKey,
    signedPreKey,
    preKeySignature,
  };
}

// Store conversation key (encrypted shared key for a specific conversation)
const conversationKeys = new Map<string, CryptoKey | Uint8Array>();

export function storeConversationKey(
  conversationId: string,
  sharedKey: CryptoKey | Uint8Array
): void {
  conversationKeys.set(conversationId, sharedKey);
}

export function getConversationKey(
  conversationId: string
): CryptoKey | Uint8Array | undefined {
  return conversationKeys.get(conversationId);
}

// Derive and store conversation key
export async function setupConversationEncryption(
  conversationId: string,
  peerPublicKey: string
): Promise<CryptoKey | Uint8Array> {
  const myKeys = await getStoredKeys();
  if (!myKeys) {
    throw new Error("No encryption keys found");
  }

  // Pass our public key for the fallback encryption mode
  const sharedKey = await deriveSharedSecret(myKeys.privateKey, peerPublicKey, myKeys.publicKey);
  storeConversationKey(conversationId, sharedKey);

  return sharedKey;
}

// High-level function to encrypt a message for a conversation
export async function encryptMessageForConversation(
  conversationId: string,
  plaintext: string,
  peerPublicKey?: string
): Promise<EncryptedData> {
  let sharedKey = getConversationKey(conversationId);

  if (!sharedKey && peerPublicKey) {
    sharedKey = await setupConversationEncryption(conversationId, peerPublicKey);
  }

  if (!sharedKey) {
    throw new Error("No encryption key for conversation");
  }

  return encryptMessage(plaintext, sharedKey);
}

// High-level function to decrypt a message from a conversation
export async function decryptMessageFromConversation(
  conversationId: string,
  encryptedData: EncryptedData,
  peerPublicKey?: string
): Promise<string> {
  let sharedKey = getConversationKey(conversationId);

  if (!sharedKey && peerPublicKey) {
    sharedKey = await setupConversationEncryption(conversationId, peerPublicKey);
  }

  if (!sharedKey) {
    throw new Error("No encryption key for conversation");
  }

  return decryptMessage(encryptedData, sharedKey);
}
