`1 August 2026` · `WORKING PAPER`

# The Topology is the Output: From Grid Computing to Emergent Agent Swarms

_V. Kancleris, Ketrik Research_

## Abstract

For three decades, distributed systems engineering has followed an immutable rule: first you draft the blueprint, then you write the code that traverses it. The graph was the plan, and the plan was the graph. This paper traces how that rule was broken — not by better orchestration frameworks, but by a fundamental shift in where the system's transition function lives. We examine the evolution of distributed architectures across five generations, defined by five distinct execution loops: from static grid computing and bipartite MapReduce pipelines, through the hardcoded ReAct agent loops and model-selected sub-agent menus, culminating in learned agent swarms. We demonstrate that systems like the Kimi Agent Swarm represent an entirely new class of architecture where the state machine is decoupled from the topology. The topology is no longer designed by an engineer; it is computed by the model at runtime as a structural emission of its reasoning. We detail the mechanism enabling this (Parallel-Agent Reinforcement Learning), the runtime architecture where SPAWN and FINISH are the only state-changing transitions, and the three physical constraints of classical systems that had to dissolve for the era of emergent topologies to begin.

> **Two ways to read this article**
>
> Each section below has two part. **"The Simple Story"** explains the idea in plain language. **"The Computer Science"** adds the code, the math, and the systems-engineering details. Read whichever you need — or both.

---

## 1. The Blueprint Rule: Three Decades of Frozen Topologies

### The Simple Story

For as long as computers have been networked, engineers have followed the same ritual before running a distributed job:

1. **Draft the blueprint.** Decide which machines talk to which. A star. A ring. A shuffle grid.
2. **Write the code.** Tell each machine what to do.
3. **Run it.** The system follows the blueprint. It never changes the blueprint.

Whether you were crunching numbers on a supercomputer cluster, processing petabytes with MapReduce, orchestrating DAGs in Apache Airflow, or training a model across GPUs, the rule was the same: **the topology was a blueprint, frozen before the first byte moved.**

The graph _was_ the plan. The plan _was_ the graph.

> A historical footnote: Peer-to-Peer networks of the early 2000s (BitTorrent, Gnutella, Chord) allowed topologies to shift dynamically as nodes joined and left. However, the rules governing those shifts were strictly hardcoded protocols — gossip loops and Distributed Hash Tables. The graph changed shape, but the logic driving it was still a human blueprint. The AI shift described in this paper is fundamentally different: the _transition function itself_ is learned.

### The Computer Science

In classical distributed systems, the state machine and the topology were the same thing. The state machine said: _"If I am in state A and receive input X, go to state B."_ But state B was a physical node, and the edge from A to B was a network cable or a shuffle partition. You could not separate the behavior from the wiring because the wiring _was_ what made the behavior possible.

In grid computing, the topology was a star: one controller connected to N workers. The controller was the only node that made decisions; workers just executed. In MapReduce, the topology was a bipartite graph with a shuffle crossbar in the middle: mappers on one side, reducers on the other, and a hash function that routed data between them. The hash partitioner (`hash(key) mod R`) was baked into the framework. It never changed at runtime.

Between MapReduce and the AI era, the industry relied heavily on **DAG orchestrators** — Apache Airflow, Prefect, Dagster, and Spark's internal DAG scheduler. Engineers drew complex Directed Acyclic Graphs by hand, and the framework executed them via topological sort: _"Have all upstream parents finished? If yes, trigger this node."_ The graphs were more expressive than MapReduce's rigid bipartite shape, but they were still 100% human-authored and frozen before execution.

The coupling was structural: the code that decided what to do next was written _for_ a specific graph. You could not swap the graph without rewriting the code.

> **A note on taxonomy:** As we will see, these five generations are defined by five distinct execution loops — the code that decides what happens next. However, topologically, they rely on only four fundamental shapes. Generation 1 (Grid) and Generation 4 (Antigravity) both utilize a Star topology. What separates them into different generations is not the shape of the graph, but the execution loop driving it: a human `for`-loop versus an LLM `while`-loop.

---

## 2. The Old World: Four Generations of Human-Designed Graphs

### The Simple Story

Before AI could break the rule, four kinds of systems lived by it. They are the baseline — the "before" picture.

