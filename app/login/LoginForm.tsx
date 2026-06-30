'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { sha256 } from '../lib/hash';

const primaryBtn =
  `relative w-full overflow-hidden rounded-xl px-4 py-3.5 text-base font-semibold text-farm-text transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-[0_4px_16px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-60 before:transition-opacity before:duration-250 enabled:hover:-translate-y-0.5 enabled:hover:scale-[1.02] enabled:hover:shadow-[0_8px_24px_rgba(249,115,22,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] enabled:hover:before:opacity-100 enabled:active:-translate-y-px enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.5]`;

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
        className={`w-full mb-4 px-4 py-3 rounded-xl border bg-[rgba(42,24,11,0.6)] text-farm-text text-base outline-none transition-all duration-200 placeholder:text-farm-muted/60 focus:border-orange-500/60 focus:bg-[rgba(42,24,11,0.7)] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.2)] ${
          hasError ? 'border-farm-red' : 'border-farm-muted/35'
        }`}
      />
      {hasError && (
        <p className="text-red-300 text-sm mb-3">
          密码错误，请重试。
        </p>
      )}
      <button type="submit" className={primaryBtn}>
        进入
      </button>
    </form>
  );
}
