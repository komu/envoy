/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': 'var(--color-primary-bg)',
        'secondary-bg': 'var(--color-secondary-bg)',
        'tertiary-bg': 'var(--color-tertiary-bg)',
        'accent': 'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}