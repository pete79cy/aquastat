/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#f7f9fd",
          dim: "#d8dadd",
          bright: "#f7f9fd",
          0: "#ffffff",
          1: "#f2f4f7",
          2: "#eceef1",
          3: "#e6e8eb",
          4: "#e0e3e6",
        },
        ink: {
          DEFAULT: "#191c1e",
          muted: "#40484d",
          subtle: "#70787e",
          inverse: "#eff1f4",
        },
        outline: {
          DEFAULT: "#70787e",
          variant: "#bfc8ce",
        },
        primary: {
          DEFAULT: "#00526f",
          fg: "#ffffff",
          container: "#0f6b8f",
          "container-fg": "#bfe6ff",
          tint: "#006689",
          fixed: "#c3e8ff",
        },
        secondary: {
          DEFAULT: "#00677d",
          fg: "#ffffff",
          container: "#6bddff",
          "container-fg": "#006075",
        },
        tertiary: {
          DEFAULT: "#6f4100",
          fg: "#ffffff",
          container: "#8d5712",
          "container-fg": "#ffdab7",
        },
        achieved: {
          DEFAULT: "#0a7d4d",
          bg: "#dcf5e7",
        },
        close: {
          DEFAULT: "#a35b00",
          bg: "#ffe9cc",
        },
        warn: {
          DEFAULT: "#ba1a1a",
          bg: "#ffdad6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        "display-time": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      boxShadow: {
        card: "0 4px 20px rgba(15, 107, 143, 0.05)",
        "card-hover": "0 6px 28px rgba(15, 107, 143, 0.08)",
      },
      maxWidth: {
        container: "1440px",
      },
    },
  },
  plugins: [],
};
