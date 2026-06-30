'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { sha256 } from '../lib/hash';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const hasError = searchParams.get('error') === '1';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const hash = await sha256(password);

    // Set cookie for 30 days. Middleware will compare this hash against SITE_PASSWORD.
    document.cookie = `${'site-auth'}=${hash}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

    // Navigate back to the originally requested page
    window.location.href = redirect;
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        autoFocus
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderRadius: '0.75rem',
          border: hasError ? '1px solid #ef4444' : '1px solid rgba(253, 186, 116, 0.35)',
          background: 'rgba(42, 24, 11, 0.6)',
          color: '#fff7ed',
          fontSize: '1rem',
          outline: 'none'
        }}
      />
      {hasError && (
        <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          密码错误，请重试。
        </p>
      )}
      <button type="submit" className="btn btn-know" style={{ width: '100%' }}>
        进入
      </button>
    </form>
  );
}
