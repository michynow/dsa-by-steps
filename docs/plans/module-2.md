# Plan: Module 2, Searching and recursion (sixth factory run)

Module slug `searching-and-recursion`, registered empty in `src/content/registry.ts`. Course order: Binary search, Recursion, Sliding window, Prefix sums. Every package follows the "Rules every Lesson package follows" in `docs/plans/module-1.md`, with these additions:

- Steps start with highlights cleared automatically; never end a Step with `clear-highlights`.
- A Complexity Test passes every argument the Tests pass: the generated one first, the rest through `extraArgs` (the `complexity-arity-mismatch` rule enforces this).
- The naive solution must exceed the Time Budget, whose floor is 50 ms. Verify by timing the naive solution in Node on the Complexity Test input and report the number; it should take at least 150 ms.

## Packages

- **WP-28 Binary search** (`binary-search`). Story: finding the commit that broke the build among a long history, by halving. Structures: array with lo, mid and hi Pointers. Teach halving, the loop invariant and off-by-one boundaries. Exercise of the implementer's design in the Story, O(log n) per lookup; because one O(log n) call cannot beat the 50 ms floor, make the Exercise answer many lookups (an array of queries via `extraArgs`) so the naive linear scan fails.
- **WP-29 Recursion** (`recursion`). Story: listing every file in nested folders. Structures: a stack drawn as the call stack (one frame per call, pushed on entry, popped on return) and an array for the result. Teach base case, recursive case, the call stack and stack overflow. Exercise over a nested folder object (JSON), e.g. total size of all files; O(n) in the number of entries. No Complexity Test is needed if no generator fits; Hidden Tests include a deep and a wide folder built in exercise.ts.
- **WP-30 Sliding window** (`sliding-window`). Story: the busiest 5-minute window in a server log. Structures: array with left and right Pointers and highlights for the window. Fixed window first, then a variable window. Exercise O(n).
- **WP-31 Prefix sums** (`prefix-sums`). Story: sales totals between any two dates on a dashboard. Structures: two arrays (daily sales and running totals). Exercise answers many range queries in O(n + q).
