// Password Reset Management Service
// Handles password reset token generation, validation, and password reset flow

import { generateId } from './db';

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string; // Hash of the token for security
  plain_token?: string; // Only used temporarily for display/sending
  created_at: string;
  expires_at: string;
  used_at?: string;
  is_used: boolean;
}

// Password complexity validation rules
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

// Store password reset tokens in memory (persisted via IndexedDB in auth.ts)
const PASSWORD_RESET_TOKENS_KEY = 'pos_password_reset_tokens';
const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 60;

// Get all reset tokens from storage
function getResetTokens(): PasswordResetToken[] {
  const stored = localStorage.getItem(PASSWORD_RESET_TOKENS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save reset tokens to storage
function saveResetTokens(tokens: PasswordResetToken[]): void {
  localStorage.setItem(PASSWORD_RESET_TOKENS_KEY, JSON.stringify(tokens));
}

// Hash token for secure storage
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token + 'jimwas_reset_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a random reset token
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create a new password reset token
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Revoke any existing active tokens for this user
  const tokens = getResetTokens();
  const userTokens = tokens.filter(t => t.user_id === userId && !t.is_used);
  
  // Remove old tokens for this user
  const filteredTokens = tokens.filter(t => !(t.user_id === userId && !t.is_used));
  
  // Generate new token
  const plainToken = generateResetToken();
  const tokenHash = await hashToken(plainToken);
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60000);
  
  const resetToken: PasswordResetToken = {
    id: generateId(),
    user_id: userId,
    token_hash: tokenHash,
    plain_token: plainToken, // Only returned to sender
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    is_used: false,
  };
  
  // Save updated tokens
  saveResetTokens([...filteredTokens, resetToken]);
  
  return plainToken; // Return plain token for display
}

// Validate and retrieve a password reset token
export async function validateResetToken(token: string): Promise<PasswordResetToken | null> {
  const tokenHash = await hashToken(token);
  const tokens = getResetTokens();
  
  const resetToken = tokens.find(t => t.token_hash === tokenHash);
  
  if (!resetToken) {
    return null;
  }
  
  // Check if token is already used
  if (resetToken.is_used) {
    return null;
  }
  
  // Check if token has expired
  const expiresAt = new Date(resetToken.expires_at);
  if (expiresAt < new Date()) {
    return null;
  }
  
  return resetToken;
}

// Mark token as used
export async function markTokenAsUsed(tokenId: string): Promise<void> {
  const tokens = getResetTokens();
  const token = tokens.find(t => t.id === tokenId);
  
  if (token) {
    token.is_used = true;
    token.used_at = new Date().toISOString();
    saveResetTokens(tokens);
  }
}

// Validate password strength
export function validatePasswordStrength(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Clean up expired tokens
export function cleanupExpiredTokens(): void {
  const tokens = getResetTokens();
  const now = new Date();
  
  const activeTokens = tokens.filter(t => {
    const expiresAt = new Date(t.expires_at);
    // Keep used tokens for audit trail
    if (t.is_used) return true;
    // Keep tokens that haven't expired
    if (expiresAt > now) return true;
    return false;
  });
  
  saveResetTokens(activeTokens);
}

// Get password strength indicator for UI
export function getPasswordStrengthLevel(password: string): 'weak' | 'fair' | 'good' | 'strong' {
  let strength = 0;
  
  // Length
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // Character diversity
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
  
  if (strength <= 2) return 'weak';
  if (strength <= 3) return 'fair';
  if (strength <= 4) return 'good';
  return 'strong';
}
