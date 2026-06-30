import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="app">
      <section className="view" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div className="settings-section" style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
          <div className="settings-header" style={{ textAlign: 'center' }}>
            <h2>🔒 Zeno的单词农场</h2>
            <p>请输入密码继续</p>
          </div>

          <Suspense fallback={<p style={{ textAlign: 'center', color: '#fdba74' }}>加载中...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
