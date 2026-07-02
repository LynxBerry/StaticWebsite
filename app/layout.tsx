import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Zeno的单词农场',
  description: 'Zeno的单词农场，基于艾宾浩斯 / Leitner 间隔重复系统背单词。'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex items-center justify-center relative p-4 text-farm-text bg-[#1a120b] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
