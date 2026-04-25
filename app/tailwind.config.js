/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#065F46',
        secondary: '#1E40AF',
        accent: '#0D9488',
        background: '#FFFFFF',
        foreground: '#1F2937',
        muted: '#F3F4F6',
        'muted-foreground': '#6B7280',
        border: '#E5E7EB',
        'input-background': '#F9FAFB',
        dark: {
          background: '#09090B',
          foreground: '#FAFafa',
          muted: '#27272A',
          'muted-foreground': '#A1A1AA',
          border: '#27272A',
        }
      },
    },
  },
  plugins: [],
}
