/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#F0E6D6",
        parchmentdark: "#E4D5BC",
        ink: "#22201B",
        oxblood: "#8B3A2F",
        oxblooddark: "#6B2B22",
        moss: "#4A5D3A",
        slate: "#5B6470",
        amber: "#B8863B",
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
