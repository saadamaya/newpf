/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      boxShadow: {
        'neumorphic': '6px 6px 12px #bebebe, -6px -6px 12px #ffffff',
        'neumorphic-inset': 'inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff',
        'neumorphic-pressed': 'inset 3px 3px 6px #bebebe, inset -3px -3px 6px #ffffff',
        'neumorphic-sm': '3px 3px 6px #bebebe, -3px -3px 6px #ffffff'
      }
    },
  },
  plugins: [],
}