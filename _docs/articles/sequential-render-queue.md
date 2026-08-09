`1 April 2026` · `WORKING PAPER`

# Cooperative Sequential Rendering: Restoring Progressive Reveal in Warm Registry-Resolved Component Trees

_V. Kancleris, Ketrik Research_

## Abstract

We describe a client-side scheduling pattern for progressively revealing a list of heavy, dynamically resolved React components without modifying the loop that renders them. The pattern addresses a specific asymmetry between cold-load and warm-navigation rendering paths in registry/blueprint-driven UI systems. Cold loads exhibit incidental progressive reveal as a side effect of asynchronous module resolution. Warm, cached navigations lose this property entirely because no pending promise remains to drive staggered commits.

We formalize the problem, examine why adjacent React and browser mechanisms — Fiber’s yield loop, `useTransition`, `Suspense`, `content-visibility`, virtualization, and double `requestAnimationFrame` gating — do not solve the warm case on their own, and present a cooperative single-flight queue ordered by mount-time effect scheduling. The queue uses token-based cancellation to prevent stale-task accumulation during rapid navigation.

---

## 1. Problem statement

### 1.1 System context

The system considered here is a blueprint-driven, registry-resolved UI. A `CardContainer` renders a list of `CardItem`s. Each `CardItem` resolves a concrete component — a table, chart, form, or other content type — from an application registry keyed by a `contentType` string, then renders that component with a per-item slice of a larger data object.

```tsx
<CardContainer cardType={cardType} cardProps={cardProps} url={url}>
	{cardItems.map((item, ix) => (
		<CardItem key={item.id ?? `card-${ix}`} metadata={item} data={data} />
	))}
</CardContainer>
```

Each `CardItem` that successfully resolves to content delegates to `CardContent`. `CardContent` performs three steps for each instance:

1. Resolve the component reference from the registry.
2. Shape the data slice for that component using helpers such as `mapKeysOf` and `computeTrend`.
3. Render the resolved component with the shaped data.

### 1.2 The two-artifact distinction

A registry-resolved component has two independent artifacts with different lifetimes and costs:

1. **The component reference**, or “the shell.”  
   This is a function held in the module cache after its `import()` resolves once. Reuse is cheap; for the life of the page, it never expires.

2. **The rendered output for a specific data set.**  
   This is the fiber subtree and DOM produced by calling that component function with props. This output is torn down on unmount and is not memoized anywhere. There is no cache of “what this component looked like last time”; each mount pays the full render cost again, including reconciliation and structural diffing.

The expensive operation is usually the second one, not the first. This distinction underpins everything that follows.

### 1.3 Path asymmetry: cold load vs. warm navigation

#### Path A: cold load

On first visit, each registry component may be wrapped in `React.lazy()`. The first `import()` of a given module is a genuinely pending promise. React detects the pending state, suspends at the nearest `Suspense` boundary, and commits a fallback as its own discrete paint.

As each import resolves — at different times, governed by real network and parse latency — each component gets an independent commit-and-paint moment. The visual result is progressive reveal, but it is an incidental consequence of real asynchronous I/O, not a deliberately designed scheduling property.

#### Path B: warm navigation

On return to a previously visited view, every component referenced by the loop is already resolved in the module cache. `lazy()` returns an already-resolved promise; nothing throws; `Suspense` has nothing to catch.

React executes the entire `.map()` — N component calls, N data-shaping steps, and N subtree constructions — within one synchronous render/commit cycle, then paints once at the end. The staggering property from Path A is absent because the mechanism that produced it — genuine pending-promise resolution timing — no longer exists on a cache hit.

### 1.4 Formal statement

Let:

```text
items = [item_0, ..., item_{n-1}]
```

be the list rendered by the loop, and let:

```text
render(item_i)
```

denote the work required to resolve, shape, render, and commit `item_i`’s subtree. Define:

```text
T_visible(i)
```

as the wall-clock time at which `item_i` becomes visible to the user.

- **Path A** exhibits:

    ```text
    T_visible(i) ≈ t_import_resolve(i)
    ```

    Visibility is staggered by network and parse timing, largely independent of render-cost ordering.

- **Path B**, unmodified, exhibits:

    ```text
    T_visible(i) = T_commit = Σ render(item_j)
    ```

    for all `i`. Every item becomes visible simultaneously, at the end of the full render cost, because all N render calls occur within one synchronous React render/commit cycle.

