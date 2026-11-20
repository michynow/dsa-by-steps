# Retro: fifth factory run (Module 1)

Range `05e31d2..HEAD` on `factory/module-1`: Hash maps, Stacks and queues, Linked lists treasure hunt, Big-O, Arrays and two pointers, the course home.

| Finding | How it got through | Guardrail added |
| --- | --- | --- |
| Hash map Steps ended looking unchanged: each Step cleared its own highlights as its last event | The Check-scene rules pushed authors to clean up at the end of a Step, and nothing showed the last frame of a Step | Every Step now starts with highlights cleared (`stepStartScene`), so Steps keep their emphasis at the end |
| Big-O and Arrays timing tests called a two-argument function with one argument, and one task text told the Learner to cope | Generators produced exactly one argument, and no rule compared that with the Tests | `extraArgs` on the Complexity Test, plus the `complexity-arity-mismatch` content rule |
| End-to-end test failed after Back: ArrowLeft reused a move queued before the navigation | The queued move was cleared only when the rendered Step changed, not when the location changed | The queued move is dropped on any other location change |
| Subagents stopped mid-run on the spend limit, and a review was lost | No fallback when an agent dies before handing back | Orchestrator reviews content itself when a reviewer cannot finish; briefs still require WIP commits |
