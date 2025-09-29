import Button from "./Button";

export default function Playback({ running, canPlay, onPlayPause, onStep, onReset }) {
  return (
    <div className="hstack gap">
      <Button onClick={onPlayPause} disabled={!canPlay}>{running ? "Pause" : "Play"}</Button>
      <Button variant="ghost" onClick={onStep} disabled={!canPlay}>Step</Button>
      <Button variant="ghost" onClick={onReset}>Reset</Button>
    </div>
  );
}