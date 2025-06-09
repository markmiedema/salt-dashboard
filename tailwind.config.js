/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    { pattern: /(bg|text)-(blue|emerald|purple|orange)-100/ },
    { pattern: /(text)-(blue|emerald|purple|orange)-600/ }
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
