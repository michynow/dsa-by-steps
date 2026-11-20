# Authoring a Lesson

The procedure for adding or changing a Lesson under `src/content/`. Claude drafts, the user reviews; a Lesson merges only after review.

## Shape

```
src/content/<module-slug>/<lesson-slug>/
  lesson.ts      Lesson definition: Outcomes, Steps, Step Events, Checks
  exercise.ts    Starter Code, Visible Tests, Hidden Tests, Complexity Test, Hints, Reference Solution
  en.json        every Caption, Outcome, Check prompt, option and Hint, keyed by id
  pl.json        the same keys, translated
  index.ts       public surface consumed by the Course registry
```

Start from `src/content/_template/`. Slugs and ids (Module, Lesson, Step, Check, Outcome, element) are kebab-case English and never change once published, because they appear in URLs and stored Progress.

## Steps

1. **Pin the Lesson.** Confirm its row in `docs/curriculum.md`: core idea, Structures, Check types, Exercise, expected complexity. Done when the row matches what you are about to build. Confirm the Lesson's Story in the same row: one concrete situation the Learner can picture that the whole Lesson follows (a product, a game, an everyday task), with Structure values named after it (hiding spots, not A/B/C).
2. **Write the Outcomes.** Three to five, each observable ("Reverse a linked list in place"). Done when every Outcome is exercised by at least one Check or the Exercise.
3. **Script the Steps.** Eight to twelve Steps. Open with an Overview Step (kind explain): two or three plain sentences saying what the Structure is and what it is for, with a small drawing of a finished example and no Check. Then a Problem framed in the Story, build the idea one Step Event at a time, preview the Exercise in the Story, and close with the Use Step. Each Step introduces at most one new idea. Done when the Steps reduce to valid Scenes in the content tests.
4. **Place the Checks.** At least one Check per two Steps after the first Problem, mixing the Check types listed for the Lesson. Every Check has exactly one correct answer, and every Choice Check distractor encodes a specific misconception. Done when each Check maps to an Outcome. Each Check is posed on the Scene before its Step (ADR 0009): its prompt must not state the answer and the pre-Step Scene must not draw or highlight it; the Caption and explanation, shown after settling, carry the reasoning.
5. **Write the Exercise.** Typed Starter Code; three Visible Tests ordered simple to tricky; Hidden Tests covering empty input, single element, duplicates, and boundaries; a Complexity Test when the expected complexity is below quadratic; two or three Hints, each narrower than the last and none containing code that solves it. Done when the Reference Solution passes every Test and the naive solution fails the Complexity Test.
6. **Write English.** All prose in `en.json`. Captions are two to four short sentences, present tense, second person. Terms appear in English. Mark each Term as `[[term-id]]` in Captions. Wrap code in backticks everywhere Lesson text is shown (Captions, Key Ideas, Check prompts, options and explanations, Uses, Exercise task and Hints): identifiers such as `i`, `next` or `null`, expressions such as `prices[i] + prices[j]`, function names and literal values used as code. Give a Step a Key Idea only when it has one sentence worth keeping. The closing Use Step introduces the Uses (3–4 real systems, each accurate) and when not to choose the Structure; the player renders them under its Caption. State costs honestly: no exaggerated motivation.
7. **Translate to Polish.** Every key in `pl.json`. Terms stay English; the first use of each Term in the Course gives its Polish equivalent in parentheses. Done when the content tests report no missing or extra keys.
8. **Verify.** Run the content tests, unit tests and the Lesson in the browser end to end in both Locales and both themes. Done when every Check and the Exercise have been completed by hand at least once.

## Review checklist

The user reviews against this list:

- Every Step Event is technically correct for the Structure it acts on.
- The Steps teach the idea without needing the Deep Dive.
- No Check can be answered by elimination of absurd options.
- The Reference Solution is idiomatic TypeScript a Learner should aspire to.
- The Polish reads naturally, not as a literal translation.
