import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="w-full max-w-[420px] min-h-[90vh] text-center flex flex-col">
      <section className="flex-1 flex flex-col min-h-screen justify-center">
        <div className="w-full max-w-[360px] mx-auto text-left p-5 bg-farm-card backdrop-blur-glass border border-farm-border rounded-2xl">
          <div className="mb-4 text-center">
            <h2 className="text-xl text-farm-muted mb-1">🔒 Zeno的单词农场</h2>
            <p className="text-sm text-farm-muted/80">请输入密码继续</p>
          </div>

          <Suspense fallback={<p className="text-center text-farm-muted">加载中...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
