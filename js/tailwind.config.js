/**
 * Configuración del tema de Tailwind (CDN).
 * Debe cargarse DESPUÉS de https://cdn.tailwindcss.com.
 */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'brutal-yellow': '#FFE600',
        'brutal-cyan': '#00F0FF',
        'brutal-pink': '#FF007A',
        'brutal-green': '#00FF66',
        'brutal-bg': '#F4F0EA',
        'brutal-card': '#FFFFFF',
        'brutal-dark': '#000000',
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #000000',
        'brutal-lg': '7px 7px 0px 0px #000000',
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal-hover': '10px 10px 0px 0px #000000',
      },
    },
  },
};
