'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Copy, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { demoAccounts, useAuth, NEW_RESTAURANT_NAMES } from '@/contexts/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const demoCredentials = demoAccounts.map((a) => ({
  id: a.id,
  role: a.restaurant ? `${a.restaurant} Manager` : a.role,
  subtitle: a.restaurant ? `${NEW_RESTAURANT_NAMES.includes(a.restaurant) ? a.restaurant : `Samko ${a.restaurant}`} only` : a.isCentralKitchen ? 'Central Kitchen' : 'All locations',
  email: a.email,
  password: a.password,
  color: a.color,
}));

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const handleCopy = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleUseCredential = (cred: (typeof demoCredentials)[0]) => {
    setValue('email', cred.email);
    setValue('password', cred.password);
    setLoginError('');
  };

  // Backend integration point: replace with real auth API call
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError('');
    await new Promise((r) => setTimeout(r, 1000));

    const valid = demoCredentials.find(
      (c) => c.email === data.email && c.password === data.password
    );

    if (valid) {
      const account = demoAccounts.find((a) => a.id === valid.id);
      if (account) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...sessionUser } = account;
        login(sessionUser);
      }
      toast.success(`Welcome back! Signed in as ${valid.role}`);
      setTimeout(() => router.push('/'), 500);
    } else {
      setLoginError('Invalid credentials — use the demo accounts below to sign in.');
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
              >
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field pr-10"
                placeholder="Enter your password"
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
              <AlertCircle size={15} style={{ color: 'var(--primary)', marginTop: 1, shrink: 0 }} />
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
                Sign in
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
              Demo Accounts
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
                    {cred.email}
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