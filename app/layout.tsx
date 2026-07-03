import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, Lora } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
  preload: true
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'optional',  // avoid FOUC: don't swap after load, use fallback if slow
  preload: true
});

export const metadata: Metadata = {
  title: 'Sprout · 单词农场',
  description: 'Sprout · 单词农场，基于艾宾浩斯 / Leitner 间隔重复系统背单词。'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jakarta.variable} ${lora.variable}`}>
      <body className="min-h-screen flex items-start justify-center relative p-4 pt-20 text-farm-text bg-farm-layout font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
