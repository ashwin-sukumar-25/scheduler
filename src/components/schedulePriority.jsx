
const deepClone = (x) => JSON.parse(JSON.stringify(x));
const by = (k) => (a, b) => (a[k] === b[k] ? 0 : a[k] < b[k] ? -1 : 1);

export default function schedulePriority(processes) {
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
    ready.sort((a, b) => (a.priority - b.priority) || (a.arrival - b.arrival) || (a.burst - b.burst));
    const p = ready.shift();
    segments.push({ pid: p.id, start: time, end: time + p.burst });
    time += p.burst;
  }
  return segments;
}