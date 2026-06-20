// Cryptographic helper functions using Web Crypto API

// Generate a random salt (16 bytes)
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

// Convert Uint8Array to Hex string
export function bufToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
export function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Base64 encoding for general serialization of buffers
export function bufToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return window.btoa(binary);
}

// Base64 decoding
export function base64ToBuf(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Derive a cryptographic key from a password and salt using PBKDF2
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // key is not exportable
    ['encrypt', 'decrypt']
  );
}

// Generate a secure SHA-256 hash (e.g. for verifying secondary unlock keys like pins)
export async function sha256(text: string, saltHex: string = ''): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text + saltHex);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufToHex(new Uint8Array(hashBuffer));
}

// Encrypt plain text using AES-GCM 256-bit
export async function encryptData(plainText: string, aesKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    aesKey,
    encoder.encode(plainText)
  );

  const ivHex = bufToHex(iv);
  const cipherHex = bufToHex(new Uint8Array(cipherBuffer));
  
  // Format: "iv_hex:cipher_hex"
  return `${ivHex}:${cipherHex}`;
}

// Decrypt ciphertext using AES-GCM 256-bit and a CryptoKey
export async function decryptData(encryptedStr: string, aesKey: CryptoKey): Promise<string> {
  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const ivHex = parts[0];
    const cipherHex = parts[1];

    const iv = hexToBuf(ivHex);
    const ciphertext = hexToBuf(cipherHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data. Key might be invalid or corrupted.');
  }
}

// Generate a high-strength password
export function generateStrongPassword(length = 20, options = { uppercase: true, lowercase: true, numbers: true, symbols: true }): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charSet = '';
  let mustInclude: string[] = [];

  if (options.uppercase) {
    charSet += uppercaseChars;
    mustInclude.push(uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]);
  }
  if (options.lowercase) {
    charSet += lowercaseChars;
    mustInclude.push(lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]);
  }
  if (options.numbers) {
    charSet += numberChars;
    mustInclude.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
  }
  if (options.symbols) {
    charSet += symbolChars;
    mustInclude.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);
  }

  if (charSet === '') return '';

  const reallength = length - mustInclude.length;
  const values = new Uint32Array(reallength);
  window.crypto.getRandomValues(values);

  let result = [...mustInclude];
  for (let i = 0; i < reallength; i++) {
    result.push(charSet[values[i] % charSet.length]);
  }

  // Shuffle the result array using Fisher-Yates and cryptographic values
  const randShuffle = new Uint32Array(result.length);
  window.crypto.getRandomValues(randShuffle);
  for (let i = result.length - 1; i > 0; i--) {
    const j = randShuffle[i] % (i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result.join('');
}

// Check password strength and return score (0 to 4) and recommendations
export function checkPasswordStrength(password: string): { score: number; text: string; color: string; suggestions: string[] } {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else suggestions.push('Make password at least 8 characters long');

  if (password.length >= 14) score++;

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else suggestions.push('Include both uppercase and lowercase letters');

  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Include at least one number');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push('Include at least one special character (e.g., @, #, $, !)');

  // cap score at 4
  const finalScore = Math.min(4, password.length === 0 ? 0 : score);

  const levels = [
    { text: 'Very Weak', color: 'bg-red-500' },
    { text: 'Weak', color: 'bg-orange-500' },
    { text: 'Fair', color: 'bg-yellow-500' },
    { text: 'Strong', color: 'bg-emerald-500' },
    { text: 'Excellent', color: 'bg-blue-500' }
  ];

  return {
    score: finalScore,
    text: levels[finalScore].text,
    color: levels[finalScore].color,
    suggestions: password ? suggestions : ['Enter a password to check strength']
  };
}
