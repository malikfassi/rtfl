import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#9b87f5',
        'deep-purple': '#7E69AB',
        'royal-purple': '#6E59A5',
        'light-purple': '#D6BCFA',
        pink: '#FF719A',
        coral: '#FFA99F',
        yellow: '#FFE29F',
        mint: '#abecd6',
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
