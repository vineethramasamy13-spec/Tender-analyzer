/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0F1E',
        primary: '#3B82F6',
        secondary: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
      },
      backgroundImage: {
        'gradient-1': 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
        'gradient-2': 'linear-gradient(135deg, #10B981, #3B82F6)',
      }
    },
  },
  plugins: [],
}
