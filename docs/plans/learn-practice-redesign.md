# Plan: Learn/Practice redesign (third factory run)

Decided with the user on 2026-11-18. Builds on `factory/lesson-page`; nothing merges to `main` until the user reviews the Lesson content.

## Wave 1

- **WP-12 Content contract v2.** LessonMessages gains `story { title, summary }`, `uses: { title, body }[]`, `whenNot`, and an optional `keyIdea` per Step. A pure Caption parser turns `[[term-id]]` into text and Term segments. Validator: unknown Term in a Caption, Term without messages in a Locale, the first-use Step per Term, missing story or uses. Owns `src/content/**` except Lesson folders, plus the content tests that registered Lessons must pass (update linked-lists fixtures only if a schema change forces it).
- **WP-13 Modes and Practice.** Header Learn | Practice switch; routes `/:locale/practice` (Exercise cards per Lesson, "coming soon") and a "Practice this" button on the last Step. Remove the Exercise entry and the `code` step from the Rail and routes (redirect old `/code` URLs to Practice). Owns `src/features/lesson-player/**`, `src/app/**`, new `src/features/practice/**`, `e2e/lesson.spec.ts`.
- **WP-15 "Your turn" Checks.** A distinct Check card (its own token colour, "Your turn" label, Miss counter, Show me) and a Stage frame plus Predict banner while a Check is open. Owns `src/features/checks/**`; the Stage frame is exposed via the binding (`StepCheckBinding.framing`), so the player change is one prop.

## Wave 2

- **WP-14 Term Chips and Key Idea.** TermChip with an accessible popover (button, aria-expanded, Escape closes, focus returns), a "new" marker on first use, a Key Idea callout, and a Terms panel listing Terms introduced up to the current Step. Owns a new `src/features/terms/**` plus the Caption rendering in the player.
- **WP-16 Linked lists as a play queue.** Rewrite the Lesson around a music app's play queue: songs as node values, Problem = "Play next" freezes on a 10,000-song array queue, Steps for play next / remove from queue / jump to song 500, Term markup, Key Ideas, and a closing Use Step (undo history, browser back/forward, LRU cache, OS process list) with when not to choose a list. Owns `src/content/foundations/linked-lists/**`. The user reviews EN and PL before merge.

## Standing brief rules

Adversarial cases listed; red evidence is an assertion failure; reviewers do mutation review; UI packages run `pnpm test:e2e:stress` before merge; each package owns the shared tests it invalidates.
