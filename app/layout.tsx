import type { Metadata } from 'next';
import { Nunito, Quicksand, Fredoka, ZCOOL_KuaiLe } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
  preload: true
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
  preload: true
});

// Fredoka: round child-friendly latin font for the site title.
// ZCOOL KuaiLe: round child-friendly Chinese font — paired with Fredoka
// so the title reads playfully in both scripts.
const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
  preload: true
});

const zcool = ZCOOL_KuaiLe({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-zcool',
  display: 'swap',
  preload: false
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
    <html lang="zh-CN" className={`${nunito.variable} ${quicksand.variable} ${fredoka.variable} ${zcool.variable}`}>
      <body className="min-h-screen flex items-start justify-center relative p-4 pt-20 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
