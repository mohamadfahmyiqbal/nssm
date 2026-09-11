/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noc: {
          bg: '#0a0e17',
          card: '#111827',
          border: '#1f2937',
          accent: '#3b82f6',
        }
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(34, 197, 94, 0.5)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.5)',
        'glow-red': '0 0 15px rgba(244, 63, 94, 0.6)',
      }
    },
  },
  plugins: [],
}