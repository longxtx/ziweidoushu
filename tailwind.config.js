/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-card': 'var(--bg-card)',
        ink: 'var(--ink)',
        'ink-light': 'var(--ink-light)',
        cinnabar: {
          DEFAULT: 'var(--cinnabar)',
          dark: 'var(--cinnabar-dark)',
        },
        gold: 'var(--gold)',
        line: 'var(--border)',
        'mu-lu': 'var(--mu-lu)',
        'mu-quan': 'var(--mu-quan)',
        'mu-ke': 'var(--mu-ke)',
        'mu-ji': 'var(--mu-ji)',
      },
      fontFamily: {
        serif: 'var(--serif)',
        kai: 'var(--kai)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        card: 'var(--shadow)',
      },
      backgroundImage: {
        'grad-btn': 'var(--grad-btn)',
        'grad-line': 'var(--grad-line)',
      },
    },
  },
  plugins: [],
};
