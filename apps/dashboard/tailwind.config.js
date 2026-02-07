import { Config } from 'tailwindcss';

export default {
  content: [
    '{projectRoot}/src/**/*.{html,ts,js}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
