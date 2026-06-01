const colors = require('tailwindcss/colors');

// Luna theme — dark slate surface palette. The whole panel references the
// `neutral`/`gray` scale, so overriding it here re-skins the majority of the UI.
const gray = {
    50: '#f8fafc',
    100: '#eef0f5',
    200: '#c5cad6',
    300: '#9aa1b1',
    400: '#6b7280',
    500: '#414856',
    600: '#272c37',
    700: '#171a21',
    800: '#0f1217',
    900: '#0a0c10',
};

// Luna accent — indigo/blue used for buttons, active states and the logo.
const indigo = {
    50: '#eef0ff',
    100: '#e0e2ff',
    200: '#c3c7ff',
    300: '#9ba1ff',
    400: '#7c83ff',
    500: '#5b63f5',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
};

module.exports = {
    content: ['./resources/scripts/**/*.{js,ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                header: ['"IBM Plex Sans"', '"Roboto"', 'system-ui', 'sans-serif'],
            },
            colors: {
                black: '#0a0c10',
                // "primary" and "neutral" are deprecated upstream, but the panel
                // still uses them everywhere — alias them to the Luna palette.
                primary: indigo,
                blue: indigo,
                indigo: indigo,
                gray: gray,
                neutral: gray,
                cyan: indigo,
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            transitionDuration: {
                250: '250ms',
            },
            borderRadius: {
                xl: '0.875rem',
                '2xl': '1.125rem',
            },
            borderColor: (theme) => ({
                default: theme('colors.neutral.600', 'currentColor'),
            }),
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ],
};
