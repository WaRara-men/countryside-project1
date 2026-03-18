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
        "samurai-black": "#1a1a1a",
        "samurai-red": "#d93025",
        "samurai-gold": "#f9ab00",
        "samurai-green": "#1e8e3e",
        "samurai-white": "#ffffff",
      },
      fontSize: {
        "elderly-base": "1.5rem",
        "elderly-lg": "2rem",
        "elderly-xl": "3rem",
      },
    },
  },
  plugins: [],
};
export default config;