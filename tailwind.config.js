/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        visios: {
          bg: '#090d16',
          surface: '#0f172a',
          card: 'rgba(15, 23, 42, 0.75)',
          border: '#1e293b',
          cyan: '#06b6d4',
          neonCyan: '#22d3ee',
          violet: '#8b5cf6',
          neonViolet: '#a78bfa',
          blue: '#3b82f6',
          accent: '#38bdf8',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'glow-violet': '0 0 20px -3px rgba(139, 92, 246, 0.35)',
        'hud': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        'cyber-grid': 'linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.05) 1px, transparent 1px)',
        'spatial-glow': 'radial-gradient(ellipse at 50% -20%, rgba(56, 189, 248, 0.15), transparent 70%), radial-gradient(ellipse at 80% 120%, rgba(139, 92, 246, 0.12), transparent 70%)',
      },
      animation: {
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
};

