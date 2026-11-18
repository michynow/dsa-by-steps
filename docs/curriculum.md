# Curriculum

The full Course map. Module 1 is the first build target; later Modules are planned in order but not committed in detail. Each Lesson lists its core idea, the Structures it draws, the Check types it leans on, and its Exercise.

Status: `building` · `planned`

## Module 1 — Foundations `building`

| #   | Lesson                  | Core idea                                                        | Structures             | Checks          | Exercise                                                      | Expected |
| --- | ----------------------- | ---------------------------------------------------------------- | ---------------------- | --------------- | ------------------------------------------------------------- | -------- |
| 1   | Big-O                   | Count work as input grows; drop constants and lower terms        | array                  | Choice, Predict | `countPairsWithSum(nums, target)`, naive first, then improved | O(n)     |
| 2   | Arrays and two pointers | Contiguous memory, O(1) index; converge pointers on sorted input | array + pointers       | Predict, Order  | `twoSumSorted(nums, target)`                                  | O(n)     |
| 3   | Linked lists            | Nodes and links; O(1) insert at a known node, O(n) access        | linked list + pointers | Predict, Order  | `reverseList(head)`                                           | O(n)     |
| 4   | Stacks and queues       | LIFO vs FIFO; the operations define the structure                | stack, queue           | Order, Choice   | `isBalanced(brackets)`                                        | O(n)     |
| 5   | Hash maps               | Hash to bucket, handle collisions, amortised O(1) lookup         | hash map (buckets)     | Predict, Choice | `firstDuplicate(nums)`                                        | O(n)     |

## Module 2 — Searching and recursion `planned`

1. Binary search: halving a sorted range; off-by-one boundaries.
2. Recursion: the call stack as a Structure; base and recursive cases.
3. Sliding window: fixed and variable windows over arrays and strings.
4. Prefix sums: precompute once, answer range queries in O(1).

## Module 3 — Sorting `planned`

1. Elementary sorts: bubble, selection, insertion; stability.
2. Merge sort: divide, conquer, merge; O(n log n) proof by recursion tree.
3. Quick sort: partitioning schemes; worst case and randomised pivots.
4. Counting and radix sort: beating the comparison lower bound.

## Module 4 — Trees `planned`

1. Binary trees: shape, depth, the four traversals.
2. Binary search trees: search, insert, delete; degenerate shapes.
3. Balanced trees: rotations and why height matters (AVL as the worked example).
4. Heaps and priority queues: sift up, sift down, heapify in O(n).
5. Tries: prefix lookup over a character alphabet.

## Module 5 — Graphs `planned`

1. Representations: adjacency list vs matrix.
2. Breadth-first search: layers, shortest path in unweighted graphs.
3. Depth-first search: recursion and explicit stacks, cycle detection.
4. Topological sort: dependency ordering in a DAG.
5. Dijkstra: shortest paths with a priority queue.
6. Union-find: disjoint sets, path compression, union by rank.
7. Minimum spanning trees: Kruskal and Prim.

## Module 6 — Dynamic programming `planned`

1. Memoisation: top-down caching of overlapping subproblems.
2. Tabulation: bottom-up tables and space reduction.
3. One-dimensional DP: climbing stairs, house robber.
4. Two-dimensional DP: grid paths, longest common subsequence.
5. Knapsack: choose or skip, with capacity as a dimension.

## Module 7 — Patterns `planned`

1. Greedy: exchange arguments; interval scheduling.
2. Backtracking: choose, explore, un-choose; permutations and N-queens.
3. Monotonic stack: next greater element.
4. Bit manipulation: masks, XOR tricks, counting bits.
