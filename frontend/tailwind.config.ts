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
        background: "var(--background)",
        foreground: "var(--foreground)",
        zoom: {
          blue: "#0B5CFF",
          darkBg: "#1C1C1C",
          cardBg: "#2D2D2D",
          orange: "#FF742E", // Bright Orange for New Meeting
          gray: "#39393D", // Charcoal Gray for action tiles
        },
      },
    },
  },
  plugins: [],
};
export default config;
