/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#f97316', // orange-500 — màu chủ đạo
      },
    },
  },
  plugins: [],
}
