/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      aria: {
        invalid: 'invalid="true"',
      },
    }
  },

  plugins: [require('@tailwindcss/forms')],

  darkMode: 'class'
}

module.exports = config
