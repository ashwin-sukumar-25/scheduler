import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ----------------------------
 * CPU SCHEDULER VISUALIZER
 * Algorithms: FCFS, SJF (non-preemptive), Priority (non-preemptive), Round Robin
 * No external libraries. Pure React + CSS (see index.css).
 * Root component: <CPUSchedulerVisualizer />
 * ----------------------------
 *
 * Process shape:
 * { id: string, arrival: number, burst: number, priority: number }
 *
 * Schedule segment shape:
 * { pid: string | "IDLE", start: number, end: number }
 *
 * Timeline ticks (for animation):
 * array of pid-at-each-time-unit e.g. ["P1","P1","P2","IDLE",...]
 */

// ---------- Utilities ----------
const clampInt = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v) || 0)));
const deepClone = (x) => JSON.parse(JSON.stringify(x));
const by = (k) => (a, b) => (a[k] === b[k] ? 0 : a[k] < b[k] ? -1 : 1);

// deterministic color palette for PIDs
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#84cc16", "#ec4899", "#a855f7", "#14b8a6",
  "#f97316", "#22c55e", "#e11d48", "#0ea5e9", "#65a30d"
];
const colorForPid = (pid) => {
  if (pid === "IDLE") return "#9ca3af";
  // hash pid to index
  let h = 0;
  for (let i = 0; i < pid.length; i++) h = ((h << 5) - h) + pid.charCodeAt(i);
  const idx = Math.abs(h) % COLORS.length;
  return COLORS[idx];
};

// ---------- Algorithms (pure functions) ----------
function scheduleFCFS(processes) {
  const procs = deepClone(processes).sort(by("arrival"));
  let time = 0;
  const segments = [];

  for (const p of procs) {
    if (time < p.arrival) {
      // CPU idle until process arrives
      segments.push({ pid: "IDLE", start: time, end: p.arrival });
      time = p.arrival;
    }
    segments.push({ pid: p.id, start: time, end: time + p.burst });
    time += p.burst;
  }
  return segments;
}

// Non-preemptive SJF
function scheduleSJF(processes) {
  const remaining = deepClone(processes);
  remaining.sort(by("arrival"));
  const segments = [];
  let time = 0;

  const ready = [];
  let i = 0;
  while (i < remaining.length || ready.length > 0) {
    // move arrivals to ready
    while (i < remaining.length && remaining[i].arrival <= time) {
      ready.push(remaining[i]);
      i++;
    }
    if (ready.length === 0) {
      // jump to next arrival (idle gap)
      const nextArrival = remaining[i].arrival;
      segments.push({ pid: "IDLE", start: time, end: nextArrival });
      time = nextArrival;
      continue;
    }
    // pick shortest burst
    ready.sort(by("burst"));
    const p = ready.shift();
    segments.push({ pid: p.id, start: time, end: time + p.burst });
    time += p.burst;
  }
  return segments;
}

// Non-preemptive Priority (smaller number => higher priority)
function schedulePriority(processes) {
  const remaining = deepClone(processes).sort(by("arrival"));
  const segments = [];
  let time = 0;
  const ready = [];
  let i = 0;

  while (i < remaining.length || ready.length > 0) {
    while (i < remaining.length && remaining[i].arrival <= time) {
      ready.push(remaining[i]);
      i++;
    }
    if (ready.length === 0) {
      const nextArrival = remaining[i].arrival;
      segments.push({ pid: "IDLE", start: time, end: nextArrival });
      time = nextArrival;
      continue;
    }
    // choose highest priority (lowest priority value), tie-break by arrival then burst
    ready.sort((a, b) => (a.priority - b.priority) || (a.arrival - b.arrival) || (a.burst - b.burst));
    const p = ready.shift();
    segments.push({ pid: p.id, start: time, end: time + p.burst });
    time += p.burst;
  }
  return segments;
}

