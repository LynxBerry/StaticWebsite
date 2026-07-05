import type { Metadata, Viewport } from 'next';
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

// Viewport: width=device-width makes mobile render at real device width
// (otherwise phones fake a 980px desktop viewport and shrink the page).
// maximumScale=5 lets users zoom in (kid-friendly — they may need bigger
// text), but we cap it so iOS doesn't auto-zoom on input focus in a jarring way.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e2a1f'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${nunito.variable} ${quicksand.variable} ${fredoka.variable} ${zcool.variable}`}>
      <body className="min-h-screen flex items-start justify-center relative p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 lg:pt-28 font-sans antialiased">
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter id="liquid-glass-nav" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.04 0.02"
                numOctaves="3"
                seed="5"
                result="noise"
              />
              <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G" scale="40" result="dispRed" />
              <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
              
              <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G" scale="35" result="dispGreen" />
              <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
              
              <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G" scale="30" result="dispBlue" />
              <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
              
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
