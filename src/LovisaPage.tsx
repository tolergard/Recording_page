import LyricsLovisa from "./LyricsLovisa";
import AudioRecorder from "./AudioRecorder";
import TodoApp from "./TodoApp";
import Tuner from "./Tuner";

function LovisaPage() {
  return (
    <>
      <div className="full-wrapper">
        <Tuner />
        <div className="wrapper">
          <LyricsLovisa />
          <AudioRecorder />
          <TodoApp />
        </div>
      </div>
    </>
  );
}

export default LovisaPage;
