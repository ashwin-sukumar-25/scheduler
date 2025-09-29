const clampInt = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v) || 0)));
export default function NumberField({ label, value, onChange, min = 0, max = 9999, step = 1, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(clampInt(e.target.value, min, max))}
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
}