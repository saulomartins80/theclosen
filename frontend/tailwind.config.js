module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // Adicione esta linha
    autoprefixer: {},
  },
};


/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Habilita o modo escuro com classes
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}", // Para Next.js 13+
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};