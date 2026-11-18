# dsa-by-steps

An interactive course that teaches data structures and algorithms by animating them step by step, then has the learner implement them in TypeScript against tests.

## Language

### Curriculum

**Course**:
The whole body of content: every Module in a fixed order.
_Avoid_: App, site, syllabus

**Module**:
An ordered group of Lessons on one family of ideas, such as "Foundations" or "Trees".
_Avoid_: Chapter, section, unit

**Lesson**:
One topic taught as a sequence of Steps and finished by one Exercise.
_Avoid_: Page, tutorial, chapter

**Step**:
One moment in a Lesson: a Scene plus a Caption, optionally carrying a Check.
_Avoid_: Slide, frame, stage

**Caption**:
The prose shown beside a Step, written once per Locale.
_Avoid_: Description, text, body

**Problem**:
A Step's framing of a real-world pain the Lesson's idea solves, shown as a flagged Caption.
_Avoid_: Scenario, motivation

**Outcome**:
One item on a Lesson's "what you'll learn" list.
_Avoid_: Objective, goal

**Deep Dive**:
Optional long-form reading attached to a Lesson for material that outgrows Captions.
_Avoid_: Article, appendix, extra

### Visualisation

**Structure**:
A drawable data structure instance: array, linked list, stack, queue, hash map, tree, heap, or graph.
_Avoid_: Diagram, model, shape

**Scene**:
The full visual state of one or more Structures at a single Step, including highlights and pointers.
_Avoid_: Snapshot, frame, state

**Step Event**:
An atomic, named change between Scenes, such as compare, swap, visit, link, or push.
_Avoid_: Action, operation, mutation

**Pointer**:
A labelled marker that refers to a position in a Structure, such as `i`, `head`, or `slow`.
_Avoid_: Cursor, arrow, index marker

### Checks

**Check**:
A question embedded in a Step, posed on the Scene before that Step's change and answered before the change plays.
_Avoid_: Quiz, question, test

**Predict Check**:
A Check answered by selecting an element of the Scene.
_Avoid_: Click check, hotspot

**Choice Check**:
A Check answered by picking one option from a list.
_Avoid_: Multiple choice, MCQ

**Order Check**:
A Check answered by arranging elements into the correct sequence.
_Avoid_: Drag check, sort check

**Miss**:
A wrong answer to a Check. Misses accumulate per Check.
_Avoid_: Fail, error, wrong attempt

**Reveal**:
Showing a Check's correct answer on request, offered once a Check reaches three Misses.
_Avoid_: Show answer, give up, skip

### Exercises

**Exercise**:
The coding task that closes a Lesson: Starter Code, Tests, Hints, and a Reference Solution.
_Avoid_: Challenge, problem, kata, assignment

**Starter Code**:
The typed function signature and scaffold the learner begins from.
_Avoid_: Template, boilerplate, skeleton

**Reference Solution**:
The authored correct implementation that every Test must pass and that sets the Time Budget.
_Avoid_: Answer, model solution, key

**Test**:
One input with its expected output, judged against the learner's code.
_Avoid_: Case, spec, assertion

**Visible Test**:
A Test the learner can see and execute via Run.
_Avoid_: Example, sample, public test

**Hidden Test**:
A Test executed only on Submit, covering edge cases the learner is not shown.
_Avoid_: Secret test, private test

**Complexity Test**:
A Hidden Test with a large input that must finish within the Time Budget, catching correct but too-slow solutions.
_Avoid_: Performance test, stress test, benchmark

**Time Budget**:
The maximum time a Complexity Test may take, derived as a fixed multiple of the Reference Solution's time.
_Avoid_: Timeout, limit

**Run**:
Executing the Visible Tests without recording a result.
_Avoid_: Try, execute, check

**Submit**:
Executing all Tests and recording the outcome.
_Avoid_: Grade, finish, send

**Rejection**:
A Submit where at least one Test fails. Rejections accumulate per Exercise.
_Avoid_: Fail, failed submit

**Hint**:
One of a small ordered set of nudges for an Exercise, revealed one at a time on request.
_Avoid_: Tip, clue

**Pass**:
The state of an Exercise once a Submit succeeds on every Test.
_Avoid_: Complete, solved, done

### Learner

**Learner**:
The person using the Course. There are no accounts; one browser is one Learner.
_Avoid_: User, student, player

**Progress**:
Everything recorded about a Learner: Steps seen, Check Misses and Reveals, Exercise code, Hints taken, Rejections, and Passes.
_Avoid_: Save, state, history

**Locale**:
The language a Learner reads Captions and interface text in: English or Polish.
_Avoid_: Language setting, translation

**Term**:
A data structures and algorithms word kept in English in every Locale, introduced once with its Polish equivalent.
_Avoid_: Keyword, jargon
