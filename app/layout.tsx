import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
