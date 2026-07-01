import CryptoJS from 'crypto-js';

const PASSWORD_SALT = 'jimwas_pos_salt_2024';
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const PASSWORD_RESET_TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes
const PASSWORD_HISTORY_LIMIT = 5;

// ============ PASSWORD STRENGTH ============

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0: weak, 4: very strong
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  feedback: string[];
  suggestions: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length < MIN_PASSWORD_LENGTH) {
    feedback.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  } else if (password.length >= MIN_PASSWORD_LENGTH && password.length < 12) {
    score += 1;
  } else if (password.length >= 12) {
    score += 2;
  }

  // Uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add uppercase letters for better security');
  }

  // Lowercase letters
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add lowercase letters for better security');
  }

  // Numbers
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add numbers for better security');
  }

  // Special characters
  if (/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add special characters for better security');
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
  }

  // Common patterns
  if (/^(password|123456|qwerty|abc123)/i.test(password)) {
    feedback.push('Avoid common passwords');
  }

  // Calculate final score
  const finalScore = Math.min(Math.max(0, Math.ceil(score / 2.5)), 4) as 0 | 1 | 2 | 3 | 4;

  const labels: { [key: number]: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' } = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  };

  return {
    score: finalScore,
    label: labels[finalScore],
    feedback,
    suggestions,
  };
}

// ============ PASSWORD HASHING ============

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + PASSWORD_SALT).toString();
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ============ PASSWORD RESET TOKENS ============

export function generateResetToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
}

export function getResetTokenExpiry(): string {
  return new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY).toISOString();
}

export function isResetTokenExpired(expiryTime: string): boolean {
  return new Date(expiryTime) < new Date();
}

// ============ PASSWORD POLICY ============

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays?: number;
  historyLimit: number;
  accountLockoutThreshold: number;
  accountLockoutDurationMinutes: number;
  passwordResetTokenExpiryMinutes: number;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: MIN_PASSWORD_LENGTH,
  maxLength: MAX_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  expirationDays: 90,
  historyLimit: PASSWORD_HISTORY_LIMIT,
  accountLockoutThreshold: 5,
  accountLockoutDurationMinutes: 30,
  passwordResetTokenExpiryMinutes: 30,
};

export function validatePasswordPolicy(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============ PASSWORD HISTORY ============

export function checkPasswordHistory(newPassword: string, passwordHistory: string[] = []): boolean {
  const newPasswordHash = hashPassword(newPassword);
  return !passwordHistory.includes(newPasswordHash);
}

export function addToPasswordHistory(password: string, currentHistory: string[] = [], limit: number = PASSWORD_HISTORY_LIMIT): string[] {
  const newHistory = [hashPassword(password), ...currentHistory].slice(0, limit);
  return newHistory;
}

// ============ SECURITY QUESTIONS ============

export const DEFAULT_SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was your favorite childhood game?",
  "What is the name of your best friend?",
  "What high school did you attend?",
  "What is your favorite book?",
  "In what city did you grow up?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
];

export function hashSecurityAnswer(answer: string): string {
  // Normalize answer: lowercase, trim, remove extra spaces
  const normalized = answer.toLowerCase().trim().replace(/\s+/g, ' ');
  return CryptoJS.SHA256(normalized + PASSWORD_SALT).toString();
}

export function verifySecurityAnswer(answer: string, answerHash: string): boolean {
  return hashSecurityAnswer(answer) === answerHash;
}
