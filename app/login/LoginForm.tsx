'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '../components/ui/Button';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  // Validate the redirect target so a ?redirect=https://evil.com phishing
  // link can't whisk the user off-site after login. Only same-origin paths
  // (single leading slash, not protocol-relative "//" or "/\") are allowed.
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/\\')
      ? rawRedirect
      : '/';
  const hasError = searchParams.get('error') === '1';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setError('邮箱或密码错误，请重试。');
      setSubmitting(false);
      return;
    }

    // Keep the button in its loading state until navigation finishes —
    // resetting it here would flip the button back to "进入" (enabled) while
    // router.push/refresh is still running, which looks like nothing happened
    // and makes users click again.
    router.push(redirect);
    router.refresh();
  };

  const inputClass = `w-full mb-4 px-4 py-3 rounded-2xl bg-white border border-farm-borderSecondary text-farm-text text-base outline-none transition-all duration-200 placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20 ${
    hasError ? 'ring-2 ring-red-300' : ''
  }`;

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
        autoComplete="email"
        autoFocus
        required
        className={inputClass}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        autoComplete="current-password"
        required
        className={inputClass}
      />
      {(hasError || error) && (
        <p className="text-red-400 text-sm mb-4">
          {error || '密码错误，请重试。'}
        </p>
      )}
      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            进入中...
          </span>
        ) : '进入'}
      </Button>
    </form>
  );
}
