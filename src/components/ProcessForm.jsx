import { useState } from "react";
import NumberField from "./NumberField";
import Button from "./Button";

export default function ProcessForm({ onAdd }) {
  const [id, setId] = useState("");
  const [arrival, setArrival] = useState(0);
  const [burst, setBurst] = useState(1);
  const [priority, setPriority] = useState(1);

  const canAdd = id.trim() !== "" && burst > 0;

  return (
    <div className="grid form-grid">
      <label className="field">
        <span>Process ID</span>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., P1" />
      </label>
      <NumberField label="Arrival Time" value={arrival} onChange={setArrival} min={0} />
      <NumberField label="Burst Time" value={burst} onChange={setBurst} min={1} />
      <NumberField label="Priority" value={priority} onChange={setPriority} min={1} />
      <div className="form-actions">
        <Button
          onClick={() => {
            onAdd({ id: id.trim(), arrival, burst, priority });
            setId("");
            setArrival(0);
            setBurst(1);
            setPriority(1);
          }}
          disabled={!canAdd}
        >
          Add Process
        </Button>
      </div>
    </div>
  );
}