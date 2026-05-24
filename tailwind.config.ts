import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./modules/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7F1",
        ink: "#2A2420",
        terracotta: {
          DEFAULT: "#C75B3A",
          dark: "#A8492C",
          soft: "#E8B5A2",
        },
        sage: {
          DEFAULT: "#7A8E6E",
          dark: "#5F7256",
          soft: "#C5D1BB",
        },
        cream: "#F4ECDD",
        sand: "#E8DFCC",
        slate: {
          ink: "#1F2937",
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Source Serif Pro"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        soft: "14px",
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(60, 40, 30, 0.18)",
        card: "0 2px 10px -2px rgba(60, 40, 30, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
