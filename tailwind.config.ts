import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brun: {
          DEFAULT: '#1A1410',
          50: '#f5f0eb',
          100: '#e8ddd4',
          200: '#d4bfa9',
          300: '#bfa17e',
          400: '#a88453',
          500: '#8c6b3a',
          600: '#6e5229',
          700: '#503b1c',
          800: '#322410',
          900: '#1A1410',
        },
        creme: {
          DEFAULT: '#FAF7F2',
          50: '#fdfcfa',
          100: '#FAF7F2',
          200: '#f0e9dc',
        },
        or: {
          DEFAULT: '#C9A96E',
          light: '#dfc28e',
          dark: '#a88749',
        },
        rouge: {
          DEFAULT: '#C41E3A',
          light: '#d94057',
          dark: '#9e1830',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
