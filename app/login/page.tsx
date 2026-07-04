import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from './LoginForm';
import Logo from '../components/Logo';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Already signed in → bounce to the app
  if (user) {
    redirect('/');
  }

  return (
    <main className="w-full max-w-[420px] min-h-[90vh] text-center flex flex-col">
      <section className="flex-1 flex flex-col min-h-screen justify-center">
        <div className="glass-card w-full max-w-[360px] mx-auto text-left p-5">
          <div className="mb-6 flex flex-col items-center">
            <Logo size={64} className="mb-3" />
            <h2 className="text-xl text-white mb-1 font-display"><span className="emoji">🔒</span> Sprout · 单词农场</h2>
            <p className="text-sm text-white/65">请登录继续</p>
          </div>

          <Suspense fallback={<p className="text-center text-white/70">加载中...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
