// User Profile Page - Account and security settings

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Lock,
  AlertCircle,
  CheckCircle,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';
import { changePassword } from '../lib/auth';
import { validatePasswordStrength, getPasswordStrengthLevel } from '../lib/password-reset';
import { getActiveSessionsForUser, terminateSession, formatDeviceInfo, getLastActivityDuration } from '../lib/session-management';
import type { User as UserType } from '../lib/security-types';

export function ProfilePage() {
  const { user: currentUser, logout, isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserType | null>(currentUser || null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'sessions'>('profile');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      return;
    }
    setUser(currentUser);
    
    // Load active sessions
    const userSessions = getActiveSessionsForUser(currentUser.id);
    setSessions(userSessions);
  }, [currentUser, isAuthenticated]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      setPasswordError(validation.errors[0]);
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword(user!.id, currentPassword, newPassword);
      if (result.success) {
        setPasswordSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Clear success message after 5 seconds
        setTimeout(() => setPasswordSuccess(''), 5000);
      } else {
        setPasswordError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutSession = (sessionId: string) => {
    terminateSession(sessionId);
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
          <p className="text-slate-400">Manage your profile and security settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'profile'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <User size={20} />
              Profile
            </div>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'password'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock size={20} />
              Password
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'sessions'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <LogOut size={20} />
              Sessions
            </div>
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
                  <p className="text-slate-400">{user.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Email</p>
                  <p className="text-white font-medium mt-1">{user.email}</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Role</p>
                  <p className="text-white font-medium mt-1">
                    {user.role_code.charAt(0).toUpperCase() + user.role_code.slice(1)}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Member Since</p>
                  <p className="text-white font-medium mt-1">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Last Login</p>
                  <p className="text-white font-medium mt-1">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <form onSubmit={handleChangePassword} className="space-y-6">
              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                  <AlertCircle size={20} />
                  <p className="text-sm">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300">
                  <CheckCircle size={20} />
                  <p className="text-sm">{passwordSuccess}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2 text-xs">
                    <p className="text-slate-400">
                      Password strength:{' '}
                      <span
                        className={
                          getPasswordStrengthLevel(newPassword) === 'weak'
                            ? 'text-red-400'
                            : getPasswordStrengthLevel(newPassword) === 'fair'
                              ? 'text-yellow-400'
                              : getPasswordStrengthLevel(newPassword) === 'good'
                                ? 'text-blue-400'
                                : 'text-emerald-400'
                        }
                      >
                        {getPasswordStrengthLevel(newPassword).charAt(0).toUpperCase() +
                          getPasswordStrengthLevel(newPassword).slice(1)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
                <p className="text-slate-400">No active sessions</p>
              </div>
            ) : (
              sessions.map(session => {
                const { browser, os } = formatDeviceInfo(session.device_info);
                return (
                  <div key={session.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {browser} on {os}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                          Signed in {new Date(session.created_at).toLocaleDateString()} at{' '}
                          {new Date(session.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-slate-500 text-xs mt-2">
                          Last active: {getLastActivityDuration(session)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLogoutSession(session.id)}
                        className="px-3 py-2 text-red-400 hover:text-red-300 transition text-sm"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
