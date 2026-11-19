# The exercise judge resists accidents, not determined cheating

Progress lives in the Learner's own browser (ADR 0003), so a Learner can always write a Pass by hand; full isolation of Learner code (a separate realm or iframe sandbox) would cost a large runtime and complexity for no real protection. The judge therefore aims to be correct and hard to fool by accident: it captures the built-ins it relies on before Learner code runs, tags every Worker message with a per-run nonce, recomputes the verdict on the main thread, times result materialisation, and never trusts a report it did not ask for.

## Consequences

- Each Test streams its outcome with a per-Test watchdog, so a hang names the stuck Test and keeps earlier outcomes.
- The Complexity Test runs in its own Worker with a watchdog derived from the Reference's measured budget, so a quadratic solution reports "too slow" instead of a bare timeout.
- The Time Budget has a 50 ms floor: for very fast References the floor, not the 5–10× multiple, decides, to keep the verdict stable across machines.
