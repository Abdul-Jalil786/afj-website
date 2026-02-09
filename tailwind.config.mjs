/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'afj-primary': '#2D3748',
        'afj-secondary': '#4A5568',
        'afj-text': '#1A202C',
        'afj-accent': '#38A169',
        'afj-green': '#2F855A',
        'afj-white': '#FFFFFF',
        'afj-light-white': '#F7FAFC',
        'afj-dark-blue': '#1A365D',
        'afj-sky-blue': '#3182CE',
        'afj-red': '#E53E3E',
        'afj-cqc-green': '#00A651',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
