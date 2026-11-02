const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        raised: token('raised'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        accent: token('accent'),
        'accent-soft': token('accent-soft'),
        'accent-tint': token('accent-tint'),
        'on-accent': token('on-accent'),
        lavender: token('lavender'),
        'lavender-ink': token('lavender-ink'),
        mist: token('mist'),
        danger: token('danger'),
        'danger-tint': token('danger-tint'),
        'on-danger': token('on-danger'),
        warning: token('warning'),
        'warning-tint': token('warning-tint'),
        success: token('success'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / 0.05), 0 8px 24px -14px rgb(var(--shadow) / 0.22)',
        lift: '0 2px 6px rgb(var(--shadow) / 0.08), 0 24px 56px -24px rgb(var(--shadow) / 0.35)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
};
