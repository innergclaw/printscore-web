/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0F1115',
        surface: '#1A1E24',
        text: '#E8E8E8',
        'text-muted': '#9CA3AF',
        'accent-teal': '#00D1C7',
        'accent-cyan': '#2DE2E6',
        'accent-lime': '#C7F464',
        'accent-amber': '#F5A623',
        'accent-pink': '#FF008C',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-teal': '0 0 30px rgba(0, 209, 199, 0.3)',
        'glow-cyan': '0 0 30px rgba(45, 226, 230, 0.3)',
        'glow-lime': '0 0 30px rgba(199, 244, 100, 0.3)',
        'glow-amber': '0 0 30px rgba(245, 166, 35, 0.3)',
        'glow-pink': '0 0 30px rgba(255, 0, 140, 0.3)',
        'soft': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
