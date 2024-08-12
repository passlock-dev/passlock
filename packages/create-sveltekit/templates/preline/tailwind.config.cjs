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
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite'
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
