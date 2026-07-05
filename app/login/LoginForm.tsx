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
  const redirect = searchParams.get('redirect') || '/';
  const hasError = searchParams.get('error') === '1';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setSubmitting(false);

    if (signInError) {
      setError('邮箱或密码错误，请重试。');
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  const inputClass = `w-full mb-4 px-4 py-3 rounded-lg bg-black/10 backdrop-blur-md text-black text-base outline-none transition-all duration-200 placeholder:text-black/45 focus:bg-black/15 focus:shadow-[0_0_0_2px_rgba(0,0,0,0.15)] ${
    hasError ? 'shadow-[0_0_0_2px_rgba(248,113,113,0.5)]' : ''
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
        {submitting ? '进入中...' : '进入'}
      </Button>
    </form>
  );
}
