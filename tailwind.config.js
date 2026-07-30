/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#93C5FD',
          400: '#4F46E5',
          500: '#4338CA',
          600: '#3730A3',
          700: '#312E81',
          800: '#1E1B4B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        reading: ['Plus Jakarta Sans', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-danger': 'pulseDanger 1s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDanger: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
        },
        bounceSoft: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [require('daisyui'), require('@tailwindcss/typography')],
  daisyui: {
    themes: [
      {
        readingapp: {
          "primary":          "#4F46E5",
          "primary-content":  "#ffffff",
          "secondary":        "#6366F1",
          "secondary-content":"#ffffff",
          "accent":           "#4338CA",
          "accent-content":   "#ffffff",
          "neutral":          "#4B5563",
          "neutral-content":  "#F9FAFB",
          "base-100":         "#FFFFFF",
          "base-200":         "#F8FAFC",
          "base-300":         "#F1F5F9",
          "base-content":     "#1C1C1E",
          "info":             "#3B82F6",
          "info-content":     "#ffffff",
          "success":          "#22C55E",
          "success-content":  "#ffffff",
          "warning":          "#F59E0B",
          "warning-content":  "#ffffff",
          "error":            "#EF4444",
          "error-content":    "#ffffff",
        },
      },
    ],
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}
