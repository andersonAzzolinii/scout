const plugin = require('tailwindcss/plugin');

// GlueStack v3 plugin: adds data-[state=value]: variant support with correct specificity ordering
const gluestackPlugin = plugin(function ({ matchVariant }) {
  const stateWeights = {
    indeterminate: 1, checked: 1, 'read-only': 1, flip: 1,
    required: 2, invalid: 2,
    focus: 3,
    'focus-visible': 4,
    hover: 5,
    pressed: 6, active: 6,
    loading: 7,
    disabled: 10,
  };
  matchVariant(
    'data',
    (_value) => {
      if (!_value.includes('=')) return '&';
      const [state, value] = _value.split('=');
      return `&[data-${state}="${value}"]`;
    },
    {
      sort(a, z) {
        const getWeight = (v) => stateWeights[v.split('=')[0]] || 0;
        return getWeight(a.value) - getWeight(z.value);
      },
    }
  );
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        court: {
          green: '#2d5a27',
          line: '#ffffff',
        },
      },
    },
  },
  plugins: [gluestackPlugin],
};
