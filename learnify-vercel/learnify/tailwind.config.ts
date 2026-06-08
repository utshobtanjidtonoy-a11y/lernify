import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
      colors: {
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd4ff",
          300: "#8eb8ff",
          400: "#5991ff",
          500: "#2563eb",
          600: "#1a4fd6",
          700: "#1540b8",
          800: "#173496",
          900: "#192f77",
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.8s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern":
          "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(37, 99, 235, 0.15), rgba(255, 255, 255, 0))",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(37, 99, 235, 0.12), 0 1px 4px -1px rgba(0,0,0,0.06)",
        "card-hover":
          "0 12px 40px -8px rgba(37, 99, 235, 0.22), 0 2px 8px -2px rgba(0,0,0,0.08)",
        glow: "0 0 40px rgba(37, 99, 235, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
