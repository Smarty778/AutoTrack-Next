
'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  KeyRound,
  LoaderCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setErrorMessage('');

    const identifier = username.trim();

    if (!identifier) {
      setErrorMessage('Please enter your User ID or Username');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      // login() returns a Promise, so resolve it before reading its properties.
      const res = await login(identifier, password);

      if (!res.success) {
        setErrorMessage(res.message || 'Invalid User ID or Password');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      setErrorMessage('Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Lockup */}
        <div className="flex justify-center mb-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
            <span className="font-extrabold text-lg sm:text-xl tracking-wider">
              AT
            </span>
          </div>
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          AutoTrack Manager
        </h2>

        <p className="mt-1 text-center text-xs text-slate-500">
          Vehicle GPS Fleet &amp; Sales CRM Portal &middot; Secure Sign In
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-8 shadow-xl rounded-2xl border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Username / User ID */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                User ID / Username
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>

                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter User ID (e.g. admin)"
                  disabled={isLoading}
                  className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 font-medium min-h-[42px] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter account password"
                  disabled={isLoading}
                  className="block w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 font-medium min-h-[42px] disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 min-h-[42px] min-w-[36px] justify-center cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password}
                className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registered User Accounts Directory */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Registered Accounts in Portal:</span>
            </div>

            <p className="text-[11px] text-slate-500 mb-2.5">
              Select a user to populate their username, then enter the password:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setUsername(u.username);
                    setPassword('');
                    setErrorMessage('');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 transition-colors cursor-pointer min-h-[32px] disabled:opacity-50 ${
                    username === u.username
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={`Click to populate username "${u.username}"`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      u.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}
                  />

                  <span className="font-semibold truncate max-w-[90px]">
                    {u.name.split(' ')[0]}
                  </span>

                  <span className="font-mono text-[10px] opacity-75">
                    (@{u.username})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500 px-2">
          Direct in-portal user switching is disabled. Each user must authenticate
          with their User ID and password.
        </p>
      </div>
    </div>
  );
};