/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f2f2f7', // fondo gris iOS
        card: '#ffffff', // tarjetas
        dark: '#1c1c1e', // tarjeta balance
        green: '#34c759', // ingresos
        red: '#ff3b30', // gastos
        blue: '#007aff', // selección
        ink: '#000000', // texto principal
        ink2: '#8e8e93', // texto secundario
        sep: '#e5e5ea', // separadores
        // Variantes "vivid" para números sobre la tarjeta oscura
        'green-vivid': '#32d74b',
        'red-vivid': '#ff453a',
      },
      borderRadius: {
        14: '14px',
        18: '18px',
        22: '22px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      boxShadow: {
        sheet: '0 -8px 40px rgba(0,0,0,0.18)',
        card: '0 1px 3px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