**Grid computing** is a dispatcher with a megaphone. The controller shouts tasks into a room of identical workers. Workers don't talk to each other. They do their piece, hand it back, and the controller stitches the answer together. The star shape is drawn before anyone starts working.

**MapReduce** is a factory assembly line with a sorting room in the middle. Mappers tag every item with a key. A massive conveyor belt (the shuffle) sorts everything by key and drops each pile onto the right reducer. The conveyor belt is installed before the factory opens. It never moves.

**The ReAct Agent Loop** (implemented by modern coding assistants like **OpenClaw, Pi, Devin, and Cursor**) is a single worker in a continuous loop. The AI thinks, acts, observes, and thinks again. The _loop structure_ is hardcoded — think → act → observe — but the _content_ of each thought and the _choice of action_ are generated dynamically by the model. The topology is fixed (a circle), but the transitions are dynamic.

**Google Antigravity** (referred to hereafter as **Antigravity**) is the closest to breaking the rule — but it doesn't quite. It gives the AI a _menu_ of pre-defined workers. The developer writes the menu — "Here are 5 specialist agents you can call" — and the AI decides which ones to invoke, when, and in what order. The topology is still designed by a human, but the _sequence_ is chosen by the model. The model selects from the menu; it does not write the menu.

These four systems span three decades of distributed computing. They all share one trait: **a human designed the graph, and the system executed it.**

### The Computer Science

| System                                   | Topology                                      | Who moves the data?                               | Who decides the next step?          | Who designed the graph?             |
| ---------------------------------------- | --------------------------------------------- | ------------------------------------------------- | ----------------------------------- | ----------------------------------- |
| **Grid**                                 | Static star                                   | Human-written scheduler routes chunks to workers  | Human script                        | **Human engineer**                  |
| **MapReduce**                            | Static bipartite shuffle                      | Hash partitioner routes mapper output to reducers | Human map/reduce functions          | **Human engineer**                  |
| **ReAct Agents** _(OpenClaw, Pi, Devin)_ | Fixed linear loop                             | LLM decides which tool to call                    | LLM reasoning inside hardcoded loop | **Human engineer**                  |
| **Antigravity**                          | Dynamic sequence from human-defined templates | LLM selects which pre-defined sub-agent to spawn  | LLM chooses from developer's menu   | **Human engineer** (wrote the menu) |

The ReAct Agent Loop represents a partial decoupling. The topology is still fixed — the ReAct loop is hardcoded — but the transition function is now a learned neural network rather than human code. The LLM decides which tool to call next. However, the graph itself remains immutable. The LLM can choose _which_ tool to call, but it cannot choose _how many parallel reasoning branches_ to spawn. The topology constrains the behavior.

Antigravity extends this one step further. The developer pre-defines `SubagentConfig` templates (name, description, system instructions, allowed tools). The LLM then decides _when_ to invoke the `START_SUBAGENT` tool and _which_ template to instantiate. The topology is dynamic in sequence but static in design space — the model selects from a menu the human wrote. This is "model-selected, developer-defined" topology. It proves that developers want dynamic branching, but they are not yet ready to give the model full control over what the branches look like.

In all four cases, the equation is the same: **a human designed the graph, and the system executed it.**

---

## 3. The Four Human-Designed Topologies

### Grid Computing — The Static Star

```
                    User Job
                       │
                       ▼
              ┌─────────────────┐
              │    Controller   │  ← Human-written scheduler
              │   (Scheduler)   │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Worker 1│   │ Worker 2│   │ Worker N│  ← Identical binaries
   │ (chunk) │   │ (chunk) │   │ (chunk) │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
               ┌─────────────┐
               │   Gather    │  ← Deterministic reduce
               │   (Reduce)  │
               └─────────────┘
```

- **Edges:** Controller → Worker (dispatch), Worker → Controller (result)
- **No worker-worker edges**
- **Graph is immutable after submission**

### MapReduce — The Bipartite Shuffle Graph

