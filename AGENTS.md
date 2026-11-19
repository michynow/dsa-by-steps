# AGENTS.md

dsa-by-steps is a static, client-only course that animates data structures and algorithms step by step and then has the Learner implement them in TypeScript against Tests.

## Read first

- `CONTEXT.md` is the ubiquitous language. Use its terms verbatim in code, tests, file names, commits and conversation. When a term you need is missing or fuzzy, stop and resolve it with the user, then add it to `CONTEXT.md` before writing code that uses it.
- `docs/adr/` records the architectural decisions. Read the relevant ADRs before touching runtime, persistence, i18n, content format, or Exercise judging. A change that contradicts an ADR needs a new ADR that supersedes it, agreed with the user first.
- `docs/curriculum.md` is the Course map and build order.
- `docs/layout.md` fixes the page structure: Shell, Step Rail, Stage, Caption Strip, Exercise view, keyboard map. Follow it for any change to `src/app/` or a feature's page-level components.
- `docs/authoring.md` is the procedure for writing or changing a Lesson. Follow it for any change under `src/content/`.

## Architecture

The codebase is layered. Each layer has one job and depends only on the layers listed after it.

```
src/
  app/        composition root: router, providers, shell layout, route modules
  features/   vertical slices that wire domain + renderer + runner into UI
    lesson-player/  steps, timeline, step card, keyboard navigation
    checks/         Predict, Choice and Order Check components
    exercise/       editor, Run/Submit, Test results, Hints, Reveal of the Reference Solution
    progress/       Progress hooks, export and import
    locale/         Locale detection, switching, message loading
    search/         Lesson and Term search
  renderer/   pure SVG rendering of Structures and Scenes; no app state
  runner/     Worker protocol, transpilation, Test harness, Time Budget measurement
  domain/     framework-free types and logic: Course, Lesson, Step, Step Event, Scene reduction, Check judging, Progress model
  content/    Lessons, one folder each, typed against domain
  ui/         design-system primitives and tokens
```

Dependency direction, enforced by lint and never bypassed:

- `domain` imports nothing from `src`.
- `ui` imports nothing from `src`.
- `renderer` imports `domain` and `ui`.
- `runner` imports `domain`.
- `content` imports `domain` types only.
- `features/*` import `domain`, `renderer`, `runner`, `ui`, and `content` through its public index. A feature imports another feature only through that feature's `index.ts`.
- `app` imports anything.

Each folder exposes a deliberate public surface through `index.ts`. Deep imports across folder boundaries are a lint error.

## Design principles

- **Deep modules.** Small interfaces hiding substantial behaviour. A module earns its existence by what it hides; a pass-through wrapper gets inlined.
- **Pure core, thin shell.** Scene reduction, Check judging, Progress transitions and Time Budget arithmetic are pure functions in `domain` and `runner`, tested without React or a browser. Components translate events into domain calls and render results.
- **Discriminated unions everywhere a kind varies.** Step Events, Checks, Structures, Worker messages and Test outcomes are tagged unions handled with exhaustive `switch` statements ending in a `never` assertion. Adding a variant must fail compilation at every site that has to handle it.
- **Parse at the boundary.** Data crossing a trust boundary (stored Progress, imported Progress files, Worker messages, Learner code output) is validated with a `zod` schema into a domain type once, at the edge. Inside the boundary, types are trusted. Boundary tests cover every rejection path and assert its exact issue text, including present-but-undefined fields and values just outside each range.
- **Ports and adapters for anything replaceable.** Progress persistence is a `ProgressRepository` interface with a browser-storage adapter; the Test runner is an `ExerciseRunner` interface with a Worker adapter. Features depend on the interface, and the composition root picks the adapter.
- **Errors are values in the domain.** Expected failures (a Test fails, a Time Budget is exceeded, an import file is malformed) are returned as typed results. `throw` is reserved for programmer errors. Each error variant carries the identifiers needed to explain it without the original input (which Structure, Module, Lesson, index, namespace).
- **Immutability by default.** `readonly` types, no mutation of props, state or domain values.