The goal is to make Path B exhibit a monotonically increasing `T_visible(i)`, with `T_visible(0)` close to the cost of rendering `item_0` alone, rather than the sum of all item render costs.

This is a scheduling problem — controlling when each render call is allowed to execute — not a data-availability problem. All `item.data` slices are already present in memory, and no fetch is pending.

### 1.5 Constraint

The fix must be local to `CardContent`, or to a hook composed by `CardContent`. It must not require access to the enclosing `.map()`, the item index, or any change to `CardContainer`, because the registry/data-loop layer is out of scope for this change.

---

## 2. Why adjacent mechanisms do not solve this

It is worth being precise about why several plausible React and browser primitives do not address Path B. Each was considered before arriving at the solution in Section 3.

| Mechanism                               | What it actually does                                                                                 | Why it does not apply here                                                                                                                                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fiber’s yield loop**                  | Yields between fiber units, such as between component calls, when React’s scheduler decides to yield. | It operates automatically and cannot be directly steered per item. It also cannot yield inside a single component’s render body. If one `Content` component’s render function is a large synchronous computation, Fiber cannot interrupt that function mid-execution. |
| **`unstable_scheduleCallback`**         | Defers when a scheduled callback runs, cooperating with React’s scheduler.                            | It only shifts the start time of a unit of work. It does not stagger multiple items relative to one another unless an external sequence controls them.                                                                                                                |
| **`useTransition`**                     | Marks a state update as interruptible and lower priority.                                             | It helps with interruptibility, but it does not enforce ordering or per-item pacing without an explicit queue.                                                                                                                                                        |
| **`Suspense` / `lazy()`**               | Suspends on a pending promise.                                                                        | On Path B, there is no pending promise because the module is already cached. Nothing throws, so the mechanism is structurally inert on warm navigation.                                                                                                               |
| **`content-visibility: auto`**          | Allows the browser to skip layout, style, and paint for off-screen subtrees.                          | It solves deferred rendering for off-screen content, but it does not address ordering or pacing for items that are all in the viewport or otherwise simultaneously eligible to render.                                                                                |
| **Virtualization**                      | Avoids mounting off-screen items at all.                                                              | This is the right answer when items do not need to exist in the DOM simultaneously. It is not applicable when all N items must eventually mount and only pacing is negotiable.                                                                                        |
| **Double `requestAnimationFrame` gate** | Delays the start of a render by at least one paint opportunity.                                       | If applied independently to each item without coordination, all N gates resolve at roughly the same time and collide again. It does not create ordering across items.                                                                                                 |

The common failure mode is that each mechanism controls whether a render happens, or when a single render starts. None of them, in isolation, establishes a global order across N independently mounting components resolved from a shared registry.

---

## 3. Solution: cooperative sequential render queue

### 3.1 Design principle

The ordering is recovered from a property React already provides and that requires no plumbing through the list loop:

> Effect order follows commit order.

When `cardItems.map()` produces N `CardContent` instances in one render pass, their `useEffect` hooks are invoked in the same top-to-bottom order after commit. Each `CardContent` instance can therefore register itself into a shared, module-scoped queue on mount, and the queue drains in page order without any component knowing its own index or receiving it as a prop.

The gate is placed specifically around the expensive steps — data shaping and the resolved component’s render — not around whether `CardContent` itself mounts. The skeleton shell mounts immediately and unconditionally; only the heavy payload is deferred.

### 3.2 Queue semantics

The queue is a FIFO of tasks. Tasks are processed one at a time, with a browser paint opportunity enforced between consecutive tasks.

```tsx
type QueueTask = {
	id: symbol;
	run: () => void;
};

let queue: QueueTask[] = [];
let processing = false;

function scheduleTurn(run: () => void): symbol {
	const id = Symbol();

	queue.push({ id, run });

	if (!processing) {
		drain();
	}

	return id;
}

function cancelTurn(id: symbol) {
	queue = queue.filter((task) => task.id !== id);
}

function drain() {
	if (queue.length === 0) {
		processing = false;
		return;
	}

	processing = true;

	const { run } = queue.shift()!;

	run();

	requestAnimationFrame(() => {
		requestAnimationFrame(drain);
	});
}
```