```
   Input Splits
        │
        ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Mapper 1│  │ Mapper 2│  │ Mapper M│  ← Map phase (local)
   └────┬────┘  └────┬────┘  └────┬────┘
        │            │            │
        └────────────┼────────────┘
                     ▼
            ┌─────────────────┐
            │     SHUFFLE     │  ← All-to-all crossbar
            │  (Sort / Merge) │    Physical data movement
            │  over network   │
            └────────┬────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │Reducer 1│  │Reducer 2│  │Reducer R│  ← Reduce by key
   └────┬────┘  └────┬────┘  └────┬────┘
        └────────────┼────────────┘
                     ▼
                Output Files
```

- **Edges:** Mapper → Reducer via shuffle (every mapper may connect to every reducer)
- **Partitioner** `hash(key) mod R` routes edges
- **Strict barrier:** All maps complete before any reduce starts

### The ReAct Agent Loop — The Linear Circle

```
   Message (WhatsApp / Slack / IDE)
        │
        ▼
   ┌─────────┐
   │ Gateway │  ← WebSocket router, session manager
   │(Node.js)│    Single process, multi-channel
   └────┬────┘
        │
        ▼
   ┌─────────────┐
   │Agent Runtime│  ← Loads session from disk
   │  (Pi Core)  │    Assembles prompt:
   └──────┬──────┘    AGENTS.md + SOUL.md + skills + memory
          │
          ▼
     ┌─────────┐
     │   LLM   │  ← Single model call
     │(Claude /│
     │  GPT)   │
     └────┬────┘
          │
          ▼
      Tool Call? ──No──► Return response to Gateway
          │
         Yes
          │
          ▼
     ┌─────────┐
     │Tool Exec│  ← bash, browser, file I/O
     │(sandbox)│
     └────┬────┘
          │
          └──► Observation back to LLM
                   ↑
                   └── Loop repeats
```

- **Implementations:** This exact architecture powers the core loops of **OpenClaw, Pi, Devin, Cursor (background agents), and OpenHands**.
- **Edges:** Strictly linear — Gateway → Runtime → LLM → Tools → Runtime → LLM → ... → Gateway
- **No parallelism within a single agent session**
- **State persists to disk** between turns

### Google Antigravity — The Model-Selected Menu

```
                    User Query
                        │
                        ▼
              ┌─────────────────┐
              │      LLM        │  ← Decides WHEN to branch
              │  (Main Agent)   │     and WHICH template to use
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │Sub-Agent│   │Sub-Agent│   │Sub-Agent│  ← Pre-defined by developer
   │Template A│  │Template B│  │Template C│    (name, description, tools)
   │(financial)│  │(legal)  │  │(research)│
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
              ┌─────────────────┐
              │      LLM        │  ← Synthesizes results
              │  (Main Agent)   │     May spawn more from menu
              └─────────────────┘
```

- **Edges:** Main Agent → Sub-agent (via `START_SUBAGENT` tool call)
- **Templates are human-defined:** `SubagentConfig` with name, description, system instructions
- **Selection is model-driven:** LLM decides which template to instantiate and when
- **Dynamic sequence, static design space**

---

## 4. The Breakthrough: When the Model Started Computing the Graph

### The Simple Story

And then there is Kimi Agent Swarm. It does something none of the four above can do: **it draws the graph while walking it.**

You give it a research task — say, "Should we invest in this company?" — and instead of following a pre-drawn star or shuffle, or selecting from a pre-written menu, it does this:

1. **Reads the task.** Its orchestrator thinks: _I need financials, leadership history, and competitive landscape._
2. **Spawns workers.** It launches 10 sub-agents in parallel, each with a different assignment. Not because a human told it to. Not because it picked from a menu. Because its weights — trained by reinforcement learning — say this task benefits from parallel exploration.
3. **Waits, then re-plans.** Some agents find conflicting information. One says revenue grew 12%; another says it declined due to currency risk. The orchestrator notices the gap.
4. **Redraws the graph.** It spawns 3 more agents specifically to resolve the conflict. The topology just changed mid-flight.
5. **Synthesizes.** It merges all findings into a final answer.

There is no blueprint. There is no menu. The orchestrator is not following a graph. It is **computing the graph** at every step.

This is the "after" picture. Everything before this section was the "before."

### The Computer Science

Here is the precise mechanism that makes this possible.

#### The Orchestrator’s Action Space

The orchestrator is not a separate program. It is the same neural network running in a different mode. At each step, it emits one of two **structured actions** that change the topology:

