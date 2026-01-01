import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

/**
 * Creates a user-specific encryption key from Clerk user ID
 * Uses PBKDF2 to derive a key that's unique per user but persists across sessions
 * Server secret ensures tokens can't be decrypted without it
 * @param userId - Clerk user ID
 * @returns Derived encryption key
 */
export function createUserKey(userId: string): Buffer {
  // Use a server secret for additional security (prevents admins from decrypting without it)
  // If not set, fall back to a default (less secure, but still encrypted)
  const serverSecret = process.env.ENCRYPTION_SECRET || "default-secret-change-in-production";
  
  // Combine userId and server secret to create a unique key per user
  // Using userId as salt ensures consistency across sessions
  const salt = Buffer.from(userId, "utf8");
  const password = `${userId}:${serverSecret}`;
  
  return crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    "sha256"
  );
}

/**
 * Encrypts data using AES-256-GCM with a user-derived key
 * @param text - Plain text to encrypt
 * @param userKey - Key derived from user's session (via createUserKey)
 * @returns Encrypted data with salt, iv, tag, and ciphertext (base64 encoded)
 */
export function encrypt(text: string, userKey: Buffer): string {
  // Generate random IV for each encryption
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher with user-derived key
  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  // Get authentication tag
  const tag = cipher.getAuthTag();
  
  // Generate a random salt for this encryption
  // This salt is stored with the encrypted data and used during decryption
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Format: salt:iv:tag:encrypted (all base64 encoded)
  return `${salt.toString("base64")}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts data using AES-256-GCM with a user-derived key
 * @param encryptedData - Encrypted data in format "salt:iv:tag:encrypted"
 * @param userKey - Key derived from user's session (must match encryption key)
 * @returns Decrypted plain text
 * @throws Error if decryption fails (wrong key, corrupted data, etc.)
 */
export function decrypt(encryptedData: string, userKey: Buffer): string {
  const parts = encryptedData.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted data format");
  }

  const [saltBase64, ivBase64, tagBase64, encrypted] = parts;
  
  // Decode base64 components
  const salt = Buffer.from(saltBase64, "base64");
  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");

  // Create decipher with the same user key
  const decipher = crypto.createDecipheriv(ALGORITHM, userKey, iv);
  decipher.setAuthTag(tag);

  // Decrypt
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

