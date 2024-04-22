/** @type {import('tailwindcss').Config}*/
const config = {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
  ],

  theme: {
    extend: {},
  },

  plugins: [
    require('@tailwindcss/forms'),
  ],

  darkMode: 'class'
};

module.exports = config;
