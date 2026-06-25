import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind scans these files for class names to include in the final CSS.
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark navy/purple palette used across the app.
        background: "#0f0f1a",
        card: "#16162a",
        border: "#262645",
        accent: {
          DEFAULT: "#7c5cff", // purple
          hover: "#8f73ff",
          blue: "#4f8cff",
        },
      },
      keyframes: {
        // Fade + slide used by the copy-to-clipboard toast.
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
