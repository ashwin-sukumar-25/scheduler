export default function Button({ children, onClick, variant = "solid", disabled }) {
  return (
    <button className={`btn ${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}