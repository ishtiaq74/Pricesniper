/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        brand: {
          50:  '#fff4e6',
          100: '#ffe8c0',
          200: '#ffd180',
          300: '#ffbb40',
          400: '#ffaa33',
          500: '#FF8C00',   // Primary orange
          600: '#e07a00',
          700: '#c46a00',
          800: '#a05500',
          900: '#7a4200',
        },
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'spin-slow':    'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,140,0,0.4)' },
          '50%':      { boxShadow: '0 0 24px rgba(255,140,0,0.8)' },
        },
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(255,140,0,0.35)',
        'orange-sm':   '0 0 10px rgba(255,140,0,0.2)',
      },
    },
  },
  plugins: [],
};
