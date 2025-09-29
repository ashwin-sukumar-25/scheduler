export default function computeMetrics(processes, segments) {
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