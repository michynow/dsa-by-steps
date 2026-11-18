# Exercises are TypeScript, executed in a browser Web Worker

Exercises are written and run in TypeScript entirely client-side: the editor type-checks, the code is transpiled in the browser, and Tests execute inside a dedicated Web Worker that is terminated when it exceeds its time limit. TypeScript runs natively in the browser with no download beyond the compiler, matches what most Learners use day to day, and keeps the Course fully static.

## Considered Options

- **Python via Pyodide**: closer to interview convention, but a ~10 MB runtime and slow cold start on every Lesson.
- **Server-side sandbox**: any language, but needs a backend, isolation, and running cost, which contradicts the static deployment.

## Consequences

- Untrusted Learner code never runs on the main thread; every Run and Submit spawns a fresh Worker so state cannot leak between attempts.
- Adding a second language later means a second runner behind the same runner interface, not a rewrite.
