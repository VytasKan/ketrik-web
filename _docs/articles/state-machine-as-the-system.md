`10 August 2026` · `WORKING PAPER`

# The State Machine as the System: Persistent Topology in the Age of Autonomous Agents

_V. Kancleris, Ketrik Research_

> **Two ways to read this article**
>
> Each section below has two parts. **“The Simple Story”** explains the idea in plain language. **“The Computer Science”** adds the code, the architecture, and the formal details. Read whichever you need — or both.

---

## Abstract

The preceding paper examined architectures in which an orchestrator computes a task topology for a single query and then discards it. That model is effective for ephemeral, goal-directed computation, but it is insufficient for long-running processes that require durability, human oversight, and asynchronous participation. This paper proposes a persistent coordination substrate in which the state machine is externalized as an event-sourced store, agents act as autonomous background services, and topology emerges from task dependencies, event subscriptions, and state transitions. In this architecture, human approval is represented as a first-class transition rather than an out-of-band interruption. Agents may also create anticipatory tasks that become active when temporal or conditional predicates are satisfied. We describe the runtime model, the event-notification mechanism, and the governance constraints required to make persistent, self-discovering topologies safe, auditable, and recoverable.

---

## 1. The Limit of Ephemeral Topology

### The Simple Story

In the preceding paper, we described learned agent swarms: systems in which a model computes its own task topology. You submit a query, the orchestrator spawns sub-agents, they work in parallel, and the orchestrator synthesizes an answer. When the answer is returned, the graph is discarded. The context window is cleared. The task relationships disappear.

This works well for bounded questions:

- “Should we invest in Company X?”
- “Summarize these documents.”
- “Compare these vendors.”
- “Debug this function.”

It does not work well for ongoing processes that lack a clean beginning and end:

- a security operations center monitoring logs continuously,
- a supply chain that requires ongoing rebalancing,
- a clinical trial where data arrives asynchronously and regulators must approve protocol changes,
- a creative workflow where agents draft, review, revise, and wait for human authorization.

These are not one-shot questions. They are long-running processes with human judgment embedded throughout. They require a topology that persists, evolves, waits, and recovers.

### The Computer Science

A swarm-style architecture is session-bound and synchronous:

$$
\begin{aligned}
\text{Query} &\rightarrow \text{Compute Graph } G_q \rightarrow \text{Execute } G_q \\
&\rightarrow \text{Answer} \rightarrow \text{Discard } G_q
\end{aligned}
$$

The effective state machine is the orchestrator’s context window: a transient structure that exists only during the execution of the query. There is no durable state between sessions. There is no mechanism for a human to pause the graph, inspect it, and approve a state transition. There is no way for Agent A to leave a task for Agent B that Agent B will pick up hours later.

The fundamental limitation is that the graph is an emission of the model, not a shared substrate. When the model stops generating, the graph ceases to exist.

This does not mean ephemeral swarms are wrong. They are well suited to bounded, high-parallelism tasks. But they are not sufficient for durable, governed, long-running work.

---

## 2. The Persistent State Machine as Shared Coordination State

### The Simple Story

Imagine a shared task board in an organization. Anyone can read it, add a card, move a card, or mark work as complete. The board does not disappear when a meeting ends. It remains available after any individual participant leaves.

In an agent system, the equivalent structure is a persistent, event-sourced task state. Agents do not receive the entire workflow from a central orchestrator. Instead, they observe shared state, claim tasks they are qualified to perform, execute them, and write results back.

A task may contain:

- a description,
- a status,
- a creator,
- dependencies,
- required capabilities,
- an owner or active lease,
- a priority score,
- an evidence bundle,
- approval requirements,
- expiration or activation conditions.

Agents run as background services. They wake up, query the state machine for tasks matching their capabilities, claim one, execute it, and write results back. If an agent discovers a gap, it creates a new task. If a task is high-risk, it moves into an approval state. A human reviews it, approves or rejects it, and the state machine transitions.

The topology is not drawn in advance. It is the evolving set of tasks, dependencies, claims, approvals, and events maintained in the shared state.

### The Computer Science

Formally, the system is an event-sourced coordination machine. Let \(E\) be an append-only event log. The materialized state at logical time \(t\) is the projection:

$$
S_t = \text{fold}(E_{\leq t})
$$

where \(E\_{\leq t}\) is the prefix of the event log accepted up to time \(t\).

The event alphabet \(\Sigma\) includes task lifecycle events such as:

