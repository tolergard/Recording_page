import LyricsViktor from "./LyricsViktor";
import AudioRecorderViktor from "./AudioRecorderViktor";
import TodoAppViktor from "./TodoAppViktor";
import Tuner from "./Tuner";

function ViktorPage() {
  return (
    <>
      <div className="full-wrapper">
        <Tuner />
        <div className="wrapper">
          <LyricsViktor />
          <AudioRecorderViktor />
          <TodoAppViktor />
        </div>
      </div>
    </>
  );
}

export default ViktorPage;