## Code style

- Code carries its intent through names, types and structure. Source files contain no comments. Rationale lives in `docs/adr/`, vocabulary in `CONTEXT.md`, procedures in `docs/`; code never cites ADRs or docs.
- TypeScript runs in its strictest practical configuration: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`. No `any`, no non-null assertions, no type assertions outside tests and parse boundaries.
- Named exports only. One React component per file, file named after the component in PascalCase; non-component modules in kebab-case.
- Styling uses CSS Modules co-located with components, built only from the design tokens in `ui/tokens`. Every token has a light and a dark value. Raw colours, spacing or font sizes in component styles are a lint error.
- Interface text and Captions come only from Locale message files. A string literal rendered to the Learner is a bug.
- Every union value shown to the Learner (Structure kinds, tones, statuses) has an entry in a typed label map (`Record<Union, string>`), so adding a variant fails compilation until it is labelled.
- Functions stay small and do one thing. A function that needs a comment to explain a block gets that block extracted under a name that explains it.

## State

- Server-free. Client state is local component state first, then a feature-scoped store when several components share it.
- Shared stores use Zustand with selectors. Progress is the single persisted store, written through `ProgressRepository`. Its stored shape carries a schema version and a migration chain.
- URL is state: the current Module, Lesson and Step live in the route (`/:locale/:module/:lesson/:step`) so every position is linkable and back/forward work.

## Runner rules

- Learner code runs only inside a Web Worker, never on the main thread.
- Every Run and Submit uses a fresh Worker, terminated on completion or when its wall-clock limit expires.
- The Reference Solution is timed in the same Worker before the Learner's code to derive the Time Budget for Complexity Tests.
- The Worker protocol is a versioned tagged union defined in `runner` and validated on both sides.

## Accessibility

Keyboard-complete: every Step, Check (including Order Checks) and Exercise action works without a pointer. Scenes expose a text description of the current state to assistive technology. Motion respects `prefers-reduced-motion`. Contrast meets WCAG AA in both themes.

## Testing

- **Vitest** for `domain`, `runner`, `renderer` and `content`.
- **React Testing Library** for feature components, queried by role and accessible name.
- **Playwright** for end-to-end flows: complete a Lesson, answer each Check type, Pass an Exercise, switch Locale, export and import Progress.
- **Content tests** run every Lesson's Reference Solution against all its Tests, assert every Locale defines every message key, and assert every Step's Step Events reduce to a valid Scene.
- A behaviour change without a test that fails before it and passes after is unfinished.
- Assert whole values: `toEqual` on the full Result, Scene or error, never only `.ok`, a length or an occurrence count. Type tests prove types with annotations and `expectTypeOf`, not casts.
- Tests outside `src/content` never hard-code Lesson wording, Step numbers or Check positions; derive them from the registered content.
- Test builders shared by several test files live in `src/test/`. Only `*.test.ts(x)` files may import them; production source never contains test helpers.

## Workflow

- Package manager: `pnpm`. Discover scripts in `package.json`; `pnpm check` is the full local gate.
- End-to-end runs build and serve their own preview and never reuse a running server. Parallel worktrees set a unique `E2E_PORT` (e.g. `E2E_PORT=4290 pnpm test:e2e`).
- CSS Module typings (`*.module.d.css.ts`) are generated and gitignored. `pnpm typecheck` regenerates them; run it after adding or renaming a class.
- TypeScript stays on the newest version `typescript-eslint` supports, which may lag the latest release.
- Before declaring work done, run typecheck, lint, unit tests and content tests, and report their actual output.
- Commits follow Conventional Commits, scoped by layer or feature: `feat(renderer): draw linked list pointers`.
- After a review of a commit or branch surfaces findings, run `/retro` on that commit to trace each finding to the gap in docs, tooling or tests that let it through.