The double `requestAnimationFrame` gate between one task and the next ensures that the previous task has at least one opportunity to be painted before the next task starts. This converts “N synchronous commits collapsed into one paint” into “N discrete commit-and-paint opportunities,” synthetically reproducing the progressive property that Path A received for free from real promise-resolution timing.

The `processing` flag remains true across the frame gap. This matters because additional cards may register themselves into the queue during the same mount pass. Keeping the processor active ensures those newly registered cards are sequenced rather than executed immediately in the same frame.

### 3.3 Hook interface

```tsx
import { useEffect, useState, startTransition } from "react";

function useRenderTurn() {
	const [myTurn, setMyTurn] = useState(false);

	useEffect(() => {
		const id = scheduleTurn(() => {
			startTransition(() => {
				setMyTurn(true);
			});
		});

		return () => {
			cancelTurn(id);
		};
	}, []);

	return myTurn;
}
```

`startTransition` is used for the reveal so that, if a higher-priority update arrives while a card’s turn is being processed — for example, user input or a real-time store update — React can deprioritize that card’s render instead of blocking on it. This preserves an interruptibility property that a plain `setState` call would not provide.

### 3.4 Application to `CardContent`

```tsx
function CardContent({ data, metadata }: CardPropsType) {
	const { mode } = useColorScheme();
	const session = useProfile();
	const { showToast } = useOverlay();

	const contentType = metadata.contentConfig?.contentType ?? metadata.contentType;

	const map = metadata.contentConfig?.map ?? metadata.map;

	const Content = useAppRegistry(contentType);
	const myTurn = useRenderTurn();

	if (!Content) {
		return <NoComponent componentType={contentType} />;
	}

	if (!myTurn) {
		return (
			<MuiCardContent>
				<Skeleton variant="rectangular" height={400} />
			</MuiCardContent>
		);
	}

	const mappedData = mapKeysOf(data, map);
	const trend = mappedData ? computeTrend(mappedData, metadata) : null;

	return (
		<MuiCardContent>
			<ErrorBoundary fallback={<Error />}>
				<Content
					data={mappedData}
					metadata={metadata}
					computed={{ trend }}
					mode={mode}
					onSubmit={({ formData }: any) =>
						handleAction(formData, metadata.actionConfig, {
							session,
							showToast,
						})
					}
				/>
			</ErrorBoundary>
		</MuiCardContent>
	);
}
```

No change to `CardContainer` or the `.map()` call site is required. Each `CardContent` instance is self-sufficient.

### 3.5 Correctness: ghost-task accumulation and token-based cancellation

An initial version of this design used a boolean `cancelled` closure flag to suppress `setState` on unmounted cards. That approach is insufficient at scale.

Consider a user who navigates to a view with 60 cards, then navigates away 100 ms later. With only a `cancelled` guard, the 55 not-yet-processed tasks remain physically present in the queue. Their callbacks become no-ops, but `drain()` must still cycle through all 55 double `requestAnimationFrame` waits — approximately 55 frames, or almost one full second at 60 fps — before the next view’s cards can begin their own turns.

The fix is physical removal, not logical suppression. Each enqueued task is tagged with a unique `Symbol` token at schedule time, and the cleanup function returned from `useEffect` calls `cancelTurn(id)`, which filters that token out of the queue directly.

This bounds the queue’s live length to the number of currently mounted, not-yet-revealed cards, regardless of navigation churn.

A `Symbol` is preferred over comparing closure references directly because it remains unique and collision-free even if queue entries are later extended with additional metadata, such as priority or a source-card identifier for diagnostics.

### 3.6 Scope boundary: data mutation on an already-queued, still-mounted card

Token-based cancellation resolves the unmount case: an item leaves the tree before its turn.

It does not address the distinct case where an item remains mounted, is still awaiting its turn, and its underlying `data` changes in place — for example, a real-time listener updating a slice of the source data object before the card has been revealed.

Under the design above, such a card simply renders with the latest `data` whenever its queued turn arrives. No special handling is required for correctness.

However, if a future product requirement asks such an update to jump the queue — for example, if a live-updated card should be prioritized over stale positional ordering — that requires explicit priority-aware rescheduling. It should not be built on top of the unmount-driven cancellation path described here. This is a boundary of the current design, not a defect in it.

---

## 4. Trade-offs

### Time-to-first-item vs. time-to-last-item

The queue does not reduce total render cost:

```text
Σ render(item_j)
```

