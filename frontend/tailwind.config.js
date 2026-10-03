/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // "Clarity Blue" — primary brand color, used for links, primary buttons,
        // and the "upcoming" dose status.
        primary: {
          50: "#EEF3FF",
          100: "#DCE8FF",
          200: "#B9D0FF",
          300: "#8FB2FF",
          400: "#5C8CFF",
          500: "#2F6FED",
          600: "#2358D1",
          700: "#1B44A8",
          800: "#163685",
          900: "#122C6B",
        },
        // "Vital Green" — success / "taken" status, secondary accents.
        secondary: {
          50: "#ECFBF4",
          100: "#D3F5E4",
          200: "#A6EBC9",
          300: "#6FDCAA",
          400: "#3FC98D",
          500: "#22B57B",
          600: "#189165",
          700: "#147352",
          800: "#125C43",
          900: "#0F4A37",
        },
        // "Dusk Purple" — used sparingly for premium/highlight touches.
        accent: {
          50: "#F2F1FE",
          100: "#E4E2FD",
          200: "#C9C5FB",
          300: "#A9A1F7",
          400: "#8F84F1",
          500: "#7C6FE8",
          600: "#6153CE",
          700: "#4C40A5",
          800: "#3D3482",
          900: "#322B69",
        },
        // "Amber" — "skipped" status + low-stock warnings.
        amber: {
          50: "#FDF8ED",
          100: "#FBEFD1",
          200: "#F6DFA3",
          300: "#EFC96D",
          400: "#E9B94B",
          500: "#DE9F2E",
          600: "#BD8022",
          700: "#96631C",
          800: "#78501C",
          900: "#63421B",
        },
        // "Ember" — "missed" status / destructive actions.
        danger: {
          50: "#FEF3F1",
          100: "#FDE3DE",
          200: "#FBC4B9",
          300: "#F79C89",
          400: "#F0725A",
          500: "#E2542D",
          600: "#C43F1C",
          700: "#9F3216",
          800: "#7F2A15",
          900: "#692515",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#F7FAF9",
          dark: "#16211C",
          darker: "#0E1613",
        },
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(16, 40, 34, 0.08), 0 8px 24px -8px rgba(16, 40, 34, 0.10)",
        card: "0 1px 3px rgba(16, 40, 34, 0.06), 0 10px 30px -10px rgba(16, 40, 34, 0.12)",
        glow: "0 0 0 4px rgba(47, 111, 237, 0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "slide-up": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "pop-in": { "0%": { opacity: 0, transform: "scale(0.96)" }, "100%": { opacity: 1, transform: "scale(1)" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "pop-in": "pop-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
