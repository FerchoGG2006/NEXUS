/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                neon: {
                    cyan: 'var(--neon-cyan)',
                    purple: 'var(--neon-purple)',
                    green: 'var(--neon-green)',
                }
            }
        },
    },
    plugins: [],
}
