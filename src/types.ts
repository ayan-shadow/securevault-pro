export interface VaultPassword {
  id: string;
  title: string;
  website: string;
  username: string;
  encryptedPassword: string; // encrypted string
  category: string;
  notes: string; // encrypted string
  isPinned?: boolean;
  updatedAt: number;
}

export interface VaultNote {
  id: string;
  title: string;
  encryptedContent: string; // encrypted string
  category: string;
  tags: string[];
  pinned: boolean;
  updatedAt: number;
}

export interface VaultFile {
  id: string;
  name: string;
  type: string; // MIME type
  size: number; // in bytes
  encryptedData: string; // AES-GCM encrypted base64 string of file content
  folder: string;
  uploadedAt: number;
}

export interface ActivityLog {
  id: string;
  action: string; // 'login', 'create_password', 'edit_password', 'delete_file', etc.
  details: string; // User-friendly description
  timestamp: number;
}

export interface VaultSettings {
  theme: 'dark' | 'light' | 'system' | 'amoled' | 'blue' | 'purple' | 'green' | 'red' | 'orange';
  customAccent?: string; // custom hex color picker
  customBackground?: 'ambient' | 'solid' | 'mesh' | 'sunset';
  largeTextMode?: boolean; // accessibility mode
  highContrastMode?: boolean; // accessibility mode
  reducedMotionMode?: boolean; // accessibility mode
  language: 'en' | 'es' | 'fr' | 'de';
  autoLockMinutes: number; // 1, 5, 15, 30, 0 (never)
  autoLockEnabled: boolean;
  pinLockEnabled: boolean;
  securityRecoveryEnabled: boolean;
  hidePasswordsByDefault: boolean;
  securityLevel: 'high' | 'medium' | 'low';
}

export interface VaultProfile {
  name: string;
  email: string;
  phone: string;
  avatarSeed?: string;
}

export interface AuthConfig {
  authSalt: string; // Encrypted master key wrapper derivation salt
  authHash: string; // PBKDF2 verification hash of master password
  authHint: string;
  pinEnabled: boolean;
  pinHash?: string; // Verification hash of 4/6-digit PIN
  pinSalt?: string;
  recoveryQuestion: string;
  recoveryAnswerHash: string; // Verification of recovery answer
  recoveryAnswerSalt: string;
  profile: VaultProfile;
  settings: VaultSettings;
  isConfigured: boolean;
}

export type VaultCategory = 'All' | 'Logins' | 'Social' | 'Finance' | 'Work' | 'Personal' | 'Other';
export type FileCategory = 'All' | 'Documents' | 'Images' | 'Videos' | 'Audio' | 'Other';
