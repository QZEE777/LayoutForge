import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        bebas: ["var(--font-bebas-neue)", "sans-serif"],
      },
      colors: {
        brand: {
          bg: "#0F0D0B",
          card: "#1A1612",
          cardHover: "#2A2420",
          gold: "#F5A623",
          cream: "#FAF7F2",
          muted: "#8B7355",
          locked: "#2A2520",
        },
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(245, 166, 35, 0.15)",
        "gold-glow-lg": "0 0 40px rgba(245, 166, 35, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
