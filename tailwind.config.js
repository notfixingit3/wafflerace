/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./internal/**/*.templ",
    "./web/**/*.html",
    "./cmd/**/*.go",
  ],
  safelist: [
    'h-8',
    'max-w-[110px]',
    'object-contain',
    'mr-2',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ["light"],
  },
};
