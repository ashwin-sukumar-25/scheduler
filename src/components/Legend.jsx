import colorForPid from "./colorForPid";

export default function Legend({ processes }) {
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