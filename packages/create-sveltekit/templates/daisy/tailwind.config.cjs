/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      aria: {
        invalid: 'invalid="true"'
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite'
      }
    }
  },

  plugins: [require('daisyui'), require('@tailwindcss/aspect-ratio')],

  corePlugins: {
    aspectRatio: false
  },

  daisyui: {
    themes: ['light', 'dark']
  }
}

module.exports = config
