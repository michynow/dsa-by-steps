# Plan: finish Module 1 (fifth factory run)

Four Lessons, each with Steps, Checks, a Story, Uses and an Exercise, modelled on `src/content/foundations/linked-lists/` (read it first: lesson.ts, en.json, pl.json, exercise.ts, index.ts). Course order in `foundations`: Big-O, Arrays and two pointers, Linked lists, Stacks and queues, Hash maps.

## Rules every Lesson package follows

- Follow docs/authoring.md step by step, ADR 0004 (EN source, natural PL, Terms in English), ADR 0009 (Checks posed on the pre-Step Scene; no answer drawn, highlighted or stated before answering), ADR 0010 (the Exercise lives in Practice; no Exercise Step in the Rail).
- 10–13 Steps, one idea each; a Problem Step framed in the Story; a closing Use Step; Key Ideas on 4–6 Steps; `[[term]]` markers at each Term's first use, identical placement EN/PL.
- At least 6 Checks mixing Predict and Choice (no Order Checks yet); every Choice option shares the form "<answer>, because <reason>"; every distractor is a real misconception; every Outcome is exercised by a Check.
- Structures drawn: only array, linked-list, stack, queue and hash-map, at most 6–8 elements each, short values named after the Story.
- story { title, summary }, exactly 4 accurate Uses, an honest whenNot. Every factual claim (costs, real-world uses) technically accurate; no exaggerated motivation.
- Exercise: functionName, typed Starter Code that compiles, an idiomatic Reference Solution with the stated complexity, exactly 3 Visible Tests (simple to tricky), 5–7 Hidden Tests (empty, single, duplicates, boundaries, a generated large case), a Complexity Test (size ≥ 1000, budgetMultiple 5–10) whose naive solution would be too slow, hintCount 3 with hints narrowing and never containing a solution, exercise messages EN/PL in the Story.
- Write no new tests. The existing content tests validate everything (content issues, schema, Reference Solution against its Tests and its own Complexity Test); `pnpm check` must be green with zero content issues.
- Register the Lesson in `src/content/foundations/index.ts` (add your import and your entry; the orchestrator fixes the final order and any merge conflict there).

## Packages

- **WP-22 Stacks and queues** (`stacks-and-queues`). Story: a text editor's undo (stack) and an office print queue (queue). Structures: stack, queue. Exercise `isBalanced(code: string): boolean` — the editor checks that (), [] and {} in a line of code are balanced; other characters ignored; O(n); Complexity Test on a generated balanced string of length ≥ 100000 using shape 'value'.
- **WP-23 Hash maps** (`hash-maps`). Story: checking whether a username is taken at sign-up; buckets and collisions (linking back to the Linked lists Use "collision chains"). Structures: hash-map, array. Exercise `firstDuplicate(usernames: string[]): string | null` — the first username registered twice, by the position of its second registration; O(n) expected; Complexity Test generator `range` turned into strings inside the Reference? (Generators produce numbers: type it `firstDuplicate(usernames: (string | number)[])` only if needed; prefer a value-shaped generated array of numbers and document it.)
- **WP-24 Arrays and two pointers** (`arrays-and-two-pointers`). Story: a gift card balance and a sorted price list; find two prices that add up exactly. Structures: array with two Pointers. Exercise `twoSumSorted(prices: number[], balance: number): [number, number] | null` returning indices; O(n) two pointers expected; Complexity Test on range input.
- **WP-25 Big-O** (`big-o`). Story: a shop's search box that is instant with 100 products and crawls with 100,000. Structures: array. Teach constant, linear, quadratic growth by counting steps; Checks on which cost grows how. Exercise `countPairsWithSum(prices: number[], target: number): number` — count unordered pairs (i < j) summing to target; O(n) with a hash map expected (naive O(n²) must fail the Complexity Test).
