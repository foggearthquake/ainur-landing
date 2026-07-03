// Tailwind v4 runs only on CSS that opts in via `@import "tailwindcss"`.
// The main gabdra.pw styles (globals.css + *.module.css) don't import it,
// so they pass through untouched — Tailwind is scoped to app/site/site.css.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
