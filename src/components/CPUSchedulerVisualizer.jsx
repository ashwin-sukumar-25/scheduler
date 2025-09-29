import React, { useEffect, useMemo, useRef, useState } from "react";
import Legend from "./Legend";
import ProcessTable from "./ProcessTable";
import Playback from "./Playback";
import Timeline from "./Timeline";
import Section from "./Section";
import ProcessForm from "./ProcessForm";
import Controls from "./Controls";
import computeMetrics from "./computeMetrics";
import scheduleFCFS from "./scheduleFCFS";
import schedulePriority from "./schedulePriority";
import scheduleSJF from "./scheduleSJF";
import scheduleRoundRobin from "./scheduleRoundRobin";
import segmentsToTicks from "./segmentToTicks";


export default function CPUSchedulerVisualizer() {
  const [processes, setProcesses] = useState([
    { id: "P1", arrival: 0, burst: 4, priority: 2 },
    { id: "P2", arrival: 1, burst: 3, priority: 1 },
    { id: "P3", arrival: 2, burst: 6, priority: 3 },
  ]);

  const [algo, setAlgo] = useState("FCFS");
  const [quantum, setQuantum] = useState(2);
  const [speed, setSpeed] = useState(200);

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
    const sanitized = mergeSamePid(processes); 
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

  function mergeSamePid(list) {
    return list.map(p => ({ ...p }));
  }

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
    if (running) {
      startTimer();
    }
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
        <small>All rights reserved by The Batman</small>
      </footer>
    </div>
  );
}
