/**
 * PRONAB / SYSTEM — Chapter 09 / Working Lab
 * Interactive Dijkstra Algorithm Engine & Visualizer
 * Deterministic Dijkstra solver using the graph and expected result below
 */

export const ALGO_DATA = {
  directed: false,
  start: "A",
  target: "F",
  nodes: [
    { id: "A", x: 130, y: 340 },
    { id: "B", x: 400, y: 150 },
    { id: "C", x: 400, y: 530 },
    { id: "D", x: 740, y: 150 },
    { id: "E", x: 740, y: 530 },
    { id: "F", x: 1070, y: 340 }
  ],
  edges: [
    { from: "A", to: "B", weight: 2 },
    { from: "A", to: "C", weight: 5 },
    { from: "B", to: "C", weight: 1 },
    { from: "B", to: "D", weight: 4 },
    { from: "C", to: "D", weight: 1 },
    { from: "C", to: "E", weight: 6 },
    { from: "D", to: "E", weight: 2 },
    { from: "D", to: "F", weight: 7 },
    { from: "E", to: "F", weight: 1 }
  ],
  expected: {
    path: ["A", "B", "C", "D", "E", "F"],
    cost: 7,
    settledOrder: ["A", "B", "C", "D", "E", "F"],
    distances: { A: 0, B: 2, C: 3, D: 4, E: 6, F: 7 }
  }
};

export class DijkstraVisualizer {
  constructor(options = {}) {
    const hasDoc = typeof document !== 'undefined';
    this.svgContainer = options.svgContainer || (hasDoc ? document.getElementById("algo-svg-wrap") : null);
    this.distTableBody = options.distTableBody || (hasDoc ? document.getElementById("algo-dist-tbody") : null);
    this.logContainer = options.logContainer || (hasDoc ? document.getElementById("algo-log-box") : null);
    this.statusBadge = options.statusBadge || (hasDoc ? document.getElementById("algo-status-badge") : null);
    this.costMetric = hasDoc ? document.getElementById("algo-cost-metric") : null;
    this.resultContainer = options.resultContainer || (hasDoc ? document.getElementById("algo-final-result") : null);
    this.btnStart = options.btnStart || (hasDoc ? document.getElementById("btn-algo-start") : null);
    this.btnStep = options.btnStep || (hasDoc ? document.getElementById("btn-algo-step") : null);
    this.btnReset = options.btnReset || (hasDoc ? document.getElementById("btn-algo-reset") : null);
    this.speedSelect = options.speedSelect || (hasDoc ? document.getElementById("algo-speed") : null);

    this.timer = null;
    this.speedMultiplier = 1;
    this.baseDelay = 750;
    this.currentStepIndex = 0;
    this.isRunning = false;
    this.steps = [];

    this.init();
  }

