module.exports = {
  plugins: {
    // Usa el plugin de Tailwind CSS a través de @tailwindcss/postcss
    // Esto es lo que el error te está pidiendo específicamente.
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
