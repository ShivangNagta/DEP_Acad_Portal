/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',

        primary: 'rgb(var(--primary) / <alpha-value>)',
        primarySoft: 'rgb(var(--primary-soft) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      }
    }
  },
  plugins: []
};

