/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        aqua: '#14D8D4',
        pink: '#FF008C',
        yellow: '#FFE600',
        charcoal: '#1F1F1F',
        'bg-light': '#F7F7F7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'glow-pink': '0 0 40px rgba(255, 0, 140, 0.4)',
        'glow-aqua': '0 0 40px rgba(20, 216, 212, 0.4)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
}
