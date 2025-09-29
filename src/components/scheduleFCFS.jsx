

const deepClone = (x) => JSON.parse(JSON.stringify(x));
const by = (k) => (a, b) => (a[k] === b[k] ? 0 : a[k] < b[k] ? -1 : 1);

export default function scheduleFCFS(processes) {
  const procs = deepClone(processes).sort(by("arrival"));
  let time = 0;
  const segments = [];

  for (const p of procs) {
    if (time < p.arrival) {
      segments.push({ pid: "IDLE", start: time, end: p.arrival });
      time = p.arrival;
    }
    segments.push({ pid: p.id, start: time, end: time + p.burst });
    time += p.burst;
  }
  return segments;
}