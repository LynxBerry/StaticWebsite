import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          bg: '#1a0f08',
          card: 'rgba(42, 24, 11, 0.55)',
          border: 'rgba(253, 186, 116, 0.12)',
          borderLight: 'rgba(253, 186, 116, 0.35)',
          text: '#fff7ed',
          muted: '#fdba74',
          green: '#22c55e',
          red: '#ef4444'
        }
      },
      backdropBlur: {
        glass: '12px'
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35)'
      }
    }
  },
  plugins: []
};

export default config;