| Action     | What the orchestrator outputs                                                                                  | What happens next                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **SPAWN**  | A list of task description strings (e.g., `["Analyze Q3 revenue", "Find CEO background", "List competitors"]`) | N frozen copies of the base model are instantiated, each with one description as its prompt |
| **FINISH** | Final answer to the user                                                                                       | Termination                                                                                 |

Creating a sub-agent is an action in the model's action space — the same way calling a tool is. The orchestrator does not write Python code to spawn a process. It outputs a token sequence that the runtime interprets as "create N new contexts with these task descriptions."

**Everything else the orchestrator generates is just reasoning.** When the model outputs text like _"I notice a conflict between the revenue figures. Let me investigate further,"_ that text is appended to its own context window, and the loop repeats. There is no separate "SYNTHESIZE" action. Synthesis is the default state — what happens when the model is not emitting SPAWN or FINISH.

#### Strictly Two-Level Hierarchy

The architecture is **not recursive**. Sub-agents cannot spawn more sub-agents. The hierarchy is:

```
Orchestrator (trainable, can emit SPAWN actions)
    ├── Sub-Agent 1 (frozen, can only think / tool_call / finish)
    ├── Sub-Agent 2 (frozen, can only think / tool_call / finish)
    └── Sub-Agent N (frozen, can only think / tool_call / finish)
```

This is intentional. If sub-agents could spawn workers, and the final answer was wrong, you would not know whether to blame the root orchestrator, a mid-level sub-agent, or a leaf worker. By freezing sub-agents and training only the orchestrator, the reinforcement learning signal has a single, clear target.

#### The Worker Is “Just a Prompt”

All sub-agents are **identical copies** of the same base model. They share the same weights. They have the same tools. The only difference between Worker A and Worker B is the text in their context window.

When the orchestrator emits a SPAWN action with task description _"Analyze Q3 revenue trends"_, that string becomes the sub-agent's system prompt. The sub-agent receives:

```
[Task from Orchestrator]: Analyze Q3 revenue trends and identify forex risks.
[Available Tools]: web_search, read_url, calculator
[Constraints]: Return only key conclusions. Do not write full reports.
```

The sub-agent then runs its own ReAct loop — thinking, searching, calculating — within that assigned scope. It decides **which tool to call** and **what search query to write**. The orchestrator assigns the goal; the worker figures out the method.

#### Parallel Execution

If the orchestrator spawns 10 sub-agents simultaneously, 10 independent forward passes happen in parallel. Each sub-agent:

- Has the same base model weights (frozen)
- Has a **different task description** in its context window
- Has independent tool access
- **Cannot see what other sub-agents are doing**

#### Results Flow Back

Each sub-agent returns not a full transcript, but **key conclusions** — compressed reasoning traces. The orchestrator's context window is updated with:

```
[Sub-agent #3 result]: Revenue grew 12% YoY but forex headwinds masked weakness.
[Sub-agent #7 result]: CEO changed in Q2; new strategy focuses on APAC expansion.
```

The orchestrator then runs another forward pass on this updated state. If it emits more reasoning text, that text is appended to context and the loop repeats. If it emits SPAWN, new sub-agents are launched. If it emits FINISH, the answer is returned.

---

## 5. The Five Execution Loops: From Dispatch to Emergence

Every system in this article is a loop. The difference is **who writes the transition logic** and **where the topology lives**.

> **Why five loops but only four topologies?** Generation 1 (Grid) and Generation 4 (Antigravity) both use a Star topology. What separates them is the execution loop: a deterministic human `for`-loop versus a probabilistic LLM `while`-loop. The shape of the wiring didn't change — the brain driving it did.

### Generation 1: Grid Computing — The Human Dispatch Loop

```python
# The topology is hardcoded: one controller, N workers.
# The transition function is the human-written script.

def run_grid_job(input_data, num_workers):
    chunks = split(input_data, num_workers)  # Human decides decomposition
    results = []
    for chunk in chunks:
        results.append(worker.process(chunk))  # Static dispatch
    return reduce(results)  # Human-written aggregation

# The graph never changes. The loop never branches dynamically.
# The "state machine" is the for-loop itself.
```

**Key:** The transition from "dispatching chunk i" to "dispatching chunk i+1" is the `for` loop increment. The topology is the array `chunks`, created before the loop starts.

