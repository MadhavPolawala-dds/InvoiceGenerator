import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'surface-glass': 'var(--surface-glass)',
        'surface-glass-strong': 'var(--surface-glass-strong)',
        'border-glass': 'var(--border-glass)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
          tint: 'var(--accent-tint)',
        },
        success: {
          DEFAULT: 'var(--success)',
          tint: 'var(--success-tint)',
          text: 'var(--success-text)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          tint: 'var(--warn-tint)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          tint: 'var(--danger-tint)',
          text: 'var(--danger-text)',
        },
        ring: 'var(--ring)',
      },
      borderRadius: {
        card: '28px',
        control: '16px',
        input: '14px',
        pill: '9999px',
      },
      boxShadow: {
        glass: 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(31,38,80,0.10), 0 1px 2px rgba(31,38,80,0.06)',
        'glass-hover': 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(255,255,255,0.3), 0 12px 36px rgba(31,38,80,0.14), 0 2px 4px rgba(31,38,80,0.08)',
        'glass-primary': 'inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 20px rgba(37,99,235,0.32), 0 1px 2px rgba(37,99,235,0.16)',
        'glass-destructive': 'inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 20px rgba(220,38,38,0.25), 0 1px 2px rgba(220,38,38,0.12)',
        sheet: '0 20px 40px -15px rgba(0,0,0,0.07), 0 0 1px 1px rgba(0,0,0,0.04)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['var(--font-heading)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'drift-1': 'drift1 34s ease-in-out infinite alternate',
        'drift-2': 'drift2 38s ease-in-out infinite alternate',
        'drift-3': 'drift3 42s ease-in-out infinite alternate',
      },
      keyframes: {
        drift1: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(80px, 40px) scale(1.15)' },
          '100%': { transform: 'translate(-40px, 90px) scale(0.95)' },
        },
        drift2: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-70px, -50px) scale(1.1)' },
          '100%': { transform: 'translate(50px, -30px) scale(1.05)' },
        },
        drift3: {
          '0%': { transform: 'translate(0px, 0px) scale(1.05)' },
          '50%': { transform: 'translate(60px, -60px) scale(0.9)' },
          '100%': { transform: 'translate(-50px, 40px) scale(1.12)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
