import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
    "./mdx-components.tsx",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontSize: {
      xs: "12px",
      sm: "13px",
      base: "14px",
      lg: "16px",
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        "text-hover": "var(--text-hover)",
        border: "var(--border)",
        grey: "var(--grey)",
        primary: "var(--primary)",
        secondary: "var(--background-secondary)",
        background: "var(--background)",
      },
    },
  },
  plugins: [],
} satisfies Config;
