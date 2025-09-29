export default function segmentsToTicks(segments) {
  const maxT = segments.length ? segments[segments.length - 1].end : 0;
  const ticks = [];
  for (let t = 0; t < maxT; t++) {
    const seg = segments.find(s => s.start <= t && t < s.end);
    ticks.push(seg ? seg.pid : "IDLE");
  }
  return ticks;
}