---

### Generation 2: MapReduce — The Framework-Enforced Pipeline

```python
# The topology is hardcoded: map → shuffle → reduce.
# The transition function is the hash partitioner.

def run_mapreduce(inputs):
    # Phase 1: Map (human writes the map function)
    mapped = []
    for record in inputs:
        mapped.extend(mapper.map(record))

    # Phase 2: Shuffle (framework handles this — human does not write it)
    shuffled = framework.shuffle(mapped, key=hash)

    # Phase 3: Reduce (human writes the reduce function)
    results = {}
    for key, values in shuffled.items():
        results[key] = reducer.reduce(key, values)

    return results

# The graph is immutable. The barrier (shuffle) is a hard sync point.
```

**Key:** The transition from map to reduce is not a decision. It is a **framework-enforced barrier**. The human fills in the node logic; the framework draws the edges.

---

### Generation 3: The ReAct Agent Loop — The Fixed Circle

```python
# Implementations: OpenClaw, Pi, Devin, Cursor, OpenHands
# The topology is hardcoded: a circle.
# The transition function is the LLM deciding which tool to call.

def run_react_agent(user_message):
    context = [user_message]
    while True:
        # Call the model
        response = llm.generate(context)

        if response.has_tool_call:
            # Execute the tool the LLM chose
            tool_result = execute_tool(response.tool_name, response.tool_args)
            context.append(tool_result)  # Observation feeds back
        else:
            # LLM decided to answer directly
            return response.text

        # Loop continues. The topology never branches.
        # There is only ONE path: LLM → Tool → LLM → Tool → ...
```

**Key:** The LLM decides _which_ tool to call, but it cannot decide _how many parallel branches_ to create. The loop structure is hardcoded. The state space is the context window, but the topology is a single line.

---

### Generation 4: Google Antigravity — The Model-Selected Menu Loop

```python
# The topology is dynamic in sequence, but static in design space.
# The developer writes a menu. The LLM picks from it.

SUBAGENT_MENU = {
    "financial_analyst": SubagentConfig(tools=[search_web, calculator]),
    "legal_reviewer": SubagentConfig(tools=[search_web, read_pdf]),
    "competitor_researcher": SubagentConfig(tools=[search_web, scrape_url]),
}

def run_antigravity_agent(user_message):
    context = [user_message]
    while True:
        response = llm.generate(context, available_tools=["START_SUBAGENT", "FINISH"])

        if response.action == "START_SUBAGENT":
            # LLM picks WHICH template from the menu
            template = SUBAGENT_MENU[response.subagent_name]

            # Runtime instantiates ONE sub-agent from the template
            result = run_subagent(template, task=response.task_description)
            context.append(result)

        elif response.action == "FINISH":
            return response.answer

        # The LLM can spawn multiple times, but only from the pre-written menu.
        # It cannot invent a new kind of worker.
```

**Key:** The LLM decides _when_ to branch and _which_ template to use, but the developer wrote the templates. The transition function selects from a finite set. The topology is dynamic in sequence but bounded by the menu.

---

### Generation 5: Kimi Agent Swarm — The Model-Computed Topology Loop

```python
# The topology is computed at runtime.
# The transition function is the orchestrator model. It invents tasks on the fly.

def run_kimi_swarm(user_message):
    orchestrator_context = [user_message]

    while True:
        # ONE forward pass through the orchestrator
        # (e.g., the 2.8T-parameter Kimi K3 model)
        output = orchestrator_model.generate(orchestrator_context)

        # CASE 1: Model emitted SPAWN directive
        if output.spawn_tasks:
            # The model decides HOW MANY and WHAT EACH DOES
            # These task descriptions are NOT from a menu. They are generated.
            tasks = output.spawn_tasks

            # Runtime launches N parallel sub-agents
            # Each runs its own independent ReAct loop internally
            results = await asyncio.gather(
                *[run_subagent(task) for task in tasks],
                return_exceptions=True
            )

            # Append key conclusions back to orchestrator context
            for result in results:
                if not isinstance(result, Exception):
                    orchestrator_context.append(result.key_conclusion)

            # Loop continues → orchestrator called again with new context

        # CASE 2: Model emitted FINISH directive
        elif output.finish_answer:
            return output.finish_answer

        # CASE 3: Model generated reasoning text (the default)
        # This is NOT a separate action. It is the orchestrator thinking.
        # The text is appended to its own context, and the loop repeats.
        else:
            orchestrator_context.append(output.text)
            # e.g., "I notice a conflict between revenue growth and market share loss..."
            # Loop continues immediately

        # The topology is different on every iteration.
        # Iteration 1: SPAWN 10 agents
        # Iteration 2: reasoning text (synthesis)
        # Iteration 3: reasoning text (more synthesis)
        # Iteration 4: SPAWN 3 agents (gap-filling)
        # Iteration 5: FINISH
```

