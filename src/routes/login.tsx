// Login Page - Authentication form

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { requestPasswordReset, resetPasswordWithToken } from '../lib/auth';
import { validatePasswordStrength, getPasswordStrengthLevel } from '../lib/password-reset';

export function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password reset states
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'token' | 'password'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetError, setResetError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
        // If account is locked, show password reset option
        if (result.error?.includes('Account locked')) {
          setError(`${result.error} - You can reset your password to unlock your account.`);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(resetEmail);
      if (result.success && result.resetToken) {
        setResetToken(result.resetToken);
        setResetStep('token');
      } else {
        setResetError(result.error || 'Failed to request reset');
      }
    } catch (err) {
      setResetError('An error occurred while requesting password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      setResetError(validation.errors[0]);
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordWithToken(resetToken, newPassword);
      if (result.success) {
        setResetSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResetError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setResetError('An error occurred while resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCancel = () => {
    setShowResetFlow(false);
    setResetStep('email');
    setResetEmail('');
    setResetToken('');
    setResetError('');
    setNewPassword('');
    setConfirmPassword('');
    setResetSuccess(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show password reset flow
  if (showResetFlow) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={handleResetCancel}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back to Login
          </button>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Reset Password</h1>
            <p className="text-slate-400 mt-2">
              {resetStep === 'email' && 'Enter your email to request a password reset'}
              {resetStep === 'token' && 'Enter the reset token and your new password'}
              {resetStep === 'password' && 'Create your new password'}
            </p>
          </div>

          {/* Reset Form */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
            {resetSuccess ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 mx-auto">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">Password Reset Successful</h2>
                <p className="text-slate-400">You can now sign in with your new password.</p>
                <button
                  onClick={handleResetCancel}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form
                onSubmit={resetStep === 'email' ? handleRequestReset : handleResetPassword}
                className="space-y-6"
              >
                {resetError && (
                  <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                    <AlertCircle size={20} />
                    <p className="text-sm">{resetError}</p>
                  </div>
                )}

                {resetStep === 'email' && (
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Enter your email"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {resetStep === 'token' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                      <p className="text-sm text-emerald-200">
                        <span className="font-semibold">Reset Token:</span>
                      </p>
                      <p className="text-xs font-mono text-emerald-100 mt-2 break-all bg-slate-700/50 p-2 rounded">
                        {resetToken}
                      </p>
                      <p className="text-xs text-emerald-300 mt-2">
                        Copy this token to proceed with password reset.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetStep('password')}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                    >
                      Continue with Reset
                    </button>
                  </div>
                )}

                {resetStep === 'password' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="Enter new password"
                          required
                        />
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
                              {getPasswordStrengthLevel(newPassword).charAt(0).toUpperCase() + getPasswordStrengthLevel(newPassword).slice(1)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Jimwas POS</h1>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                <AlertCircle size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowResetFlow(true)}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Default Credentials Notice */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-xs text-slate-400 text-center">
              Default credentials: <span className="text-slate-300">admin</span> / <span className="text-slate-300">admin123</span>
            </p>
            <p className="text-xs text-amber-400 text-center mt-1">
              Change the default password after first login!
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Jimwas POS v2.0 - Secure Point of Sale
        </p>
      </div>
    </div>
  );
}
