// Session Management Service
// Handles multiple active sessions, device tracking, and session termination

import { generateId } from './db';

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  device_info: string; // Browser and OS info
  ip_address?: string;
  created_at: string;
  last_activity_at: string;
  is_active: boolean;
}

// Store sessions in memory (persisted via localStorage for offline-first)
const SESSIONS_STORAGE_KEY = 'pos_user_sessions';

// Get all active sessions for a user
export function getActiveSessionsForUser(userId: string): UserSession[] {
  const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const allSessions = JSON.parse(stored) as UserSession[];
    return allSessions.filter(s => s.user_id === userId && s.is_active);
  } catch {
    return [];
  }
}

// Create a new session
export function createSession(
  userId: string,
  token: string,
  deviceInfo: string,
  ipAddress?: string
): UserSession {
  const now = new Date().toISOString();
  
  const session: UserSession = {
    id: generateId(),
    user_id: userId,
    token,
    device_info: deviceInfo,
    ip_address: ipAddress,
    created_at: now,
    last_activity_at: now,
    is_active: true,
  };

  // Save session
  const allSessions = getAllSessions();
  allSessions.push(session);
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));

  return session;
}

// Update session last activity
export function updateSessionActivity(sessionId: string): void {
  const sessions = getAllSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (session) {
    session.last_activity_at = new Date().toISOString();
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }
}

// Terminate a specific session
export function terminateSession(sessionId: string): void {
  const sessions = getAllSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (session) {
    session.is_active = false;
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }
}

// Terminate all sessions for a user (logout from all devices)
export function terminateAllUserSessions(userId: string): void {
  const sessions = getAllSessions();
  sessions.forEach(session => {
    if (session.user_id === userId) {
      session.is_active = false;
    }
  });
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

// Get all sessions (active and inactive)
function getAllSessions(): UserSession[] {
  const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored) as UserSession[];
  } catch {
    return [];
  }
}

// Format device info for display
export function formatDeviceInfo(deviceInfo: string): { browser: string; os: string } {
  const [browser, , os] = deviceInfo.split(' ');
  return { browser, os };
}

// Calculate session duration
export function getSessionDuration(session: UserSession): string {
  const created = new Date(session.created_at);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Get last activity duration (how long ago)
export function getLastActivityDuration(session: UserSession): string {
  const lastActivity = new Date(session.last_activity_at);
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}

// Check if session is still valid (not expired and is active)
export function isSessionValid(sessionId: string, maxInactivityHours: number = 24): boolean {
  const sessions = getAllSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session || !session.is_active) {
    return false;
  }

  // Check inactivity timeout
  const lastActivity = new Date(session.last_activity_at);
  const now = new Date();
  const inactivityMs = now.getTime() - lastActivity.getTime();
  const maxInactivityMs = maxInactivityHours * 60 * 60 * 1000;

  return inactivityMs < maxInactivityMs;
}

// Clean up old inactive sessions (older than specified days)
export function cleanupInactiveSessions(daysOld: number = 30): void {
  const sessions = getAllSessions();
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysOld * 24 * 60 * 60 * 1000);

  const activeSessions = sessions.filter(s => {
    // Keep active sessions
    if (s.is_active) return true;
    
    // Remove inactive sessions older than cutoff
    const createdDate = new Date(s.created_at);
    return createdDate > cutoffDate;
  });

  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(activeSessions));
}