**Key:** The orchestrator has only two **state-changing transitions** — SPAWN (creates topology) and FINISH (terminates). Everything else is the model staying in the same state, generating reasoning text that gets appended to its own context. The transition function is:

$$\text{State } s_t \xrightarrow{f_\theta} (\text{Next State } s_{t+1}, \text{ Next Topology } G_{t+1})$$

Where $f_\theta$ is the orchestrator model. When the output is reasoning text, $G_{t+1} = \emptyset$ (no topology change). When the output is SPAWN, $G_{t+1}$ is the set of task descriptions emitted at step $t$.

---

## 6. The Fifth Topology: The Dynamic Two-Level Star

```
                    User Query
                        │
                        ▼
              ┌─────────────────┐
              │   Orchestrator  │  ← Trainable; emits SPAWN / FINISH
              │    (Step 1)     │     or generates reasoning text
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │Sub-Agent│   │Sub-Agent│   │Sub-Agent│  ← Frozen model copies
   │   #1    │   │   #2    │   │   #N    │     (think / tool_call / finish only)
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
              ┌─────────────────┐
              │   Orchestrator  │  ← Step 2: Reads key conclusions,
              │   (Re-plan)     │     generates reasoning text,
              └────────┬────────┘     or emits SPAWN / FINISH
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
       ┌─────────┐           ┌─────────┐
       │Sub-Agent│           │Sub-Agent│  ← Dynamically spawned
       │  #N+1   │           │  #N+2   │     to resolve gaps
       └────┬────┘           └────┬────┘
            └──────────┬──────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Orchestrator  │  ← Step 3: Final synthesis
              │  (Output to user)│
              └─────────────────┘
```

- **Edges:** Orchestrator ↔ Sub-agent only. No sub-agent → sub-agent edges.
- **Graph mutates at runtime** — new nodes spawned based on intermediate results
- **Orchestrator is both scheduler and reducer**

---

## 7. Why Now: The Three Constraints That Had to Fall

### The Simple Story

Three things had to change before a system could compute its own topology.

**First: States had to stop being labels.** In old systems, a "state" was something you listed out: "State 1: waiting. State 2: processing." If you had too many states, the list exploded. So engineers kept the state space small by fixing the graph. AI models don't use lists. They use **continuous meaning** — vectors in a high-dimensional space. The state is "everything the model currently understands," and that space is effectively infinite. You no longer need a small graph to keep the state space manageable.

**Second: The transition function had to stop being code.** In old systems, someone had to write the `if` statements that decided what to do next. If you wanted the topology to change dynamically, you'd need to write `if` statements for every possible topology. That's impossible. Neural networks are universal function approximators. They _are_ the transition function. You train them, you don't code them.

**Third: Workers had to stop being machines.** In old systems, a "worker" was a physical computer with an IP address, a disk, and a network cable. You couldn't spontaneously create a new one mid-job. In Kimi, a worker is just a **prompt** — a copy of the same model given a different instruction. Creating one is as cheap as a forward pass.

When these three constraints fell, the decades-long coupling between state machine and topology snapped.

### The Computer Science

The decoupling was impossible in classical systems due to three fundamental constraints:

**1. Finite, enumerable state spaces.** Classical state machines require the state set to be finite. The transition function is effectively a lookup table. For large state spaces, this table is intractable. Engineers compressed the state space by fixing the graph — the topology _was_ the state-space compression mechanism.

Neural networks operate on **continuous state spaces** — vectors in $\mathbb{R}^n$. The orchestrator's state is its context window: a point in embedding space. The state space is implicit and unbounded. Recent theoretical work shows that neural networks with ReLU activations can implement arbitrary discrete transition functions by encoding states as vectors:

