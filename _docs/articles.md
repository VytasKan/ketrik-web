`10 August 2026` · `WORKING PAPER`
[![](/_assets/paper2_diagram.svg)](/pages/articles/state-machine-as-the-system)

### [The State Machine as the System: Persistent Topology in the Age of Autonomous Agents](/pages/articles/state-machine-as-the-system)

This paper argues that instead of using short-lived AI swarms that discard task data after single queries, long-running agent systems require a persistent, event-sourced state machine as a durable shared coordination layer. In this architecture, continuous background agents autonomously claim tasks from the shared store, generate predictive work items, and treat human approvals as explicit state transitions. **Ketrik** provides the practical implementation of this vision through its event-driven task substrate, capability-based agent leases, and built-in human governance gates.

[**Read >>>**](/pages/articles/state-machine-as-the-system)

---

`1 August 2026` · `WORKING PAPER`
[![](/_assets/paper1_diagram.svg)](/pages/articles/the-topology-is-the-output)

### [The Topology is the Output: How AI Decoupled State Machines from Graphs](/pages/articles/the-topology-is-the-output)

For thirty years, engineers drew distributed system blueprints by hand—from Grid computing and MapReduce to rigid agent loops. This paper explores a fundamental paradigm shift: learned AI swarms where the system topology is no longer designed in advance, but computed on the fly by the model itself. By turning sub-agent creation into learned SPAWN and FINISH actions, the model draws, adapts, and rewires its own task graph mid-execution. System engineering is no longer about drawing fixed blueprints, but training models that emit their own architectures.

[**Read >>>**](/pages/articles/the-topology-is-the-output)

---

`1 April 2026` · `WORKING PAPER`
[![](/_assets/cooperative-sequential-rendering.svg)](/pages/articles/sequential-render-queue)

### [Cooperative Sequential Rendering: Restoring Progressive Reveal in Warm Registry-Resolved Component Trees](/pages/articles/sequential-render-queue)

This paper addresses how returning to previously visited views in dynamic React applications destroys progressive rendering because module-cached components render in a single synchronous, UI-freezing batch. To restore smooth frame-by-frame rendering without altering parent container loops, leaf components register into a self-draining FIFO queue that uses token-cancellable `requestAnimationFrame` gates and `startTransition` updates to synthetically stagger commits. Ketrik implements this pattern across its registry-driven dashboards via the `useRenderTurn()` hook, ensuring instant skeleton initial paints and responsive staggered reveals on warm navigation.

[**Read >>>**](/pages/articles/sequential-render-queue)
