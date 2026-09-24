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
        },
        // Enterprise Operational Status Palette
        status: {
          up: '#10B981',        // Normal / Operational
          warning: '#F59E0B',   // Warning / Degraded
          down: '#EF4444',      // Critical / Down
          offline: '#6B7280',   // Unmanaged / Offline
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.45)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.45)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.55)',
        'glow-gray': '0 0 15px rgba(107, 114, 128, 0.3)',
      }
    },
  },
  plugins: [],
}