# React + Vite + Tailwind CSS

This project is configured to use Tailwind CSS (v4) with Vite and React.

## Getting Started

1. Install dependencies:
   - npm install
2. Start the dev server:
   - npm run dev

## Tailwind Setup (v4)

- PostCSS is configured in `postcss.config.js` with `tailwindcss` and `autoprefixer`.
- Tailwind is enabled by importing it in `src/index.css`:
  
  @import "tailwindcss";

- You can customize design tokens with the new v4 CSS-first API using `@theme` inside your CSS files. Example:

  @theme {
    --color-brand: #2563eb;
  }

  .btn-brand { @apply bg-[--color-brand] text-white font-semibold px-4 py-2 rounded-lg; }

- See `src/App.jsx` for a small demo using Tailwind utility classes.

For more details, see the Tailwind docs: https://tailwindcss.com/docs
