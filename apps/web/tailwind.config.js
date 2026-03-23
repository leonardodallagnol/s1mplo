/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'acid-green': '#CCFF00',
        'void-black': '#0A0A0A',
        'off-black': '#111111',
        'dark-gray': '#1A1A1A',
        'gray-400': '#9CA3AF',
        'gray-600': '#4B5563',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        opportunity: '#A855F7',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        card: '8px',
      },
    },
  },
  plugins: [],
}
