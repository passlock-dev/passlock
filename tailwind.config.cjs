const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      aria: {
        invalid: 'invalid="true"',
      },
      colors: {
        base: colors.slate,
        primary: colors.blue
      },
    }
  },

  plugins: [require('@tailwindcss/forms')],

  darkMode: 'class'
}

module.exports = config
