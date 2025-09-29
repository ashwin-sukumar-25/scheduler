import Section from "./Section";
import Button from "./Button";
import colorForPid from "./colorForPid";

export default function ProcessTable({ processes, onRemove, onClear, onLoadDemo }) {
    const by = (k) => (a, b) => (a[k] === b[k] ? 0 : a[k] < b[k] ? -1 : 1);
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