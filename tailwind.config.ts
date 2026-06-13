import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf4",
          100: "#d5f6e5",
          500: "#169b62",
          600: "#0f7a4c",
          700: "#0c633f"
        },
        ink: "#17201b"
      }
    }
  },
  plugins: []
};

export default config;
