import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#3A0519',
        'primary-deep': '#670D2F',
        'primary-vibrant': '#A53860',
        'primary-accent': '#EF88AD',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-in-out',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { textShadow: '0 0 5px #EF88AD, 0 0 10px #EF88AD' },
          '50%': { textShadow: '0 0 20px #EF88AD, 0 0 30px #EF88AD' },
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // This is the line that adds the plugin
  ],
};
export default config;