import * as Tone from "tone";
// https://tonejs.github.io/docs/14.9.17/index.html - Dokumentation för Tone.js

// The Code Creative - På YouTube hjälpte mig förstå Tone-biblioteket

// Varje funktion spelar en specifik ton vilket gör att användaren kan stämma sitt instrument genom att lyssna på tonerna
function Tuner() {
  function playE2() {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("E2", "2n");
  }

  function playA2() {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("A2", "2n");
  }

  function playD3() {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("D3", "2n");
  }

  function playG3() {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("G3", "2n");
  }

  function playB3() {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("B3", "2n");
  }

  function playE4() {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("E4", "2n");
  }

  return (
    <div className="tuner-wrapper">
      <h2 className="tuner-header">Guitar Tuner</h2>
      <div className="tuner-btn-wrapper">
        <button className="tuner-btn" onClick={playE2}>
          E
        </button>
        <button className="tuner-btn" onClick={playA2}>
          A
        </button>
        <button className="tuner-btn" onClick={playD3}>
          D
        </button>
        <button className="tuner-btn" onClick={playG3}>
          G
        </button>
        <button className="tuner-btn" onClick={playB3}>
          B
        </button>
        <button className="tuner-btn" onClick={playE4}>
          E4
        </button>
      </div>
    </div>
  );
}

export default Tuner;