- `task_created`
- `task_activated`
- `task_claimed`
- `task_completed`
- `task_failed`
- `task_expired`
- `human_approval_requested`
- `human_approved`
- `human_rejected`
- `approval_expired`
- `dependency_satisfied`
- `compensation_task_created`

Transitions are not arbitrary. Each submitted event is accepted only if it satisfies a set of validation predicates:

- schema validity,
- authorization,
- dependency satisfaction,
- capability matching,
- lease validity,
- idempotency constraints,
- policy constraints.

Thus \(\delta\) is best understood as a partial, policy-checked transition relation rather than a total function:

$$
\delta \subseteq S \times \Sigma \times S
$$

The system’s current topology is the materialized graph of tasks, dependencies, claims, approvals, and events induced by the accepted event history.

Because task identifiers, payloads, timestamps, and event histories are unbounded, the state space should not be treated as strictly finite. It is better modeled as a structured, potentially unbounded state space constrained by schemas and invariants.

Example event:

```json
{
	"event_id": "evt_001",
	"timestamp": "2026-08-08T10:23:00Z",
	"type": "task_created",
	"task_id": "task_042",
	"created_by": "agent_financial_analyst",
	"correlation_id": "goal_q3_due_diligence",
	"payload": {
		"description": "Verify Q3 revenue against SEC 10-Q filing",
		"status": "pending",
		"priority": 8,
		"dependencies": ["task_041"],
		"required_capabilities": ["web_search", "financial_analysis"],
		"approval_required": false,
		"ttl": "24h"
	}
}
```

The current state of any task is the fold of all events affecting it. This gives the system auditability, recoverability, and the ability to replay history.

---

## 3. Human Approval Gates as First-Class State Transitions

### The Simple Story

In an ephemeral swarm, the model decides everything. It spawns agents, synthesizes results, and returns an answer. There is no formal pause mechanism. If the model recommends a high-risk action, the recommendation is produced without a governance step unless the surrounding application adds one externally.

In a persistent state machine, human judgment is not an afterthought. It is a state.

When an agent completes a task that involves spending money, accessing sensitive data, making irreversible decisions, or communicating externally, it does not mark the task `done`. It marks the task `awaiting_human_approval`.

```text
[Agent completes risk assessment]
            │
            ▼
    ┌───────────────────────┐
    │ AWAITING_HUMAN_APPROVAL │
    └───────────┬───────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
   [APPROVED]       [REJECTED]
        │               │
        ▼               ▼
   [Execute]      [Create compensating task]
```

The human is not interrupting the system. The system is designed to wait at this state.

The agent that created the task can move on to other work. Another agent can pick up the follow-up task if the human rejects. The topology adapts to the human’s decision.

### The Computer Science

Formally, human governance in an event-sourced state machine is modeled as a deterministic transition function $\delta: S \times \Sigma \to S$, where human interactions are elevated from external side-effects to first-class event alphabet inputs $\sigma \in \Sigma$:

$$
\delta(s_{\text{awaiting}}, \sigma) = \begin{cases} 
s_{\text{approved}} & \text{if } \sigma = \sigma_{\text{human\_approve}} \\ 
s_{\text{rejected}} & \text{if } \sigma = \sigma_{\text{human\_reject}} \\ 
s_{\text{escalated}} & \text{if } \sigma = \sigma_{\text{timeout\_escalate}} 
\end{cases}
$$

This formalization provides three structural guarantees:

1. **Zero Resource Holding**: Because $s_{\text{awaiting}}$ is a persistent state in $S$, agent execution suspends without holding process threads, memory allocations, or open network connections while awaiting input.
2. **Immutable Audit Trajectories**: Every human decision $\sigma$ is an immutable event appended to the event log, creating a mathematically provable audit trail of human-in-the-loop governance.
3. **Adaptive Topology**: The transition function $\delta$ deterministically routes workflow execution or compensating tasks based on human input without breaking system invariants.

Approval should not be merely a boolean decision. An approval request should include context:

- the task description,
- the evidence produced by agents,
- the risk classification,
- the requested action,
- the set of possible human decisions,
- the identities or roles authorized to decide,
- a timeout or escalation policy.

Example approval event:

```json
{
	"event_id": "evt_089",
	"type": "human_approved",
	"task_id": "task_042",
	"approved_by": "user_alice@company.com",
	"role": "compliance_officer",
	"signature": "sig_abc123...",
	"justification": "Revenue figure verified against primary source. Proceed.",
	"evidence_refs": ["artifact_114", "artifact_115"]
}
```

Approval gates may be:

