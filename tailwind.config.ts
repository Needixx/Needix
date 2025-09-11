import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: { 
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 4s ease-in-out infinite alternate',
        'slow-pulse': 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slower-pulse': 'pulse 16s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ultra-slow-pulse': 'pulse 20s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mega-slow-pulse': 'pulse 25s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    } 
  },
  plugins: [],
} satisfies Config;