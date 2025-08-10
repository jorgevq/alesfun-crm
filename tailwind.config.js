/** @type {import('tailwindcss').Config} */
module.exports = {
  // Asegúrate de que esta sección 'content' incluya tus archivos Vue
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Esto es crucial para que Tailwind escanee tus componentes Vue
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
