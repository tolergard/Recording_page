import { useState, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";

interface Recording {
  id: number;
  name: string;
  url: string;
}
// Komponent för att göra inspelningar av ljud, ta bort och spara.
// Länkar till sidor som hjälpt mig bygga det här:
// https://codesandbox.io/examples/package/react-voice-recorder
// https://www.npmjs.com/package/react-media-recorder?activeTab=readme
// https://dev.to/jleonardo007/create-a-voice-recorder-with-react-32j6
// Diverse filmer på YouTube.
function AudioRecorder() {
  const [recordingName, setRecordingName] = useState<string>("");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const { startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder(
    { audio: true }
  );
  const [userId] = useState<number>(1);

  function fetchRecordings() {
    fetch(`http://localhost:4000/recordings?userId=${userId}`)
      .then((response) => response.json())
      .then((data: Array<{ id: number; name: string }>) => {
        const recordingsWithUrls = data.map((rec) => ({
          ...rec,
          url: `http://localhost:4000/recording/${rec.id}?userId=${userId}`,
        }));
        setRecordings(recordingsWithUrls);
      })
      .catch((error) => console.error(error));
  }

  useEffect(() => {
    fetchRecordings();
  }, [userId]);

  function handleSaveRecording() {
    if (mediaBlobUrl) {
      fetch(mediaBlobUrl)
        .then((res) => res.blob())
        .then((audioBlob) => {
          return fetch(
            `http://localhost:4000/upload?name=${recordingName}&userId=${userId}`,
            {
              method: "POST",
              headers: { "Content-Type": "audio/wav" },
              body: audioBlob,
            }
          );
        })
        .then((response) => response.json())
        .then((result) => {
          const newRecording = {
            id: result.id,
            name: recordingName,
            url: `http://localhost:4000/recording/${result.id}?userId=${userId}`,
          };
          setRecordings((prev) => [...prev, newRecording]);
          setRecordingName("");
        });
    }
  }

  function handleDeleteRecording(id: number) {
    fetch(`http://localhost:4000/recording/${id}?userId=${userId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setRecordings((prev) => prev.filter((rec) => rec.id !== id));
        } else {
          console.error("I have failed you!");
        }
      })
      .catch((error) => console.error(error));
  }

  return (
    <div className="wrapper">
      <div className="mini-wrapper audio-hover">
        <h2>Audio Recorder</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Enter recording name"
          value={recordingName}
          onChange={(e) => setRecordingName(e.target.value)}
        />
        <button className="start-rec" onClick={startRecording}>
          REC
        </button>
        <button className="stop-rec" onClick={stopRecording}>
          STOP
        </button>
        <audio src={mediaBlobUrl ?? ""} controls />
        <button
          className="add-btn add-audio-hover"
          onClick={handleSaveRecording}
        >
          Save Recording
        </button>
        <ul>
          {recordings.map((rec) => (
            <li key={rec.id}>
              <div className="audio-flex">
                {rec.name} <audio src={rec.url} controls />
              </div>
              <button
                className="remove-btn align-remove-btn"
                onClick={() => handleDeleteRecording(rec.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AudioRecorder;
