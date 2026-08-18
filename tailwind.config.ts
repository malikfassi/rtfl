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
          DEFAULT: "hsl(var(--primary))", // Main text and interactive elements
          light: "hsl(var(--primary-light))", // Subtle backgrounds and borders
          dark: "hsl(var(--primary-dark))", // Emphasized text
          muted: "hsl(var(--primary-muted))", // Secondary text
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          success: "hsl(var(--accent-success))", // green
          error: "hsl(var(--accent-error))", // red/coral
          warning: "hsl(var(--accent-warning))", // amber
          info: "hsl(var(--accent-info))", // blue
        },
        state: {
          hover: "hsl(var(--state-hover))",
          active: "hsl(var(--state-active))",
          disabled: "hsl(var(--state-disabled))",
          focus: "hsl(var(--state-focus))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
