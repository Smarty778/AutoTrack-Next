'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { CitySelectField } from '@/components/CitySelectField';
import { ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition';
const labelClass =
  'block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, login } = useApp();

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace('/dashboard');
  }, [isHydrated, isAuthenticated, router]);

  const update =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          phone: form.phone,
          city: form.city,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Registration failed. Please try again.');
        return;
      }

      // Account exists and the cookie is set. Sign in through the app context
      // so its state is populated, then go to the dashboard.
      const ok = await login(form.username, form.password);
      router.replace(ok ? '/dashboard' : '/login');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated) return <FullScreenLoader />;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-xl shadow-2xl p-5 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-3">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Register to access the AutoTrack fleet dashboard
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={update('name')}
              placeholder="Your full name"
              autoComplete="name"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={update('username')}
                placeholder="e.g. bilal"
                autoComplete="username"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <CitySelectField
                value={form.city}
                onChange={(city) => setForm((prev) => ({ ...prev, city }))}
                placeholder="Select city (optional)"
                className="bg-white"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              placeholder="+92 300 1234567 (optional)"
              autoComplete="tel"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={update('password')}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Repeat password"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 min-h-[44px]"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create account</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}