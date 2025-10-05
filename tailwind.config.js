module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'cube-rotate': 'cubeRotate 2s ease-in-out',
        'cube-to-cv': 'cubeToCV 3s ease-in-out forwards',
        'fade-in': 'fadeIn 1s ease-in-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        cubeRotate: {
          '0%': { transform: 'rotateX(0deg) rotateY(0deg)' },
          '50%': { transform: 'rotateX(180deg) rotateY(180deg)' },
          '100%': { transform: 'rotateX(360deg) rotateY(360deg)' },
        },
        cubeToCV: {
          '0%': { 
            transform: 'scale(1) rotateX(0deg) rotateY(0deg)',
            opacity: 1
          },
          '50%': { 
            transform: 'scale(0.5) rotateX(180deg) rotateY(180deg)',
            opacity: 0.7
          },
          '100%': { 
            transform: 'scale(0) rotateX(360deg) rotateY(360deg)',
            opacity: 0
          },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(50px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}