is unchanged. What changes is when each item’s cost is paid. The pattern trades a longer time-to-last-visible item for a much shorter time-to-first-visible item. For a top-to-bottom reading pattern over many cards, this is usually the correct trade.

### Global queue vs. per-container queue

The queue described here is a module-level singleton, shared across every `CardContainer` on the page. This gives one coherent main-thread budget across simultaneously mounted card groups.

The cost is cross-container interleaving: a card in container B may wait behind cards in container A. If that interleaving is undesirable, a per-container queue keyed by container ID is a straightforward variant.

### Dependence on stable references

`useRenderTurn`’s effect runs once per mount by design, because it uses an empty dependency array.

If the `data` prop passed into `CardContent` is not referentially stable across unrelated parent re-renders, this specific hook is unaffected because it does not depend on `data`. However, the data-shaping step gated behind `myTurn` should still be checked separately for unnecessary recomputation during unrelated re-renders.

### Not a substitute for reducing individual render cost

If any individual registry component’s render cost is large enough to visibly block a single frame on its own, no scheduling pattern at this layer fixes that. The queue affects ordering across items; it does not reduce the synchronous cost of any one item’s render body.

Reducing the internal cost of a given `Content` implementation remains a separate optimization problem.

---

## 5. Summary

The core insight is that a registry/blueprint architecture separates two artifacts:

1. A cheap, persistent artifact: the resolved component reference.
2. An expensive, non-persistent artifact: the rendered subtree for a specific data set.

The progressive-reveal behavior observed on cold load is an accidental byproduct of real asynchronous module resolution, not a designed property of the render loop. Warm navigation removes the pending-promise events that produced that behavior.

To recover the same user-facing staggered reveal on warm navigation, the system must manufacture equivalent commit-and-paint checkpoints synthetically. A mount-order-derived, token-cancellable FIFO queue — driven by `useEffect` ordering rather than explicit index or priority props — reproduces this behavior entirely within the leaf component, without modifying the enclosing list-rendering loop.

## 6. References

1. React documentation: [`lazy`](https://react.dev/reference/react/lazy).  
   Covers deferred loading of component references and integration with Suspense.

2. React documentation: [`Suspense`](https://react.dev/reference/react/Suspense).  
   Describes fallback rendering while suspended content is resolving.

3. MDN Web Docs: [dynamic `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import).  
   Explains asynchronous module loading and module caching behavior.

4. React documentation: [Render and commit](https://react.dev/learn/render-and-commit).  
   Describes React’s render, commit, and side-effect lifecycle.

5. React documentation: [`useTransition`](https://react.dev/reference/react/useTransition).  
   Describes marking state updates as non-urgent and interruptible.

6. React documentation: [`startTransition`](https://react.dev/reference/react/startTransition).  
   Describes the imperative transition API used to deprioritize updates.

7. React documentation: [`useEffect`](https://react.dev/reference/react/useEffect).  
   Covers effect lifecycle, cleanup, and synchronization after commit.

8. React documentation: [Synchronizing with effects](https://react.dev/learn/synchronizing-with-effects).  
   Explains using effects to synchronize external behavior after render.

9. React v18 release notes: [React v18](https://react.dev/blog/2022/03/29/react-v18.html).  
   Background on concurrent rendering, transitions, and interruptible updates.

10. MDN Web Docs: [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).  
    Describes frame-aligned callbacks and browser paint timing.

11. React source: [`scheduler` package](https://github.com/facebook/react/tree/main/packages/scheduler).  
    React’s cooperative scheduling primitives, including callback scheduling behavior.

12. React source: [`react-reconciler` package](https://github.com/facebook/react/tree/main/packages/react-reconciler).  
    The reconciler/Fiber implementation underlying React’s incremental rendering behavior.

13. MDN Web Docs: [`content-visibility`](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility).  
    Browser-level rendering deferral for off-screen or hidden content.

14. CSS Containment Module Level 2: [`content-visibility`](https://drafts.csswg.org/css-contain-2/#content-visibility).  
    Specification for `content-visibility` and its rendering behavior.

15. web.dev: [`content-visibility`](https://web.dev/articles/content-visibility).  
    Practical guidance on using `content-visibility` to improve rendering performance.

16. `react-window`: [GitHub repository](https://github.com/bvaughn/react-window).  
    A common React virtualization library for rendering large lists efficiently.

[<<< Back to all articles](/pages/articles)
