
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isHydrated, isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const identifier = username.trim();

    if (!identifier || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(identifier, password);

      if (result.success) {
        router.replace('/dashboard');
        router.refresh();
      } else {
        setError(result.message || 'Invalid username/email or password.');
      }
    } catch (err) {
      console.error('Login page error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated || isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-400">
            {isAuthenticated ? 'Opening dashboard...' : 'Loading AutoTrack...'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/40 backdrop-blur-xl md:grid-cols-2">
        {/* Branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800 bg-slate-900 p-10 md:flex lg:p-12">
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-cyan-400/10" />
          <div className="absolute -right-10 top-30 h-44 w-44 rounded-full border border-cyan-400/10" />

          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Activity className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  Auto<span className="text-cyan-400">Track</span>
                </h1>
                <p className="text-xs tracking-[0.2em] text-slate-500">
                  FLEET MANAGEMENT
                </p>
              </div>
            </div>

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-medium text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              Secure access portal
            </div>

            <h2 className="max-w-sm text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
              Manage your fleet.
              <span className="mt-2 block text-cyan-400">
                Stay in control.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
              Access your vehicle records, tracking operations, team
              assignments, and fleet management tools from one secure portal.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              Protected account access
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Activity className="h-5 w-5 text-cyan-400" />
              Centralized fleet operations
            </div>
            <p className="pt-6 text-xs text-slate-600">
              © {new Date().getFullYear()} AutoTrack. All rights reserved.
            </p>
          </div>
        </section>

        {/* Login form */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black">
                  Auto<span className="text-cyan-400">Track</span>
                </h1>
                <p className="text-xs text-slate-500">Fleet Management</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                Welcome back
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Sign in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Enter your registered username or email and password to
                continue.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Username or email
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setError('');
                    }}
                    placeholder="Enter username or email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError('');
                    }}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs text-slate-600">NEW TO AUTOTRACK?</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/60 hover:text-white"
            >
              <Mail className="h-4 w-4" />
              Create an account
            </Link>

            <p className="mt-8 text-center text-xs leading-5 text-slate-600">
              Authorized users only. Your account permissions determine access
              to CRM features and records.
            </p>

            <p className="mt-5 text-center text-xs text-slate-600 md:hidden">
              © {new Date().getFullYear()} AutoTrack
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}