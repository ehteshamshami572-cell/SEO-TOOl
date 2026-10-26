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
        shopify: {
          dark: "#004c3f",
          green: "#008060",
          light: "#f7faf9",
          accent: "#95bf47",
        },
      },
    },
  },
  plugins: [],
};
export default config;
