/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}'],
  theme: {
    extend: {
      colors: {
        ink: '#1D2A3A',
        paper: '#F3EFE7',
        ember: '#C65B28',
        moss: '#4B785A',
        gold: '#D7AE45'
      },
      boxShadow: {
        card: '0 18px 40px -24px rgba(29, 42, 58, 0.45)'
      }
    }
  },
  plugins: []
};
