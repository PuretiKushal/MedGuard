/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F0",
        white: "#FFFFFF",
        ink: "#1C2620",
        "ink-faded": "#5B6B62",
        green: "#1F6F50",
        "green-light": "#E5EFE9",
        red: "#B23A3A",
        "red-light": "#F7E8E6",
        amber: "#C98A2E",
        "amber-light": "#F8EFDF",
        line: "#E8E2D3",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Public Sans", "sans-serif"],
        mono: ["Spline Sans Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "7px",
      },
    },
  },
  plugins: [],
};
