/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0D1117",
        surface: "#1A1F2E",
        accent: "#2EC4B6",
        critical: "#E63946",
        warning: "#F4A261",
      },
    },
  },
  plugins: [],
}