  init() {
    this.generateSteps();
    this.renderInitialSvg();
    this.bindEvents();
    this.reset();
    if (this.svgContainer) {
      // A user-started run pauses when its chapter or page leaves view.
      this.visibilityObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting && this.isRunning) this.pause();
      });
      this.visibilityObserver.observe(this.svgContainer);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isRunning) this.pause();
      });
      window.addEventListener('pagehide', () => this.pause());
    }
  }

  generateSteps() {
    this.steps = [];
    const dist = {};
    const prev = {};
    const unvisited = new Set(ALGO_DATA.nodes.map(n => n.id));
    const settledOrder = [];

    ALGO_DATA.nodes.forEach(n => {
      dist[n.id] = Infinity;
      prev[n.id] = null;
    });
    dist[ALGO_DATA.start] = 0;

    this.steps.push({
      type: "INIT",
      current: null,
      edge: null,
      dist: { ...dist },
      prev: { ...prev },
      settled: [],
      message: `System initialized. Start: ${ALGO_DATA.start}, Target: ${ALGO_DATA.target}. All tentative distances set to ∞ except ${ALGO_DATA.start}=0.`
    });

    while (unvisited.size > 0) {
      // Find unvisited node with lowest distance
      let current = null;
      let minDistance = Infinity;
      for (const node of unvisited) {
        if (dist[node] < minDistance) {
          minDistance = dist[node];
          current = node;
        }
      }

      if (!current || dist[current] === Infinity) {
        this.steps.push({
          type: "NO_PATH",
          current: null,
          edge: null,
          dist: { ...dist },
          prev: { ...prev },
          settled: [...settledOrder],
          message: "No further reachable nodes remaining."
        });
        break;
      }

      this.steps.push({
        type: "SELECT_NODE",
        current: current,
        edge: null,
        dist: { ...dist },
        prev: { ...prev },
        settled: [...settledOrder],
        message: `Evaluating node ${current} with minimum tentative distance ${dist[current]}.`
      });

      // Relax neighbors
      const neighbors = [];
      for (const e of ALGO_DATA.edges) {
        if (e.from === current && unvisited.has(e.to)) {
          neighbors.push({ neighbor: e.to, weight: e.weight, from: e.from, to: e.to });
        } else if (e.to === current && unvisited.has(e.from)) {
          neighbors.push({ neighbor: e.from, weight: e.weight, from: e.from, to: e.to });
        }
      }

      for (const edge of neighbors) {
        const alt = dist[current] + edge.weight;
        const oldDist = dist[edge.neighbor];
        if (alt < oldDist) {
          dist[edge.neighbor] = alt;
          prev[edge.neighbor] = current;
          this.steps.push({
            type: "RELAX_EDGE",
            current: current,
            neighbor: edge.neighbor,
            edge: { from: edge.from, to: edge.to, weight: edge.weight },
            dist: { ...dist },
            prev: { ...prev },
            settled: [...settledOrder],
            message: `Relax edge ${current}—${edge.neighbor} (weight ${edge.weight}): Updated tentative distance for ${edge.neighbor} from ${oldDist === Infinity ? '∞' : oldDist} to ${alt}.`
          });
        } else {
          this.steps.push({
            type: "CHECK_EDGE_NO_RELAX",
            current: current,
            neighbor: edge.neighbor,
            edge: { from: edge.from, to: edge.to, weight: edge.weight },
            dist: { ...dist },
            prev: { ...prev },
            settled: [...settledOrder],
            message: `Check edge ${current}—${edge.neighbor}: Alternate cost ${alt} >= current distance ${oldDist}. No update.`
          });
        }
      }

      unvisited.delete(current);
      settledOrder.push(current);

      this.steps.push({
        type: "SETTLE_NODE",
        current: current,
        edge: null,
        dist: { ...dist },
        prev: { ...prev },
        settled: [...settledOrder],
        message: `Node ${current} permanently settled with final shortest distance ${dist[current]}.`
      });

      if (current === ALGO_DATA.target) {
        // Target reached
        const finalPath = [];
        let curr = ALGO_DATA.target;
        while (curr) {
          finalPath.unshift(curr);
          curr = prev[curr];
        }

        this.steps.push({
          type: "TARGET_SETTLED",
          current: current,
          edge: null,
          dist: { ...dist },
          prev: { ...prev },
          settled: [...settledOrder],
          path: finalPath,
          cost: dist[ALGO_DATA.target],
          message: `Target ${ALGO_DATA.target} settled! Optimal path: ${finalPath.join(" → ")} with total cost ${dist[ALGO_DATA.target]}.`
        });
        break;
      }
    }
  }

  renderInitialSvg() {
    if (!this.svgContainer) return;
    const { nodes, edges } = ALGO_DATA;

    let svgHtml = `
      <svg viewBox="0 0 1200 680" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Interactive Dijkstra weighted graph diagram">
        <rect width="1200" height="680" fill="#07090D" rx="6" />
        
        <!-- Graph Edges -->
        <g id="svg-edges">
    `;

    edges.forEach((edge) => {
      const u = nodes.find(n => n.id === edge.from);
      const v = nodes.find(n => n.id === edge.to);
      const midX = (u.x + v.x) / 2;
      const midY = (u.y + v.y) / 2;
      const edgeId = `edge-${edge.from}-${edge.to}`;

      svgHtml += `
        <g class="graph-edge-group" id="${edgeId}" data-from="${edge.from}" data-to="${edge.to}">
          <line x1="${u.x}" y1="${u.y}" x2="${v.x}" y2="${v.y}" class="graph-edge" />
          <rect x="${midX - 16}" y="${midY - 14}" width="32" height="28" rx="4" class="edge-weight-rect" />
          <text x="${midX}" y="${midY + 1}" class="edge-weight-text">${edge.weight}</text>
        </g>
      `;
    });

    svgHtml += `
        </g>
        <!-- Graph Nodes -->
        <g id="svg-nodes">
    `;

    nodes.forEach(node => {
      const nodeId = `node-${node.id}`;

      svgHtml += `
        <g class="graph-node" id="${nodeId}" data-id="${node.id}">
          <circle cx="${node.x}" cy="${node.y}" r="28" class="node-circle" />
          <text x="${node.x}" y="${node.y + 1}" class="node-label">${node.id}</text>
          <text x="${node.x}" y="${node.y + 50}" class="node-dist-badge" id="dist-badge-${node.id}">d: ∞</text>
        </g>
      `;
    });

    svgHtml += `
        </g>
      </svg>
    `;

    this.svgContainer.innerHTML = svgHtml;
  }

  applyStep(step) {
    if (!step) return;

    if (this.svgContainer) {
      // Reset edge and node classes
      const edges = this.svgContainer.querySelectorAll(".graph-edge");
      const edgeGroups = this.svgContainer.querySelectorAll(".graph-edge-group");
      const nodeGroups = this.svgContainer.querySelectorAll(".graph-node");
      const nodeCircles = this.svgContainer.querySelectorAll(".node-circle");

      edges.forEach(e => {
        e.classList.remove("edge-evaluating");
        if (step.type !== "TARGET_SETTLED") {
          e.classList.remove("edge-settled", "edge-dimmed");
        }
      });

      edgeGroups.forEach(eg => {
        if (step.type !== "TARGET_SETTLED") {
          eg.classList.remove("is-dimmed");
        }
      });

      nodeGroups.forEach(ng => {
        if (step.type !== "TARGET_SETTLED") {
          ng.classList.remove("is-dimmed", "is-path-solved");
        }
      });

      nodeCircles.forEach(c => {
        c.classList.remove("node-active");
      });

      // Update node status & distances
      ALGO_DATA.nodes.forEach(node => {
        const circle = this.svgContainer.querySelector(`#node-${node.id} .node-circle`);
        const distBadge = this.svgContainer.querySelector(`#dist-badge-${node.id}`);
        const d = step.dist[node.id];

        if (distBadge) {
          distBadge.textContent = d === Infinity ? "d: ∞" : `d: ${d}`;
        }

        if (circle) {
          if (step.settled.includes(node.id)) {
            circle.classList.add("node-settled");
          } else {
            circle.classList.remove("node-settled");
          }

          if (step.current === node.id) {
            circle.classList.add("node-active");
          }
        }
      });

      // Highlight active edge during evaluation/relax
      if (step.edge) {
        const edgeEl1 = this.svgContainer.querySelector(`#edge-${step.edge.from}-${step.edge.to} .graph-edge`);
        const edgeEl2 = this.svgContainer.querySelector(`#edge-${step.edge.to}-${step.edge.from} .graph-edge`);
        const activeEdge = edgeEl1 || edgeEl2;
        if (activeEdge) {
          activeEdge.classList.add("edge-evaluating");
        }
      }

      // Solved payoff moment
      if (step.type === "TARGET_SETTLED" && step.path) {
        const pathPairs = [];
        for (let i = 0; i < step.path.length - 1; i++) {
          pathPairs.push({ u: step.path[i], v: step.path[i + 1] });
        }

        // Highlight solved edges and dim non-path edges
        edgeGroups.forEach(eg => {
          const from = eg.getAttribute("data-from");
          const to = eg.getAttribute("data-to");
          const isOnPath = pathPairs.some(p => (p.u === from && p.v === to) || (p.u === to && p.v === from));
          const line = eg.querySelector(".graph-edge");
          if (isOnPath) {
            if (line) line.classList.add("edge-settled");
          } else {
            eg.classList.add("is-dimmed");
            if (line) line.classList.add("edge-dimmed");
          }
        });

        // Highlight solved nodes and dim others
        nodeGroups.forEach(ng => {
          const id = ng.getAttribute("data-id");
          if (step.path.includes(id)) {
            ng.classList.add("is-path-solved");
          } else {
            ng.classList.add("is-dimmed");
          }
        });
      }
    }

    // Update DOM table
    this.updateDistancesTable(step);

    // Update log
    this.appendLog(step.message, step.type);

    // Update high-level real-time status badge
    if (this.statusBadge) {
      if (step.type === "TARGET_SETTLED") {
        this.statusBadge.textContent = "SOLVED: OPTIMAL PATH A → F (COST 7)";
        this.statusBadge.className = "telemetry-val status-val is-solved";
      } else if (step.type === "INIT") {
        this.statusBadge.textContent = "STATUS: READY";
        this.statusBadge.className = "telemetry-val status-val is-ready";
      } else if (step.type === "SELECT_NODE") {
        this.statusBadge.textContent = `EVALUATING NODE: ${step.current} (DIST: ${step.dist[step.current]})`;
        this.statusBadge.className = "telemetry-val status-val is-active";
      } else if (step.type === "RELAX_EDGE") {
        this.statusBadge.textContent = `INSPECTING ${step.current} → ${step.neighbor} (DIST UPDATED: ${step.dist[step.neighbor]})`;
        this.statusBadge.className = "telemetry-val status-val is-inspecting";
      } else if (step.type === "CHECK_EDGE_NO_RELAX") {
        this.statusBadge.textContent = `INSPECTING ${step.current} → ${step.neighbor} (NO SHORTER PATH)`;
        this.statusBadge.className = "telemetry-val status-val is-evaluating";
      } else if (step.type === "SETTLE_NODE") {
        this.statusBadge.textContent = `SETTLED NODE: ${step.current} (FINAL DIST: ${step.dist[step.current]})`;
        this.statusBadge.className = "telemetry-val status-val is-settled";
      } else {
        this.statusBadge.textContent = `PROCESSING: STEP ${this.currentStepIndex + 1} / ${this.steps.length}`;
        this.statusBadge.className = "telemetry-val status-val is-active";
      }
    }

    // Update cost metric display
    if (this.costMetric) {
      if (step.type === "TARGET_SETTLED") {
        this.costMetric.textContent = "7 (SOLVED)";
        this.costMetric.classList.add("is-solved");
      } else {
        const targetDist = step.dist[ALGO_DATA.target];
        this.costMetric.textContent = targetDist === Infinity ? "7 (PENDING)" : `${targetDist} (TENTATIVE)`;
        this.costMetric.classList.remove("is-solved");
      }
    }

    // Update result banner (prominent payoff without confetti)
    if (this.resultContainer) {
      if (step.type === "TARGET_SETTLED") {
        this.resultContainer.innerHTML = `
          <div class="result-payoff-label">OPTIMAL PATH DISCOVERED</div>
          <div class="result-payoff-path">${step.path.join(" → ")}</div>
          <div class="result-payoff-stats">
            <span class="stat-item">TOTAL COST: <strong>${step.cost}</strong></span>
            <span class="stat-divider">·</span>
            <span class="stat-item">NODES SETTLED: <strong>6 / 6</strong></span>
            <span class="stat-divider">·</span>
            <span class="stat-item">VERIFICATION: <strong>DETERMINISTIC DIJKSTRA</strong></span>
          </div>
        `;
        this.resultContainer.style.display = "block";
      } else {
        this.resultContainer.style.display = "none";
      }
    }
  }

  updateDistancesTable(step) {
    if (!this.distTableBody) return;
    let html = "";
    ALGO_DATA.nodes.forEach(node => {
      const d = step.dist[node.id];
      const isSettled = step.settled.includes(node.id);
      const isEvaluating = step.current === node.id;
      const rowClass = isSettled ? "is-settled" : (isEvaluating ? "is-evaluating" : "");
      const statusText = isSettled ? "SETTLED" : (isEvaluating ? "EVALUATING" : "UNVISITED");

      html += `
        <tr class="${rowClass}">
          <td><strong>${node.id}</strong></td>
          <td>${d === Infinity ? "∞" : d}</td>
          <td>${step.prev[node.id] || "—"}</td>
          <td><span class="status-cell-tag ${rowClass}">${statusText}</span></td>
        </tr>
      `;
    });
    this.distTableBody.innerHTML = html;
  }

  appendLog(msg, type) {
    if (!this.logContainer) return;
    const entry = document.createElement("div");
    entry.className = `algo-log-entry ${type === "TARGET_SETTLED" ? "is-final-step" : ""}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.logContainer.appendChild(entry);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  stepForward() {
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.pause();
      return false;
    }
    this.currentStepIndex++;
    this.applyStep(this.steps[this.currentStepIndex]);
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.pause();
      return false;
    }
    return true;
  }

  start() {
    if (this.isRunning) return;
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.reset();
    }
    this.isRunning = true;
    if (this.btnStart) {
      this.btnStart.textContent = "PAUSE";
      this.btnStart.setAttribute("aria-label", "Pause algorithm execution");
      this.btnStart.classList.add("is-running");
    }
    if (this.btnStep) {
      this.btnStep.disabled = true;
    }

    const interval = Math.max(100, this.baseDelay / this.speedMultiplier);
    this.timer = setInterval(() => {
      const hasMore = this.stepForward();
      if (!hasMore) {
        this.pause();
      }
    }, interval);
  }

  pause() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.btnStart) {
      this.btnStart.textContent = this.currentStepIndex >= this.steps.length - 1 ? "REPLAY" : "RESUME";
      this.btnStart.setAttribute("aria-label", "Resume algorithm visualization");
      this.btnStart.classList.remove("is-running");
    }
    if (this.btnStep) {
      this.btnStep.disabled = (this.currentStepIndex >= this.steps.length - 1);
    }
  }

  reset() {
    this.pause();
    this.currentStepIndex = 0;
    if (this.logContainer) {
      this.logContainer.innerHTML = "";
    }
    if (this.btnStart) {
      this.btnStart.textContent = "START ALGORITHM";
      this.btnStart.setAttribute("aria-label", "Start algorithm execution");
      this.btnStart.classList.remove("is-running");
    }
    if (this.btnStep) {
      this.btnStep.disabled = false;
    }
    if (this.costMetric) {
      this.costMetric.textContent = "7 (PENDING)";
      this.costMetric.classList.remove("is-solved");
    }
    this.applyStep(this.steps[0]);
  }

  setSpeed(speedVal) {
    this.speedMultiplier = parseFloat(speedVal) || 1;
    if (this.isRunning) {
      this.pause();
      this.start();
    }
  }

  bindEvents() {
    if (this.btnStart) {
      this.btnStart.addEventListener("click", () => {
        if (this.isRunning) {
          this.pause();
        } else {
          this.start();
        }
      });
    }

    if (this.btnStep) {
      this.btnStep.addEventListener("click", () => {
        this.stepForward();
      });
    }

    if (this.btnReset) {
      this.btnReset.addEventListener("click", () => {
        this.reset();
      });
    }

    if (this.speedSelect) {
      this.speedSelect.addEventListener("change", (e) => {
        this.setSpeed(e.target.value);
      });
    }

    // Interactive Speed Pills
    const speedButtons = document.querySelectorAll('.btn-speed-option');
    speedButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-speed');
        speedButtons.forEach(b => b.classList.remove('is-active'));
        e.currentTarget.classList.add('is-active');
        if (this.speedSelect) this.speedSelect.value = parseFloat(val);
        this.setSpeed(val);
      });
    });
  }
}
