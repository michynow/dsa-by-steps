# Static single-page app on Vite and React

The Course is a client-rendered React single-page app built with Vite and deployed as static files. Every meaningful surface (the renderer, Checks, the editor, the Test runner) is interactive and runs client-side, so server rendering would add a framework layer without serving content any differently.

## Considered Options

- **Next.js (static export)**: file routing and better crawlability, but every interactive surface would be a client component anyway.
- **Astro with React islands**: a strong fit for content-heavy pages; rejected to keep one rendering model. Revisit if search-engine traffic to Lessons becomes a goal.
