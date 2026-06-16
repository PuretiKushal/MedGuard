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
        surface: { DEFAULT: "#1A1F2E", 2: "#222839" },
        accent: "#2EC4B6",
        critical: { DEFAULT: "#E63946", bg: "rgba(230,57,70,0.12)" },
        warning: { DEFAULT: "#F4A261", bg: "rgba(244,162,97,0.12)" },
        safe: { DEFAULT: "#2EC4B6", bg: "rgba(46,196,182,0.12)" },
        expired: { DEFAULT: "#8B949E", bg: "rgba(139,148,158,0.12)" },
        border: "#2E3548",
        text: { primary: "#F0F4F8", secondary: "#A0AEC0", muted: "#6B7280" },
      },
      animation: {
        pulse_critical: "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
        fade_in: "fadeIn 0.3s ease-in",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
      },
    },
  },
  plugins: [],
}