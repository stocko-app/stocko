import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0A0E1A",
          900: "#0D1F3C",
          850: "#0B1730",
          800: "#102447",
          700: "#17335F",
          600: "#1E447C",
        },
        gold: {
          300: "#FFE889",
          400: "#FFD700",
          500: "#F0B429",
          600: "#C98B06",
          700: "#A66F00",
        },
        success: "#00FF88",
        danger:  "#FF4757",
        electric: "#00FF88",
        coral: "#FF4757",
        muted:   "#64748b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,255,136,0.13), transparent 58%), radial-gradient(ellipse 70% 45% at 90% 0%, rgba(255,215,0,0.12), transparent 52%)",
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease forwards",
        "fade-in":    "fadeIn 0.4s ease forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        ticker:       "ticker 30s linear infinite",
        "pulse-green": "pulseGreen 2.2s ease-in-out infinite",
        "score-pop": "scorePop 0.45s ease-out",
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
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,255,136,0)" },
          "50%": { boxShadow: "0 0 28px 4px rgba(0,255,136,0.26)" },
        },
        scorePop: {
          "0%": { transform: "scale(0.96)", opacity: "0.72" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