// Round Robin (preemptive) with time quantum q>=1
function scheduleRoundRobin(processes, q) {
  const procs = deepClone(processes).sort(by("arrival"));
  const remainingBurst = new Map(procs.map(p => [p.id, p.burst]));
  const segments = [];

  const queue = [];
  let time = 0;
  let i = 0;

  const enqueueArrivals = (t) => {
    // push all processes that arrive at or before t, in arrival order
    while (i < procs.length && procs[i].arrival <= t) {
      queue.push(procs[i]);
      i++;
    }
  };

  enqueueArrivals(0);

  while (queue.length > 0 || i < procs.length) {
    if (queue.length === 0) {
      // idle until next arrival
      const nextArrival = procs[i].arrival;
      if (time < nextArrival) segments.push({ pid: "IDLE", start: time, end: nextArrival });
      time = nextArrival;
      enqueueArrivals(time);
      continue;
    }
    const current = queue.shift();
    const rem = remainingBurst.get(current.id);
    const slice = Math.min(q, rem);

    // Execute current for 'slice' units
    segments.push({ pid: current.id, start: time, end: time + slice });
    time += slice;

    // Enqueue any arrivals that occurred during this run (strictly <= time)
    enqueueArrivals(time);

    const newRem = rem - slice;
    if (newRem > 0) {
      remainingBurst.set(current.id, newRem);
      // put back to queue end
      queue.push(current);
    } else {
      remainingBurst.delete(current.id);
      // finished
    }
  }

  return segments;
}

// Convert schedule segments to per-time-unit ticks
function segmentsToTicks(segments) {
  const maxT = segments.length ? segments[segments.length - 1].end : 0;
  const ticks = [];
  for (let t = 0; t < maxT; t++) {
    const seg = segments.find(s => s.start <= t && t < s.end);
    ticks.push(seg ? seg.pid : "IDLE");
  }
  return ticks;
}

// Compute average waiting time, turnaround time
function computeMetrics(processes, segments) {
  // finish time for a pid = last 'end' of that pid
  const finish = {};
  for (const s of segments) {
    if (s.pid === "IDLE") continue;
    finish[s.pid] = s.end;
  }
  const byId = {};
  processes.forEach(p => { byId[p.id] = p; });

  let totalWT = 0;
  let totalTAT = 0;
  processes.forEach(p => {
    const tat = (finish[p.id] ?? 0) - p.arrival;
    const wt = tat - p.burst;
    totalWT += wt;
    totalTAT += tat;
  });

  const n = processes.length || 1;
  return {
    avgWaiting: +(totalWT / n).toFixed(2),
    avgTurnaround: +(totalTAT / n).toFixed(2)
  };
}

