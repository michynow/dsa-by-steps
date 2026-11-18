# Lessons are typed TypeScript modules with per-Locale message files

A Lesson is a folder: a typed definition holding Steps, Step Events and Checks; one message file per Locale holding every Caption by key; and an Exercise module holding Starter Code, Tests, Hints and the Reference Solution. Behaviour is type-checked and written once, while prose is isolated so translation is a clean diff and missing keys are detectable at build time. Deep Dives, when they appear, are MDX per Locale and embed the same renderer.

## Considered Options

- **MDX per Locale for everything**: pleasant for long prose, but Step Events and Checks would be duplicated across Locales and drift.
- **One TypeScript object with inline prose**: simplest, but prose in string literals is painful to write, review and translate.