> "The transition function $\delta: Q \times \Sigma \rightarrow Q$ can be written as a function $g: \mathbb{R}^n \times \mathbb{R}^k \rightarrow \mathbb{R}^n$... and can therefore be implemented using a feedforward layer with ReLU activations." _(Tiwari et al., arXiv:2507.20853)_

**2. Human-written transition functions.** Dynamic topologies require the transition function to compute the next graph at runtime. In classical systems, the transition function was code written by a human. Anticipating every possible graph is combinatorially impossible. Neural networks are **universal function approximators** that implement the transition function directly from data.

**3. Physical, heterogeneous, stateful workers.** Classical workers are machines with network addresses, local storage, and heterogeneous capabilities. Dynamic topology changes require infrastructure provisioning (VM allocation, network reconfiguration, storage mounting).

Kimi's sub-agents are **homogeneous, stateless, and interchangeable** frozen model copies. All persistent state lives in the orchestrator's context window. Communication is not TCP/IP; it is **attention-mediated** — the orchestrator attending to sub-agent output tokens. Spawning a worker is a forward pass, not a datacenter operation.

The result is a new class of system where the transition function computes both the next state and the next topology:

$$\text{State } s_t \xrightarrow{f_\theta} (\text{Next State } s_{t+1}, \text{ Next Topology } G_{t+1})$$

The topology is an **emission** of the state machine, not its substrate.

---

## 8. The Paradigm Shift: From Architect to Trainer

### The Simple Story

The shift is deeper than "AI makes things faster." It is a change in **who designs the system.**

- In grid computing, **you** drew the star.
- In MapReduce, **you** designed the shuffle.
- In the ReAct loop, **you** hardcoded the circle.
- In Antigravity, **you** wrote the menu; the model picked the dishes.
- In Kimi, **the model computes the graph.**

You are no longer an architect drawing blueprints. You are a trainer teaching the system to architect itself. The topology is not designed; it is **discovered**.

This matters because some problems have no good static graph. A research task might need 5 parallel searches, then 0, then 12, then synthesis, then 3 more targeted probes. No human can draw the optimal graph for every possible query. But a learned transition function, trained on thousands of tasks, can discover the right graph for each one.

### The Computer Science

We propose a taxonomy of distributed systems based on the coupling between state machine and topology:

| Generation          | Loop Structure                                                  | Who decides the next step?                     | Who decides the graph?                                | Example             |
| ------------------- | --------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- | ------------------- |
| **1st (Grid)**      | `for chunk in chunks: worker.process(chunk)`                    | Human script                                   | **Human** (array of chunks)                           | MPI clusters        |
| **2nd (MapReduce)** | `map() → framework.shuffle() → reduce()`                        | Human map/reduce functions                     | **Human + Framework** (hash partitioner)              | Hadoop, Spark       |
| **3rd (ReAct)**     | `while True: llm.generate() → tool.execute()`                   | LLM (which tool?)                              | **Human** (hardcoded loop)                            | OpenClaw, Pi, Devin |
| **4th (Menu)**      | `while True: llm.generate() → spawn(template)`                  | LLM (which template?)                          | **Human** (wrote the menu); **LLM** (selects from it) | Antigravity SDK     |
| **5th (Swarms)**    | `while True: orchestrator.generate() → spawn(N tasks) or think` | **LLM** (how many? what tasks? or just think?) | **LLM** (computes graph on the fly)                   | Kimi PARL           |

This decoupling creates a new research agenda in distributed systems:

- **Topology synthesis:** Can we formally verify properties of emergent topologies?
- **Critical path optimization:** How do we train the transition function to minimize wall-clock time when the graph is not known a priori?
- **Semantic reduce:** How do we aggregate results when the reduce operation is non-associative and context-dependent?
- **State compression:** How large can the orchestrator's context window grow before it becomes the bottleneck?
- **Template vs. emergent design:** When should developers provide `SubagentConfig` menus (Antigravity) versus training fully emergent orchestrators (Kimi)?

---

## 9. Conclusion: The Topology as an Emission

