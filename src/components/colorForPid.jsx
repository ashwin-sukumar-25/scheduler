const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#84cc16", "#ec4899", "#a855f7", "#14b8a6",
  "#f97316", "#22c55e", "#e11d48", "#0ea5e9", "#65a30d"
];
export default function colorForPid(pid) {
  if (pid === "IDLE") return "#9ca3af";

  let h = 0;
  for (let i = 0; i < pid.length; i++) h = ((h << 5) - h) + pid.charCodeAt(i);
  const idx = Math.abs(h) % COLORS.length;
  return COLORS[idx];
};