import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { slate: { 50: "#f6f8f7", 100: "#edf2ef", 200: "#e5ebe8", 300: "#c8d5ce", 700: "#364c41", 800: "#1c2b27", 900: "#111c19", 950: "#0b1412" }, brand: { 50: "#ecfdf5", 500: "#10b981", 600: "#059669", 700: "#047857" } } } },
  plugins: [],
} satisfies Config;