- single-user,
- quorum-based,
- role-based,
- dual-control,
- time-delayed,
- revocable.

For high-risk operations, approval may require both a human and a policy engine, or two independent human reviewers. Approval decisions should be signed and appended to the event log.

Approval gates must also account for human latency. If a task remains in `awaiting_human_approval` beyond a defined threshold, the system may escalate it, assign an alternate reviewer, reduce its priority, or expire the request. Timeout behavior should be explicit, because long-running systems cannot assume that human decisions arrive promptly.

---

## 4. Predictive Task Generation: Anticipatory Work Items in a Persistent State Machine

### The Simple Story

In an ephemeral swarm, the orchestrator creates tasks reactively: “I need to know X, so I will spawn an agent to find X.” The task graph is computed from the current state of knowledge.

In a persistent state machine, agents can create anticipatory tasks: tasks that may become relevant in the future.

Example: a supply-chain monitoring agent notices that a vendor’s shipment is delayed. It does not merely report the delay. It creates a cascade of predictive tasks:

1. Immediate: alert the logistics team.
2. In two hours: check whether the delay affects downstream production.
3. If delay exceeds twenty-four hours: find an alternative vendor.
4. When resolved: update the inventory forecast.

The agent is not merely reacting to the present. It is creating conditional work items that become active when time or state conditions are satisfied.

### The Computer Science

Predictive task generation is a form of temporal and conditional planning embedded in the state machine.

A task may include:

```python
class Task:
    description: str
    status: TaskStatus

    # Temporal predicates
    activate_at: Optional[datetime]
    expire_at: Optional[datetime]

    # Conditional predicates
    dependencies: List[TaskID]
    conditions: List[Predicate]

    # Ownership and capability
    required_capabilities: List[str]
    assigned_to: Optional[AgentID]
    lease_expires_at: Optional[datetime]

    # Predictive metadata
    predicted_by: AgentID
    confidence: float
    dedup_key: str
    budget: ResourceBudget
    provenance: EventID
```

Example condition:

```text
task_007.status == "delayed" AND task_007.delay_hours > 24
```

The state machine evaluates predicates deterministically. A task becomes eligible only when its activation conditions are satisfied according to the authoritative state. Conditional tasks should be re-evaluated when relevant events are appended to the log.

Predictive task generation must be bounded. Without constraints, agents may create excessive speculative work, duplicate tasks, or recursive task cascades. The state machine should therefore enforce:

- task-generation budgets,
- deduplication keys,
- confidence thresholds,
- maximum speculative depth,
- expiration policies,
- cancellation conditions,
- provenance tracking.

Each predicted task should carry provenance identifying the agent, event, and reasoning trace that caused its creation. This allows the system to audit, cancel, or downweight speculative work when the prediction is no longer supported.

---

## 5. Event Notification: Agents That Follow the State

### The Simple Story

In an ephemeral swarm, the orchestrator pushes work to agents. It spawns them, waits for their results, and synthesizes the outcome.

In a persistent state machine, communication is event-driven and pull-based. Agents do not wait for an orchestrator to tell them what to do. They subscribe to events:

- Agent A subscribes to `task_created` events where `required_capabilities` includes `financial_analysis`.
- Agent B subscribes to `task_completed` events for tasks that are dependencies of its current work.
- Agent C subscribes to `human_approved` events because it generates compliance reports.
- The human dashboard subscribes to tasks in `awaiting_human_approval`.

When an event fires, subscribed agents are notified. They decide whether to act. The topology is not a star with an orchestrator at the center. It is a state-mediated mesh where edges form dynamically based on event patterns, capabilities, and policies.

### The Computer Science

The notification layer is an event bus with typed subscriptions:

```python
event_bus.subscribe(
    agent_id="agent_financial_analyst",
    filter={
        "event_type": "task_created",
        "payload.required_capabilities": {"$contains": "financial_analysis"},
        "payload.status": "pending"
    },
    callback=agent_a.on_task_available
)
```

When an event is emitted:

```python
async def on_task_created(event):
    subscribers = event_bus.match(event)

    for agent in subscribers:
        await agent.notify(event)
```

The event bus should provide at-least-once notification, while the state machine provides authoritative transition validation. Agents must therefore be idempotent. Receiving a duplicate notification should not cause duplicate execution.

Task claims should be made against the state machine, not against the event payload. An event may notify an agent that a task exists, but the agent’s right to execute that task is established only by a successful atomic claim transition.

