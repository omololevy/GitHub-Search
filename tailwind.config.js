/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: 'var(--primary)',
                secondary: 'var(--secondary)',
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                surface: 'var(--surface)',
                accent: 'var(--accent)',
                muted: 'var(--muted)',
                card: 'var(--card)',
                border: 'var(--border)',
            },
            boxShadow: {
                'soft': '0 2px 15px 0 rgb(0 0 0 / 0.05)',
                'soft-lg': '0 4px 25px 0 rgb(0 0 0 / 0.05)',
            },
        },
    },
    plugins: [],
}
