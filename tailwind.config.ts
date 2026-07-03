import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: [
          'var(--font-lora)',
          'var(--font-jakarta)',
          '"Songti SC"',
          '"Source Han Serif SC"',
          '"Noto Serif SC"',
          'Georgia',
          'serif'
        ]
      },
      colors: {
        farm: {
          bg: '#F4F4F0',
          card: '#FFFFFF',
          border: 'rgba(112, 176, 112, 0.22)',
          borderLight: 'rgba(112, 176, 112, 0.45)',
          text: '#3D2F1F',
          muted: '#7A6B5A',
          accent: '#70B070',
          green: '#5CA85C',
          red: '#E85D5D'
        }
      },
      backdropBlur: {
        glass: '12px'
      },
      boxShadow: {
        glass: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }
    }
  },
  plugins: []
};

export default config;