The event bus is not the source of truth. It is a delivery mechanism. If a notification is lost, an agent can recover by polling the state machine or replaying the event log from a checkpoint.

Events may include causal metadata:

```json
{
	"event_id": "evt_104",
	"causation_id": "evt_089",
	"correlation_id": "goal_q3_due_diligence",
	"sequence": 104
}
```

This allows agents to reason about causal chains and goal-level progress without requiring a central orchestrator.

---

## 6. The Runtime Architecture

### The Simple Story

The system has three layers:

1. **The state machine.**  
   This is the source of truth. It stores events, task projections, approvals, goals, leases, and policy decisions.

2. **The event bus.**  
   This is the notification layer. It routes events to interested agents and dashboards.

3. **The agents.**  
   These are background services. They subscribe to events, claim tasks, execute work, and write results back.

There is no single synchronous orchestrator that owns the full task graph. Coordination is mediated through shared state. However, the system may still contain governance services, policy engines, schedulers, monitors, and human dashboards. The key difference is that task execution is pull-based and state-mediated rather than push-based and orchestrator-owned.

### The Computer Science

```python
class AgentService:
    def __init__(self, agent_id, capabilities, system_prompt):
        self.agent_id = agent_id
        self.capabilities = capabilities
        self.system_prompt = system_prompt
        self.state_machine = StateMachineClient()
        self.event_bus = EventBusClient()

    async def run(self):
        self.event_bus.subscribe(
            filter=self.capability_filter(),
            callback=self.on_event
        )

        while True:
            event = await self.event_bus.next_event()
            await self.on_event(event)

    async def on_event(self, event):
        if event.type == "task_created" and self.can_handle(event.task):
            claim = await self.state_machine.claim_task(
                task_id=event.task_id,
                agent_id=self.agent_id,
                lease_ttl="10m"
            )

            if claim.success:
                result = await self.execute_task(event.task, claim.lease_id)

                await self.state_machine.complete_task(
                    task_id=event.task_id,
                    lease_id=claim.lease_id,
                    result=result,
                    new_tasks=self.predict_follow_up_tasks(result)
                )

    async def execute_task(self, task, lease_id):
        context = [
            self.system_prompt,
            f"[Task]: {task.description}",
            f"[Context]: {task.dependency_results}",
            f"[Constraints]: {task.policy_constraints}"
        ]

        while True:
            response = await self.llm.generate(context)

            if response.has_tool_call:
                result = await execute_tool(
                    response.tool_name,
                    response.tool_args,
                    permissions=task.allowed_tools
                )
                context.append(f"[Tool Result]: {result}")
            else:
                return response.text
```

The state machine is the coordination primitive. Agents do not need to communicate directly. They communicate by writing to and reading from shared state.

This resembles the actor model, blackboard systems, and event-driven choreography, but with learned agents as autonomous participants.

---

## 7. Governance, Security, and Failure Recovery

### The Simple Story

A shared task board only works if the rules of the board are clear. If anyone can write anything, the board becomes noisy or unsafe. If agents can claim the same task repeatedly, work is duplicated. If a human approval is lost, important decisions disappear. If a malicious task description is posted, agents may be manipulated.

A persistent agent system therefore needs governance:

- who can create tasks,
- who can claim tasks,
- which tools an agent may use,
- which tasks require human approval,
- how failures are retried,
- how deadlines are enforced,
- how evidence is stored,
- how decisions are audited.

### The Computer Science

#### Atomic Claims and Leases

Task claiming must be atomic. An agent may claim a task only if the task is claimable and no active lease exists.

```python
claim(task_id, agent_id, lease_ttl)
```

A claim succeeds only if:

```text
task.status IN ("pending", "eligible")
AND no valid lease exists
AND agent has required capabilities
AND agent is authorized for the task domain
```

If the agent fails to complete the task before the lease expires, the task returns to a claimable state or transitions to `failed`, depending on policy.

#### Idempotency and Delivery Semantics

Event handlers should be idempotent. Because event notification may be at-least-once, agents must tolerate duplicate notifications.

State transitions should use the transactional outbox pattern:

1. Append the state transition event.
2. Emit the notification event.
3. Deliver notifications at least once.
4. Require handlers to be idempotent.

Failed notifications can be routed to a dead-letter queue for inspection.

#### Compensation and Recovery

Failed tasks may trigger compensating tasks.

Example:

```text
If task_claimed expires without task_completed:
    create task_retry
    or create task_escalate_to_human
    or create task_select_alternative_agent
```

This allows the topology to recover without requiring a central orchestrator to reconstruct the workflow from scratch.

