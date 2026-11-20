# DSA by steps

**Watch data structures and algorithms move one step at a time, then build them yourself in TypeScript.**

Live: **https://dsa-by-steps.vercel.app**

DSA by steps is a free, browser-only course on data structures and algorithms. Every Lesson follows one concrete situation, such as a treasure hunt of clues, a sign-up form checking usernames or a broken build hiding in a long commit history. It animates the idea Step by Step and asks you to predict what happens next. Then you write the real thing in an in-browser editor, and Tests judge both whether it is correct and whether it is fast enough.

No account, no server. Your progress lives in your browser.

## How a Lesson works

**Learn** walks through the idea on a Stage:

- **Steps.** Each Step introduces one idea. Arrays, linked lists, stacks, queues and hash maps are drawn as SVG and animate as the Step plays. Pointers such as `left`, `right`, `lo`, `mid` and `hi` move across them.
- **Your turn.** Before some Steps play, a Check asks you to predict the outcome, either by choosing an answer or by picking the element on the Stage. A wrong answer lets you retry, and after three misses you can ask to be shown.
- **Terms.** New vocabulary appears as Term chips with a short definition the first time it shows up.
- **Uses.** Each Lesson ends with where you meet the structure in real systems, and when you should pick something else.

**Practice** is where you write code:

- **Examples and editor.** You get example calls and a TypeScript editor (Monaco) with typed Starter Code.
- **Run and Submit.** **Run** checks the visible Tests. **Submit** adds hidden Tests and a Complexity Test that fails solutions that are correct but too slow, such as an O(n²) loop where O(n) is expected.
- **Hints and solution.** Hints narrow down step by step. The Reference Solution unlocks after a pass or three rejected Submits.

The whole interface is available in English and Polish, works with the keyboard alone, follows your light or dark theme and respects reduced-motion settings.

## Course

| Module                     | Lessons                                                                        |
| -------------------------- | ------------------------------------------------------------------------------ |
| 1. Foundations             | Big-O · Arrays and two pointers · Linked lists · Stacks and queues · Hash maps |
| 2. Searching and recursion | Binary search · Recursion · Sliding window · Prefix sums                       |

Sorting, trees, graphs, dynamic programming and common patterns are planned next. The full map is in [docs/curriculum.md](docs/curriculum.md).

## Running it locally

You need Node 24 or newer and pnpm.

```bash
pnpm install
```

```bash
pnpm dev
```

Then open the URL Vite prints.

| Command         | What it does                                                           |
| --------------- | ---------------------------------------------------------------------- |
| `pnpm dev`      | Start the dev server                                                   |
| `pnpm build`    | Type-check and build to `dist/`                                        |
| `pnpm check`    | Full local gate: typecheck, lint, format check, unit and content tests |
| `pnpm test:e2e` | Playwright end-to-end tests against a fresh production build           |

## How it's built

A static Vite + React + TypeScript single-page app, deployed on Vercel.

- **Learner code is sandboxed.** It is transpiled in the browser and runs inside a fresh Web Worker for every Run and Submit, never on the main thread. Each Test has a time limit. The Complexity Test times the Reference Solution first and gives your code a budget relative to it.
- **Lessons are data.** Each Lesson is a typed module of Steps and Step Events, plus one JSON file per language for every Caption, Check and Hint. Content tests validate every Lesson: that Checks don't give their answer away, that both languages have the same keys and Term markers, and that the Reference Solution passes its own Tests and Complexity Test.
- **The code is layered.** `domain` holds pure logic, `renderer` draws SVG, `runner` runs the Worker judge, `features` are the UI slices, `content` holds the Lessons and `app` puts them together. Lint enforces the import direction between layers.

Read more:

- [AGENTS.md](AGENTS.md): architecture, code style and workflow rules
- [CONTEXT.md](CONTEXT.md): the project's vocabulary (Lesson, Step, Scene, Check, Exercise…)
- [docs/adr/](docs/adr/): architectural decisions and why they were made
- [docs/authoring.md](docs/authoring.md): how to write a new Lesson
