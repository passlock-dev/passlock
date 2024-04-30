const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      aria: {
        invalid: 'invalid="true"'
      },
      colors: {
        base: colors.slate,
        primary: colors.blue
      }
    }
  },

  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/aspect-ratio')],

  corePlugins: {
    aspectRatio: false
  },

  darkMode: 'class'
}

module.exports = config
