/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981', // Brand Emerald
          light: '#34d399',
          dark: '#059669',
          deep: '#064e3b'
        },
        brand: {
          background: '#f8fafc',
          dark: '#0f172a',
          surface: '#ffffff',
          'surface-dark': '#1e293b',
          text: '#0f172a',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'brand': '0 20px 50px -12px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
