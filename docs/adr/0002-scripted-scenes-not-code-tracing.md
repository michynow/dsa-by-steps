# Lesson animations are scripted; Learner code is never traced

Every Scene is authored as a sequence of Step Events in the Lesson definition. The Learner's own code is judged by Tests only; its output is drawn as a Structure, but its execution is not animated. Tracing arbitrary TypeScript means instrumenting the AST or proxying every Structure, which we estimated at 3 to 5 times the cost of the rest of the system and fragile against ordinary language features.

## Consequences

- The renderer consumes Step Events, not Learner code. If tracing is ever added, a tracer only has to emit the same Step Events; nothing downstream changes.
