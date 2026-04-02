import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Stocko brand — fundo escuro navy + acentos dourados
        navy: {
          950: "#050a18",
          900: "#090f24",
          800: "#0d1530",
          700: "#111d3e",
          600: "#172550",
        },
        gold: {
          300: "#fcd97d",
          400: "#f9c840",
          500: "#f0b429",
          600: "#d99a0e",
          700: "#b37c06",
        },
        success: "#22c55e",
        danger:  "#ef4444",
        muted:   "#64748b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(240,180,41,0.15), transparent)",
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease forwards",
        "fade-in":    "fadeIn 0.4s ease forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        ticker:       "ticker 30s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(240,180,41,0)" },
          "50%":       { boxShadow: "0 0 20px 4px rgba(240,180,41,0.3)" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
