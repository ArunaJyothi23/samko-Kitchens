'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Copy, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { demoAccounts, useAuth } from '@/contexts/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  rememberMe: boolean;
}

const PASSWORD_STORE_KEY = 'madrasops-credentials';

async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${email.toLowerCase()}::${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readCredentialStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORD_STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeCredentialStore(store: Record<string, string>) {
  try {
    localStorage.setItem(PASSWORD_STORE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable
  }
}

const demoCredentials = demoAccounts.map((a) => ({
  id: a.id,
  role: a.role,
  subtitle: a.restaurant ? `${a.restaurant} only` : a.readOnly ? 'Both hotels · Read-only' : 'Both hotels',
  email: a.email,
  color: a.color,
}));

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');
  const [setupMode, setSetupMode] = useState<'login' | 'create' | 'reset'>('login');

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '', confirmPassword: '', rememberMe: false },
  });

  const handleCopy = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const detectMode = (email: string) => {
    const account = demoAccounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!account) {
      setSetupMode('login');
      return;
    }
    const store = readCredentialStore();
    setSetupMode(store[account.email.toLowerCase()] ? 'login' : 'create');
  };

  const handleUseCredential = (cred: (typeof demoCredentials)[0]) => {
    setValue('email', cred.email);
    setValue('password', '');
    setValue('confirmPassword', '');
    setLoginError('');
    detectMode(cred.email);
  };

  const handleForgotPassword = () => {
    const email = getValues('email').trim().toLowerCase();
    const account = demoAccounts.find((a) => a.email.toLowerCase() === email);
    if (!account) {
      setLoginError('Enter your authorised email address first, then click "Forgot password?".');
      return;
    }
    setLoginError('');
    setValue('password', '');
    setValue('confirmPassword', '');
    setSetupMode('reset');
    toast.info('Choose a new password for this account.');
  };

  // Backend integration point: replace with real auth API call. Passwords are stored only as a SHA-256 hash in this browser.
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError('');

    const emailKey = data.email.trim().toLowerCase();
    const account = demoAccounts.find((a) => a.email.toLowerCase() === emailKey);

    if (!account) {
      setLoginError('This email is not an authorised account. Contact your administrator.');
      setIsLoading(false);
      return;
    }

    const store = readCredentialStore();
    const hasPassword = !!store[emailKey];
    const mode = setupMode === 'reset' ? 'reset' : hasPassword ? 'login' : 'create';

    if (mode === 'create' || mode === 'reset') {
      if (data.password.length < 6) {
        setLoginError('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
      }
      if (data.password !== data.confirmPassword) {
        setLoginError('Passwords do not match.');
        setIsLoading(false);
        return;
      }
      store[emailKey] = await hashPassword(emailKey, data.password);
      writeCredentialStore(store);
      login(account);
      toast.success(`Password saved. Signed in as ${account.role}`);
      setTimeout(() => router.push('/'), 500);
      setIsLoading(false);
      return;
    }

    const hash = await hashPassword(emailKey, data.password);
    if (store[emailKey] === hash) {
      login(account);
      toast.success(`Welcome back! Signed in as ${account.role}`);
      setTimeout(() => router.push('/'), 500);
    } else {
      setLoginError('Incorrect password. Use "Forgot password?" to set a new one.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-md">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div
            className="rounded-lg flex items-center justify-center font-bold text-white"
            style={{ width: 36, height: 36, background: 'var(--primary)', fontSize: 16 }}
          >
            M
          </div>
          <span className="font-bold" style={{ fontSize: 18, color: 'var(--foreground)' }}>
            Samko Kitchens OPS
          </span>
        </div>

        <div className="mb-8">
          <h2 className="page-title" style={{ fontSize: 26 }}>
            Sign in to Samko Kitchens OPS
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginTop: 6 }}>
            Kitchen operations for Samko Kitchens
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="label-text block mb-1.5"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="input-field"
              placeholder="you@samkokitchens.co.uk"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                onBlur: (e) => detectMode(e.target.value),
              })}
            />
            {errors.email && (
              <p className="flex items-center gap-1 mt-1.5" style={{ fontSize: 12, color: 'var(--primary)' }}>
                <AlertCircle size={12} /> {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="label-text"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                Password
              </label>
              <span
                className="text-xs cursor-pointer"
                style={{ color: 'var(--primary)', fontSize: 12 }}
                onClick={handleForgotPassword}
                role="button"
              >
                Forgot password?
              </span>
            </div>
            {setupMode !== 'login' && (
              <p className="mb-1.5" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                {setupMode === 'create' ?'First sign-in: create a password for this account.' :'Enter a new password for this account.'}
              </p>
            )}
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field pr-10"
                placeholder={setupMode === 'login' ? 'Enter your password' : 'Create a password (min 6 characters)'}
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1 mt-1.5" style={{ fontSize: 12, color: 'var(--primary)' }}>
                <AlertCircle size={12} /> {errors.password.message}
              </p>
            )}
          </div>

          {setupMode !== 'login' && (
            <div>
              <label
                htmlFor="login-confirm-password"
                className="label-text block mb-1.5"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                Confirm password
              </label>
              <input
                id="login-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="input-field"
                placeholder="Re-enter your password"
                {...register('confirmPassword')}
              />
            </div>
          )}

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              id="login-remember"
              type="checkbox"
              className="rounded"
              style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
              {...register('rememberMe')}
            />
            <label htmlFor="login-remember" style={{ fontSize: 13, color: 'var(--muted-foreground)', cursor: 'pointer' }}>
              Remember me for 30 days
            </label>
          </div>

          {/* Error */}
          {loginError && (
            <div
              className="flex items-start gap-2 rounded-lg p-3"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <AlertCircle size={15} style={{ color: 'var(--primary)', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.4 }}>{loginError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center"
            style={{ padding: '11px 16px', fontSize: 14, opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                <LogIn size={16} />
                {setupMode === 'login' ? 'Sign in' : 'Save password & sign in'}
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div
          className="mt-8 rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
          >
            <span className="font-semibold" style={{ fontSize: 12, color: 'var(--muted-foreground)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Authorised Accounts
            </span>
            <span
              className="demo-badge"
            >
              DEMO DATA
            </span>
          </div>
          <div>
            {demoCredentials.map((cred, idx) => (
              <div
                key={cred.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted cursor-pointer"
                style={{
                  borderBottom: idx < demoCredentials.length - 1 ? '1px solid var(--border)' : 'none',
                }}
                onClick={() => handleUseCredential(cred)}
              >
                <div
                  className="shrink-0 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ width: 28, height: 28, background: cred.color, fontSize: 10 }}
                >
                  {cred.role.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold" style={{ fontSize: 12.5, color: 'var(--foreground)' }}>
                    {cred.role}
                  </div>
                  <div className="truncate" style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
                    {cred.email} · {cred.subtitle}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleCopy(cred.email, `${cred.id}-email`); }}
                    className="p-1 rounded transition-colors hover:bg-border"
                    title="Copy email"
                    aria-label={`Copy email for ${cred.role}`}
                  >
                    {copiedField === `${cred.id}-email` ? (
                      <Check size={12} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <Copy size={12} style={{ color: 'var(--muted-foreground)' }} />
                    )}
                  </button>
                  <span
                    className="rounded px-2 py-0.5 font-medium text-white text-xs"
                    style={{ background: cred.color, fontSize: 10 }}
                  >
                    Use
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          Don&apos;t have an account?{' '}
          <span className="font-semibold cursor-pointer" style={{ color: 'var(--primary)' }}>
            Contact your administrator
          </span>
        </p>
      </div>
    </div>
  );
}