#### Goal Completion and Quiescence

Persistent systems require an explicit objective model. A root goal should be represented as a durable object in the state machine. Tasks may be linked to goals through causation and correlation identifiers.

The system should be able to determine whether a goal is:

- active,
- blocked,
- awaiting approval,
- completed,
- failed,
- abandoned,
- quiescent.

In continuous monitoring systems, goals may not terminate. Instead, they may enter quiescence between events. The state machine should therefore distinguish between terminal completion and temporary quiescence.

#### Trust Boundaries

Multi-organization collaboration requires strict trust boundaries. Tasks created by one organization should not automatically be executable by another.

The state machine must enforce:

- tenancy,
- capability scopes,
- data-access policies,
- approval requirements,
- cryptographic provenance,
- audit retention.

Task descriptions should be treated as untrusted input. Agents should execute them only within sandboxed tool permissions and policy constraints. Predictive or externally created tasks should not automatically inherit the privileges of the agent that claims them.

#### Prompt Injection and Malicious Task Creation

Because task descriptions may be generated by agents or external organizations, they must be treated as potentially adversarial input.

The system should:

- validate task schemas,
- restrict tool permissions,
- require human approval for high-risk operations,
- isolate execution environments,
- log provenance for every generated task,
- rate-limit speculative task creation,
- detect semantic duplication and abuse patterns.

Governance is not an external layer. It must be part of the state machine.

---

## 8. From Push to Pull: The Topological Inversion

### The Simple Story

In a learned swarm, the orchestrator pushes work to agents. The orchestrator is the coordination point. It decides who does what.

In a persistent state machine, agents pull work from shared state. There is no single synchronous owner of the task graph. The state machine is a commons. Agents are independent services that observe state, claim tasks, execute work, and write results back.

This is the topological inversion.

### The Computer Science

| Dimension              | Generation 5 Swarm (Push)                     | Generation 6 Persistent System (Pull)   |
| ---------------------- | --------------------------------------------- | --------------------------------------- |
| Coordination point     | Orchestrator                                  | Shared event-sourced state store        |
| Communication          | Direct: orchestrator ↔ agent                  | Indirect: agent → state machine → agent |
| Agent lifetime         | Ephemeral, spawned per query                  | Persistent, long-running services       |
| Human involvement      | Typically external or absent during execution | First-class state transitions           |
| Recoverability         | Often restart from beginning                  | Resume from last accepted event         |
| Auditability           | Ephemeral context window                      | Append-only event log                   |
| Scalability bottleneck | Orchestrator context window                   | State-store write throughput            |
| Governance             | Often external to the model                   | Embedded in transition rules            |

The shift from push to pull is a shift from orchestration to choreography:

- **Orchestration:** a central controller defines the workflow and directs participants.
- **Choreography:** each participant knows its role and reacts to events in shared state.

In choreography, the state machine is the coordination substrate. Agents read their work from shared state and act within their constraints. The agent that created the initial goal does not necessarily control every later step.

---

## 9. What This Enables

### The Simple Story

This architecture enables systems that ephemeral swarms cannot easily support:

1. **Continuous monitoring.**  
   A security agent watches logs, creates tasks when anomalies are detected, and escalates to humans when confidence is low. The system never “finishes.” It reaches quiescence between events.

2. **Human-in-the-loop workflows.**  
   A clinical trial agent drafts a protocol change, moves it to `awaiting_human_approval`, and waits. A regulator reviews it, approves it, and the system automatically notifies all downstream agents.

3. **Multi-organization collaboration.**  
   Company A’s agent creates a task. Company B’s agent picks it up. The state machine provides the shared coordination layer, subject to trust boundaries and authorization policies.

4. **Recoverability and auditability.**  
   The system crashes. You replay the event log from the last checkpoint. Every decision, every agent action, and every human approval is reconstructible.

### The Computer Science

The persistent state machine enables four properties that ephemeral topologies cannot provide by default:

1. **Durability.**  
   Events are written to persistent storage before agents are notified. A crash does not necessarily lose work.

2. **Observability.**  
   The event log is a complete, time-ordered record of system behavior. It can be queried, replayed, and analyzed.

3. **Composability.**  
   New agents can be added without changing existing agents. They subscribe to relevant events and claim tasks within their capability scope.

4. **Governance.**  
   Human approval gates, rate limits, budgets, and access controls are implemented as state transitions and validation policies, not merely as external policy layers.

---

## 10. The Taxonomy, Extended

