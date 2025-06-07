import type { Config } from 'tailwindcss';

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#9b87f5", // Main text and interactive elements
          light: "#D6BCFA", // Subtle backgrounds and borders
          dark: "#6E59A5", // Emphasized text
          muted: "#7E69AB", // Secondary text
        },
        accent: {
          DEFAULT: "#abecd6", // Default accent (mint)
          success: "#abecd6", // Success states (mint)
          error: "#FF719A", // Error states (pink)
          warning: "#FFE29F", // Warning states (yellow)
          info: "#9b87f5", // Info states (primary)
        },
        state: {
          hover: "#abecd6", // Hover state color (mint)
          active: "#6E59A5", // Active state color (primary dark)
          disabled: "#7E69AB", // Disabled state color (primary muted)
          focus: "#9b87f5", // Focus state color (primary)
        },
        secondary: {
          DEFAULT: "#E5DEFF",
          foreground: "#222222",
        },
        destructive: {
          DEFAULT: "#FF719A",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        enter: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'word-reveal': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        enter: 'enter 0.5s ease-out',
        'word-reveal': 'word-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
