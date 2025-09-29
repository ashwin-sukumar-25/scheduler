import Section from "./Section";
import Button from "./Button";
import Select from "./Select";
import NumberField from "./NumberField";

export default function Controls({ algo, setAlgo, quantum, setQuantum, speed, setSpeed, onBuild }) {
  return (
    <Section
      title="Controls"
      right={<Button onClick={onBuild}>Build Schedule</Button>}
    >
      <div className="grid controls-grid">
        <Select
          label="Algorithm"
          value={algo}
          onChange={setAlgo}
          options={[
            { value: "FCFS", label: "FCFS" },
            { value: "SJF", label: "SJF (Non-Preemptive)" },
            { value: "PRIORITY", label: "Priority (Non-Preemptive)" },
            { value: "RR", label: "Round Robin" },
          ]}
        />
        {algo === "RR" && (
          <NumberField label="Time Quantum" value={quantum} onChange={setQuantum} min={1} max={1000} />
        )}
        <NumberField label="Playback Speed (ms/tick)" value={speed} onChange={setSpeed} min={50} max={2000} />
      </div>
    </Section>
  );
}