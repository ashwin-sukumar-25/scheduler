export default function scheduleRoundRobin(processes, q) {
    const deepClone = (x) => JSON.parse(JSON.stringify(x));
const by = (k) => (a, b) => (a[k] === b[k] ? 0 : a[k] < b[k] ? -1 : 1);
  const procs = deepClone(processes).sort(by("arrival"));
  const remainingBurst = new Map(procs.map(p => [p.id, p.burst]));
  const segments = [];

  const queue = [];
  let time = 0;
  let i = 0;

  const enqueueArrivals = (t) => {
    while (i < procs.length && procs[i].arrival <= t) {
      queue.push(procs[i]);
      i++;
    }
  };

  enqueueArrivals(0);

  while (queue.length > 0 || i < procs.length) {
    if (queue.length === 0) {
      const nextArrival = procs[i].arrival;
      if (time < nextArrival) segments.push({ pid: "IDLE", start: time, end: nextArrival });
      time = nextArrival;
      enqueueArrivals(time);
      continue;
    }
    const current = queue.shift();
    const rem = remainingBurst.get(current.id);
    const slice = Math.min(q, rem);

    segments.push({ pid: current.id, start: time, end: time + slice });
    time += slice;

    enqueueArrivals(time);

    const newRem = rem - slice;
    if (newRem > 0) {
      remainingBurst.set(current.id, newRem);
      queue.push(current);
    } else {
      remainingBurst.delete(current.id);
    }
  }

  return segments;
}