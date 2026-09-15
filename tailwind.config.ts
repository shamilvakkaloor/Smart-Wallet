import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { brand: { 50: "#ecfdf5", 500: "#10b981", 600: "#059669", 700: "#047857" } } } },
  plugins: [],
} satisfies Config;
