export default function Section({ title, children, right }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{title}</h3>
        <div>{right}</div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}