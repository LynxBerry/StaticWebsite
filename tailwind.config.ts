import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', '-apple-system', '"PingFang SC"', '"Hiragino Sans GB"', 'sans-serif'],
        display: [
          'var(--font-quicksand)',
          'var(--font-nunito)',
          'system-ui',
          '-apple-system',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          'sans-serif'
        ]
      },
      colors: {
        farm: {
          layout: '#edece8',
          bg: '#efefeb',
          card: '#ffffff',
          border: '#e0e0e0',
          borderLight: 'rgba(112, 176, 112, 0.45)',
          borderSecondary: '#e8e8e8',
          fillQuaternary: '#f0f0ec',
          text: '#3D2F1F',
          muted: '#5C5045',
          textSecondary: '#7d7468',
          accent: '#70B070',
          green: '#5CA85C',
          red: '#E85D5D'
        },
        // 10-step green palette (from brand design system) for hover/active/
        // disabled states. Key reference points:
        //   1-2: backgrounds (chips, subtle fills)
        //   5:   hover on light
        //   6:   base sprout green (#70b070)
        //   7:   active / pressed
        //   8-9: dark text-on-light variants (e.g. title)
        sprout: {
          50: '#e4f0e1',
          100: '#d7e3d5',
          200: '#cbd6c9',
          300: '#bec9bd',
          400: '#98bd97',
          500: '#70b070',
          600: '#518a53',
          700: '#366339',
          800: '#1e3d21',
          900: '#0b170d'
        },
        // Harvest orange — accent-secondary for due/celebration states
        harvest: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c'
        }
      },
      boxShadow: {
        /* Flat, barely-there shadows for cards and buttons. */
        glass: '0 1px 3px rgba(0, 0, 0, 0.04)',
        'glass-sm': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'sprout': '0 1px 2px rgba(112, 176, 112, 0.15)',
        'sprout-hover': '0 2px 4px rgba(112, 176, 112, 0.2)'
      },
      transitionTimingFunction: {
        // Brand standard easing from the design system
        'sprout-in-out': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        'sprout-out': 'cubic-bezier(0.215, 0.61, 0.355, 1)'
      },
      transitionDuration: {
        'sprout-fast': '100ms',
        'sprout-mid': '200ms',
        'sprout-slow': '300ms'
      }
    }
  },
  plugins: []
};

export default config;