// ---------- Subcomponents ----------
function Section({ title, children, right }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{title}</h3>
        <div>{right}</div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, max = 9999, step = 1, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(clampInt(e.target.value, min, max))}
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function Button({ children, onClick, variant = "solid", disabled }) {
  return (
    <button className={`btn ${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function ProcessForm({ onAdd }) {
  const [id, setId] = useState("");
  const [arrival, setArrival] = useState(0);
  const [burst, setBurst] = useState(1);
  const [priority, setPriority] = useState(1);

  const canAdd = id.trim() !== "" && burst > 0;

  return (
    <div className="grid form-grid">
      <label className="field">
        <span>Process ID</span>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., P1" />
      </label>
      <NumberField label="Arrival Time" value={arrival} onChange={setArrival} min={0} />
      <NumberField label="Burst Time" value={burst} onChange={setBurst} min={1} />
      <NumberField label="Priority" value={priority} onChange={setPriority} min={1} />
      <div className="form-actions">
        <Button
          onClick={() => {
            onAdd({ id: id.trim(), arrival, burst, priority });
            setId("");
            setArrival(0);
            setBurst(1);
            setPriority(1);
          }}
          disabled={!canAdd}
        >
          Add Process
        </Button>
      </div>
    </div>
  );
}

function ProcessTable({ processes, onRemove, onClear, onLoadDemo }) {
  return (
    <Section
      title="Processes"
      right={
        <div className="hstack">
          <Button variant="ghost" onClick={onLoadDemo}>Load Demo</Button>
          <Button variant="ghost" onClick={onClear} disabled={processes.length === 0}>Clear</Button>
        </div>
      }
    >
      {processes.length === 0 ? (
        <div className="empty">No processes yet. Add some using the form.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>PID</th><th>Arrival</th><th>Burst</th><th>Priority</th><th></th>
              </tr>
            </thead>
            <tbody>
              {processes
                .slice()
                .sort(by("arrival"))
                .map((p) => (
                  <tr key={p.id}>
                    <td><span className="pid" style={{ background: colorForPid(p.id) }}>{p.id}</span></td>
                    <td>{p.arrival}</td>
                    <td>{p.burst}</td>
                    <td>{p.priority}</td>
                    <td>
                      <button className="icon-btn" title="Remove" onClick={() => onRemove(p.id)}>✕</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function Controls({ algo, setAlgo, quantum, setQuantum, speed, setSpeed, onBuild }) {
  return (
    <Section
      title="Controls"
      right={<Button onClick={onBuild}>Build Schedule</Button>}
    >
      <div className="grid controls-grid">
        <Select
          label="Algorithm"
          value={algo}
          onChange={setAlgo}
          options={[
            { value: "FCFS", label: "FCFS" },
            { value: "SJF", label: "SJF (Non-Preemptive)" },
            { value: "PRIORITY", label: "Priority (Non-Preemptive)" },
            { value: "RR", label: "Round Robin" },
          ]}
        />
        {algo === "RR" && (
          <NumberField label="Time Quantum" value={quantum} onChange={setQuantum} min={1} max={1000} />
        )}
        <NumberField label="Playback Speed (ms/tick)" value={speed} onChange={setSpeed} min={50} max={2000} />
      </div>
    </Section>
  );
}

function Timeline({ segments, currentTime }) {
  if (!segments.length) {
    return (
      <Section title="Timeline">
        <div className="empty">Build a schedule to see the timeline.</div>
      </Section>
    );
  }

  const makespan = segments[segments.length - 1].end || 0;

  return (
    <Section
      title="Gantt Chart"
      right={<div className="muted">Makespan: <strong>{makespan}</strong></div>}
    >
      <div className="gantt">
        {segments.map((s, idx) => {
          const width = Math.max(1, (s.end - s.start)) * 24; // 24px per time-unit
          return (
            <div
              key={idx}
              className="gantt-seg"
              style={{
                width: `${width}px`,
                background: colorForPid(s.pid),
              }}
              title={`${s.pid} [${s.start} → ${s.end}]`}
            >
              <span>{s.pid}</span>
            </div>
          );
        })}
        <div
          className="playhead"
          style={{ left: `${currentTime * 24}px` }}
          title={`t=${currentTime}`}
        />
      </div>
      <div className="gantt-scale">
        {Array.from({ length: makespan + 1 }).map((_, t) => (
          <div key={t} className="tick">
            <span>{t}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Legend({ processes }) {
  if (!processes.length) return null;
  return (
    <div className="legend">
      {processes.map(p => (
        <div key={p.id} className="legend-item">
          <span className="swatch" style={{ background: colorForPid(p.id) }} />
          <span>{p.id}</span>
        </div>
      ))}
      <div className="legend-item">
        <span className="swatch" style={{ background: colorForPid("IDLE") }} />
        <span>IDLE</span>
      </div>
    </div>
  );
}

function Playback({ running, canPlay, onPlayPause, onStep, onReset }) {
  return (
    <div className="hstack gap">
      <Button onClick={onPlayPause} disabled={!canPlay}>{running ? "Pause" : "Play"}</Button>
      <Button variant="ghost" onClick={onStep} disabled={!canPlay}>Step</Button>
      <Button variant="ghost" onClick={onReset}>Reset</Button>
    </div>
  );
}

// ---------- Root ----------
export default function CPUSchedulerVisualizer() {
  const [processes, setProcesses] = useState([
    // Starter demo data (can be cleared)
    { id: "P1", arrival: 0, burst: 4, priority: 2 },
    { id: "P2", arrival: 1, burst: 3, priority: 1 },
    { id: "P3", arrival: 2, burst: 6, priority: 3 },
  ]);

  const [algo, setAlgo] = useState("FCFS");
  const [quantum, setQuantum] = useState(2);
  const [speed, setSpeed] = useState(200); // ms per tick

  const [segments, setSegments] = useState([]);
  const [ticks, setTicks] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [running, setRunning] = useState(false);

  const timerRef = useRef(null);

  const makespan = useMemo(
    () => (segments.length ? segments[segments.length - 1].end : 0),
    [segments]
  );

  const metrics = useMemo(
    () => computeMetrics(processes, segments),
    [processes, segments]
  );

  const buildSchedule = () => {
    if (processes.length === 0) {
      setSegments([]);
      setTicks([]);
      setCurrentTime(0);
      setRunning(false);
      return;
    }
    const sanitized = mergeSamePid(processes); // ensure unique ids? We'll allow custom ids, but no merge—keep as-is
    const segs = (() => {
      switch (algo) {
        case "FCFS": return scheduleFCFS(sanitized);
        case "SJF": return scheduleSJF(sanitized);
        case "PRIORITY": return schedulePriority(sanitized);
        case "RR": return scheduleRoundRobin(sanitized, Math.max(1, quantum));
        default: return [];
      }
    })();
    setSegments(segs);
    setTicks(segmentsToTicks(segs));
    setCurrentTime(0);
    setRunning(false);
  };

  // helper: no actual merge; just returns clone (kept for potential id collision handling)
  function mergeSamePid(list) {
    return list.map(p => ({ ...p }));
  }

  // Playback engine
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    if (!ticks.length) return;
    timerRef.current = setInterval(() => {
      setCurrentTime((t) => {
        if (t + 1 >= ticks.length) {
          stopTimer();
          return t + 1 >= ticks.length ? ticks.length : t + 1;
        }
        return t + 1;
      });
    }, Math.max(50, speed));
  };

  useEffect(() => {
    // if speed changes while running, restart interval
    if (running) {
      startTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  useEffect(() => {
    return () => stopTimer();
  }, []);

  const onPlayPause = () => {
    if (!ticks.length) return;
    if (running) {
      stopTimer();
      setRunning(false);
    } else {
      setRunning(true);
      startTimer();
    }
  };

  const onStep = () => {
    if (!ticks.length) return;
    stopTimer();
    setRunning(false);
    setCurrentTime((t) => Math.min(t + 1, ticks.length));
  };

  const onReset = () => {
    stopTimer();
    setRunning(false);
    setCurrentTime(0);
  };

  const onAddProcess = (p) => {
    // prevent duplicate id
    if (processes.some(x => x.id === p.id)) {
      alert("Process ID already exists. Use a unique ID.");
      return;
    }
    setProcesses(prev => [...prev, p]);
  };

  const onRemoveProcess = (pid) => {
    setProcesses(prev => prev.filter(p => p.id !== pid));
  };

  const onClear = () => setProcesses([]);

  const onLoadDemo = () => {
    setProcesses([
      { id: "P1", arrival: 0, burst: 7, priority: 2 },
      { id: "P2", arrival: 2, burst: 4, priority: 1 },
      { id: "P3", arrival: 4, burst: 1, priority: 3 },
      { id: "P4", arrival: 5, burst: 4, priority: 2 },
    ]);
  };

  const canPlay = segments.length > 0 && ticks.length > 0;
  const nowPid = ticks[currentTime] ?? null;

  return (
    <div className="wrap">
      <header className="hdr">
        <h1>CPU Scheduling Visualizer</h1>
        <p className="subtitle">FCFS • SJF • Priority • Round Robin</p>
      </header>

      <Legend processes={[...new Set(processes)].map(p => p)} />

      <Section title="Add Process">
        <ProcessForm onAdd={onAddProcess} />
      </Section>

      <ProcessTable
        processes={processes}
        onRemove={onRemoveProcess}
        onClear={onClear}
        onLoadDemo={onLoadDemo}
      />

      <Controls
        algo={algo}
        setAlgo={setAlgo}
        quantum={quantum}
        setQuantum={setQuantum}
        speed={speed}
        setSpeed={setSpeed}
        onBuild={buildSchedule}
      />

      <Timeline segments={segments} currentTime={currentTime} />

      <Section
        title="Playback"
        right={<div className="muted">Now Running: <strong>{nowPid || "-"}</strong></div>}
      >
        <Playback
          running={running}
          canPlay={canPlay}
          onPlayPause={onPlayPause}
          onStep={onStep}
          onReset={onReset}
        />
      </Section>

      <Section title="Metrics">
        {segments.length === 0 ? (
          <div className="empty">Build a schedule to see metrics.</div>
        ) : (
          <div className="metrics">
            <div className="metric"><span>Avg Waiting Time</span><strong>{metrics.avgWaiting}</strong></div>
            <div className="metric"><span>Avg Turnaround Time</span><strong>{metrics.avgTurnaround}</strong></div>
            <div className="metric"><span>Total Time (Makespan)</span><strong>{makespan}</strong></div>
          </div>
        )}
      </Section>

      <footer className="ftr">
        <small></small>
      </footer>
    </div>
  );
}
