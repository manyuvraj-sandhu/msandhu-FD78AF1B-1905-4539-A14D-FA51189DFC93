import type { Config } from 'tailwindcss';
import * as path from 'path';

const config: Config = {
  content: [
    path.join(__dirname, 'src/**/*.{html,ts,js}'),
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
