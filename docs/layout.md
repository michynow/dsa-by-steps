# Layout

The page structure every screen follows. Visual tokens live in `src/ui/tokens`; this document fixes arrangement and behaviour.

## Shell

```
┌ header ──────────────────────────────────────────────────────────┐
│ dsa-by-steps          <Module> · Lesson n/m  ▮▮▮▯▯     ⌕  EN/PL  ◐ │
└──────────────────────────────────────────────────────────────────┘
```

- Left: the Course name, linking to the Course home in the current Locale.
- Centre: on Lesson pages only, the Module name, Lesson position and a segmented bar with one segment per Lesson in the Module, filled for Lessons with a Pass.
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
│ { } Code  │ │ Caption or Check prompt and answers        ‹  ›    │
└───────────┘ └────────────────────────────────────────────────────┘
 [Outcomes ▾] [Terms ▾]
```

- **Step Rail.** A vertical list of every Step by number and short title, ending with the Exercise. Each entry shows seen, current or unseen; a Problem Step carries a marker. Entries are links, so every Step is reachable directly. On narrow screens the Rail collapses to a horizontal strip of numbers above the Stage.
- **Stage.** The Scene for the current Step, animated from the previous Step's Scene. Predict and Order Checks are answered here, on the Structure itself.
- **Caption Strip.** Directly under the Stage. Holds the Caption, or the Check prompt with Choice options, Miss feedback and the Reveal button. Previous and next sit at its right edge; next is unavailable while a Check on the current Step is unanswered.
- **Outcomes and Terms.** Collapsed panels under the Strip: the Lesson's Outcomes and its Terms with their Polish equivalents. Outcome status and "Terms introduced so far" need an Outcome→Check and Term→Step mapping in the content contract, which does not exist yet.

## Exercise view

Selecting the final Rail entry keeps the Rail and swaps the Stage and Caption Strip for:

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
