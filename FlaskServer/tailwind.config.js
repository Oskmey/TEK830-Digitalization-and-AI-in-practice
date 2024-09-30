/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/svelte/**/*.svelte",
    "./app/svelte/**/*.js",
    "./app/templates/**/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: '"DM Sans"',
        title: '"Cormorant Garamond"'
      },
      colors: {
        light: {
          100: '#E9E8E3',
        },

        dark: {
          100: '#C2C2C2',
          200: '#202020',
          300: '#080808',
          400: '#94938D',
        },
      },
    },
  },
  plugins: [],
}

