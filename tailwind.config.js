/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#5B21B6',
          primaryHover: '#4C1D95',
          secondary: '#7C3AED',
          light: '#EDE9FE',
          surface: '#F5F3FF',
          dark: '#3B0764',
        },
        ops: {
          bg: '#FAF9FC',
          card: '#FFFFFF',
          cardSubtle: '#F7F5FA',
          border: '#EEEEF2',
          borderLight: '#F3F2F7',
          text: '#1F1F1F',
          muted: '#6B6B6B',
          available: '#10B981',
          assigned: '#7C3AED',
          busy: '#5B21B6',
          traveling: '#F59E0B',
          offline: '#9CA3AF',
          stale: '#EA580C',
          risk: '#E11D48',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(91, 33, 182, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'soft-md': '0 4px 16px rgba(91, 33, 182, 0.06), 0 2px 6px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 10px 30px rgba(91, 33, 182, 0.08), 0 4px 10px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