| Generation       | Topology                                        | State Location                     | Human Role                    | Example             |
| ---------------- | ----------------------------------------------- | ---------------------------------- | ----------------------------- | ------------------- |
| 1st (Grid)       | Static star                                     | Scheduler and worker memory/disk   | Designer                      | MPI clusters        |
| 2nd (MapReduce)  | Static bipartite shuffle                        | Framework-managed local storage    | Designer                      | Hadoop, Spark       |
| 3rd (ReAct)      | Fixed linear/circular loop                      | LLM context window                 | None; loop is hardcoded       | OpenClaw, Pi, Devin |
| 4th (Menu)       | Dynamic sequence over human-defined templates   | LLM context plus template registry | Menu author                   | Google Antigravity  |
| 5th (Swarm)      | Dynamic per-query graph emitted by orchestrator | Orchestrator context window        | None during execution         | Kimi PARL           |
| 6th (Persistent) | Durable self-discovering task graph             | External event-sourced state store | First-class state transitions | This paper          |

The important distinction is not merely that Generation 6 has more persistence. It is that the topology becomes a governed, durable object rather than a temporary emission.

---

## 11. Open Research Questions

Persistent, self-discovering topologies raise several research questions that are less pressing in ephemeral swarm architectures:

1. **Goal completion.**  
   How can a system determine that a high-level objective is complete when tasks are created asynchronously by multiple agents?

2. **Liveness.**  
   How can the system detect stalled goals, unclaimed tasks, or circular dependencies without a central orchestrator?

3. **Governance.**  
   How can approval gates, budgets, and risk policies be enforced over long-running topologies?

4. **State growth.**  
   How large can the event log become before replay, projection, or query costs dominate system performance?

5. **Semantic deduplication.**  
   How can the system detect that two tasks are functionally equivalent even if their descriptions differ?

6. **Trust boundaries.**  
   How can tasks and agents from different organizations interact safely?

7. **Evaluation.**  
   What metrics should be used to compare persistent agent topologies with ephemeral swarms? Candidate metrics include recovery time, duplicate work rate, audit completeness, human approval latency, safety violations, and task throughput.

---

## 12. Conclusion: The Topology as a Durable Process

The architectures discussed in the preceding paper made topology computable: a learned policy could emit a graph for a single task. The architecture proposed here makes topology durable: task graphs are externalized, event-sourced, and maintained across sessions, failures, and human decision cycles.

This shifts the research problem from generating a graph to governing a graph over time. The central questions are no longer only how agents decompose tasks, but how distributed agents claim work, respect constraints, obtain authorization, recover from failure, and produce auditable outcomes.

In ephemeral swarms, topology is an output of a model. In persistent agent systems, topology becomes a long-lived coordination process.

Generation 5 made topology computable. Generation 6 makes it governable.

---

## References

- Author Name(s). (2026). _The Topology is the Output: From Grid Computing to Emergent Agent Swarms._ Preceding paper in this series.

- Hewitt, C., Bishop, P., & Steiger, R. (1973). _A Universal Modular ACTOR Formalism for Artificial Intelligence._ Proceedings of the International Joint Conference on Artificial Intelligence (IJCAI).

- Fowler, M. (n.d.). _Event Sourcing._ martinfowler.com. Retrieved August 2026, from https://martinfowler.com/eaaDev/EventSourcing.html

- Vernon, V. (2013). _Implementing Domain-Driven Design._ Addison-Wesley.

- Hohpe, G., & Woolf, B. (2003). _Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions._ Addison-Wesley.

- Nii, H. P. (1986). _Blackboard Systems: The Blackboard Model of Computation and the Control of Interpretation._ AI Magazine.

- Gelernter, D. (1985). _Generative Communication in Linda._ ACM Transactions on Programming Languages and Systems.

- Garcia-Molina, H., & Salem, K. (1987). _Sagas._ Proceedings of the ACM SIGMOD International Conference on Management of Data.

- Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). _ReAct: Synergizing Reasoning and Acting in Language Models._ International Conference on Learning Representations (ICLR).

- Moonshot AI. (2026). _Kimi K2.5 Tech Blog: Visual Agentic Intelligence._ https://www.kimi.com/blog/kimi-k2-5

- Moonshot AI. (2026). _Kimi K3 Tech Blog: Open Frontier Intelligence._ https://www.kimi.com/blog/kimi-k3

- Google. (2026). _Google Antigravity SDK._ https://github.com/google-antigravity/antigravity-sdk-python

[<<< Back to all articles](/pages/articles)
