import Section from "./Section";
import colorForPid from "./colorForPid";

export default function Timeline({ segments, currentTime }) {
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
          const width = Math.max(1, (s.end - s.start)) * 24;
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