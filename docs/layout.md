# Layout

The page structure every screen follows. Visual tokens live in `src/ui/tokens`; this document fixes arrangement and behaviour.

## Shell

```
┌ header ──────────────────────────────────────────────────────────┐
│ dsa-by-steps  [Learn|Practice]  <Module> · n/m ▮▮▯  ⌕ EN/PL ◐ │
└──────────────────────────────────────────────────────────────────┘
```

- Left: the Course name, linking to the Course home in the current Locale.
- Centre: on Lesson pages only, the Module name, Lesson position and a segmented bar with one segment per Lesson in the Module, filled for Lessons with a Pass.
- A Learn | Practice mode switch (ADR 0010).
- Right: search, Locale switch, theme switch.
- The header carries no external or social links.

## Lesson page

```
┌ Step Rail ┐ ┌ Stage ─────────────────────────────────────────────┐
│ ✓ 1 Why   │ │                                                    │
│ ✓ 2 Node  │ │          animated Structures for the Step          │
│ ● 4 Insert│ │                                    [replay][legend]│
│ ○ 5 Delete│ └────────────────────────────────────────────────────┘
│ ○ 6 ...   │ ┌ Caption Strip ─────────────────────────────────────┐
│           │ │ Caption or Check prompt and answers        ‹  ›    │
└───────────┘ └────────────────────────────────────────────────────┘
 [Outcomes ▾] [Terms ▾]
```

- **Step Rail.** A vertical list of every Step by number and short title. Steps with a Check carry a "Your turn" marker. Each entry shows seen, current or unseen; a Problem Step carries a marker. Entries are links, so every Step is reachable directly. On narrow screens the Rail collapses to a horizontal strip of numbers above the Stage.
- **Stage.** The Scene for the current Step, animated from the previous Step's Scene. Predict and Order Checks are answered here, on the Structure itself.
- **Caption Strip.** Directly under the Stage. Holds the Caption with Term Chips and an optional Key Idea callout. A Step with an open Check shows instead a "Your turn" card in its own colour (prompt, Choice options, Miss counter, Reveal), and the Stage gets a matching frame and a Predict banner. The last Step ends with a "Practice this" button. Previous and next sit at its right edge; next is unavailable while a Check on the current Step is unanswered.
- **Outcomes and Terms.** Collapsed panels under the Strip: the Lesson's Outcomes and its Terms with their Polish equivalents. Outcome status and "Terms introduced so far" need an Outcome→Check and Term→Step mapping in the content contract, which does not exist yet.

## Practice

The Practice mode lists one Exercise card per Lesson (marked "coming soon" until the runner exists). Opening an Exercise shows:

```
┌ Editor ───────────────────────────┐ ┌ Tests ───────────────────────┐
│ Starter Code / Learner code       │ │ Visible Test results, drawn  │
│                                   │ │ as Structures: input,        │
│                                   │ │ expected, actual             │
└───────────────────────────────────┘ └──────────────────────────────┘
 [Run] [Submit]   Hint 1/3 ▸   Reference Solution (locked)
```

On narrow screens Editor and Tests stack, and a notice recommends a wider screen without blocking the Exercise.

## Keyboard

- `←` / `→`: previous and next Step.
- `Enter`: submit the focused Check answer.
- `Mod+Enter` in the Editor: Run. `Mod+Shift+Enter`: Submit.

## Term Chips

A Term written as `[[term-id]]` in a Caption renders as a chip in the Term colour. Click, tap, Enter or Space opens its definition (Polish equivalent in Polish); Escape or a second activation closes it, and it closes when the Step changes. The first use in a Lesson carries a "new" marker. The Terms panel lists the Terms introduced up to the current Step.