This paper has traced a structural change in distributed systems: the relocation of the transition function from engineered control logic to learned model parameters. Earlier generations did not lack dynamism; rather, their dynamism was bounded by human-authored structures. The graph could be selected, sequenced, or parameterized, but it was not generated by the runtime state machine itself.

Learned agent swarms alter this relationship. The orchestrator does not merely choose a path through a predefined graph; it produces task decomposition and sub-agent creation as part of its state transition. In this setting, the topology is better understood as an observable output of the policy:

$$
(s_{t+1}, G_{t+1}) = f_\theta(s_t)
$$

where \(s*t\) is the orchestrator state and \(G*{t+1}\) is the topology emitted at step \(t\). The practical consequence is that system design shifts from specifying each graph instance to specifying the conditions under which graphs may be generated: the action space, resource limits, communication constraints, termination criteria, and training objective.

This reframing also changes the research agenda. If topology is learned, then distributed systems must incorporate methods for verifying emergent graphs, attributing failure across dynamically created workers, optimizing non-stationary critical paths, and aggregating semantic results without deterministic reduce operations. The topology becomes an object of governance and evaluation, not only a substrate for execution.

In engineered distributed systems, topology was an input to computation. In learned agent swarms, topology is an output of computation.

---

## Afterword: From Ephemeral Topologies to Persistent Coordination

This article has traced one decoupling: the separation of topology from human design. In classical systems, the graph was engineered before execution. In learned agent swarms, the graph is generated at runtime by the orchestrator’s policy. However, even in these systems, the topology remains coupled to the lifetime of a single query. The orchestrator computes a graph, executes it, and discards it.

A second decoupling is likely to follow: the separation of agent state from the lifetime of a single request. In such systems, agents would not operate only within an ephemeral task graph. They would read from and write to a persistent shared state that outlives individual queries. Task structure would not be emitted once by a central orchestrator; it would emerge incrementally as agents observe state changes, claim available work, propose transitions, and request authorization.

In this architecture, human approval would become a first-class state transition rather than an external interruption. A system could pause, persist its state, wait for authorization, resume, or roll back without losing the execution context. The topology would therefore be less like a plan emitted by a single controller and more like a coordination structure negotiated over time.

This direction raises new research questions: how persistent agent state should be represented, how concurrent agents avoid conflicting transitions, how responsibility is attributed when no single orchestrator emits the graph, how safety constraints are enforced over long-running processes, and how human oversight can be integrated without making the system brittle. These questions suggest that the next stage of distributed agentic systems will not merely be about computing topologies, but about governing them over time.

---

## References

- Dean, J., & Ghemawat, S. (2004). _MapReduce: Simplified Data Processing on Large Clusters._ OSDI'04.
- Google. (2026). _Google Antigravity SDK._ github.com/google-antigravity/antigravity-sdk-python.
- Ha, D., & Schmidhuber, J. (2018). _World Models._ arXiv:1803.10122.
- Hu, J., Cui, J., & Yang, B. (2025). _Learning interpretable network dynamics via universal neural symbolic regression._ Nature Communications, 16(1), 6226.
- Moonshot AI. (2026). _Kimi K2.5 Tech Blog: Visual Agentic Intelligence._ kimi.com/blog/kimi-k2-5.
- Moonshot AI. (2026). _Kimi K3 Tech Blog: Open Frontier Intelligence._ kimi.com/blog/kimi-k3.
- MoClaw Blog. (2026). _Kimi K3 Agent Swarm: 300 Parallel Agents._ moclaw.ai/blog/kimi-k3-agent-swarm.
- Morph. (2026). _Kimi K2.5: Agent Swarm, Visual Coding, and Why It Matters._ morphllm.com/kimi-k2-5-agent-swarm.
- Nagabandi, A., et al. (2017). _Model-based Reinforcement Learning with Neural Network Dynamics._ BAIR Blog.
- Tiwari, S., Gottesman, O., & Konidaris, G. (2025). _Geometry of Neural Reinforcement Learning in Continuous State and Action Spaces._ arXiv:2507.20853.
- Wang, Y., Gao, Q., & Pajic, M. (2022). _Learning Monotone Dynamics by Neural Networks._ American Control Conference (ACC).
- Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). _ReAct: Synergizing Reasoning and Acting in Language Models._ International Conference on Learning Representations (ICLR).

[<<< Back to all articles](/pages/articles)
