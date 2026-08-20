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
      screens: {
        'max-sm': { max: '639px' },
      },
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
        // 2026 redesign tokens — namespaced to avoid colliding with the
        // legacy HSL tokens above, which stay for admin/shared ui primitives
        // that are out of scope for this pass. See globals.css.
        rtfl: {
          bg: "var(--rtfl-bg)",
          surface: "var(--rtfl-surface)",
          raised: "var(--rtfl-raised)",
          line: "var(--rtfl-line)",
          "line-soft": "var(--rtfl-line-soft)",
          ink: "var(--rtfl-ink)",
          "ink-2": "var(--rtfl-ink-2)",
          "ink-3": "var(--rtfl-ink-3)",
          "ink-ghost": "var(--rtfl-ink-ghost)",
          accent: "var(--rtfl-accent)",
          "accent-ink": "var(--rtfl-accent-ink)",
          "accent-bg": "var(--rtfl-accent-bg)",
          "accent-line": "var(--rtfl-accent-line)",
          focus: "var(--rtfl-focus)",
          hit: "var(--rtfl-hit)",
          duplicate: "var(--rtfl-duplicate)",
          miss: "var(--rtfl-miss)",
          error: "var(--rtfl-error)",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Space Grotesk", "sans-serif"],
        grotesk: ["Space Grotesk", "sans-serif"],
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
        rtflWave: {
          from: { opacity: '0', transform: 'translateY(5px)' },
          to: { opacity: '1', transform: 'none' },
        },
        rtflRise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        rtflCount: {
          from: { opacity: '0', transform: 'translateY(3px)' },
          to: { opacity: '1', transform: 'none' },
        },
        rtflBreathe: {
          '0%, 100%': { opacity: '.34' },
          '50%': { opacity: '.85' },
        },
        rtflPopIn: {
          '0%': { transform: 'scaleX(0.02)' },
          '60%': { transform: 'scaleX(1.02)' },
          '100%': { transform: 'scaleX(1)' },
        },
        rtflBarFlash: {
          '0%': { boxShadow: '0 0 0 0 rgba(255,255,255,0)' },
          '35%': { boxShadow: '0 0 0 3px rgba(255,255,255,0.10)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0)' },
        },
        rtflSweep: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(220%)' },
        },
      },
      animation: {
        enter: 'enter 0.5s ease-out',
        'word-reveal': 'word-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'rtfl-wave': 'rtflWave 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'rtfl-rise': 'rtflRise 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'rtfl-count': 'rtflCount 180ms ease-out both',
        'rtfl-breathe': 'rtflBreathe 1.5s ease-in-out infinite',
        'rtfl-pop-in': 'rtflPopIn 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'rtfl-bar-flash': 'rtflBarFlash 620ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'rtfl-sweep': 'rtflSweep 1100ms 120ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
      transitionTimingFunction: {
        rtfl: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
