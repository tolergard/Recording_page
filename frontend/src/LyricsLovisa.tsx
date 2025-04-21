import { useState, useEffect } from "react";

interface Note {
  id?: number;
  title: string;
  content: string;
  userId: number;
}
// Komponent för att kunna lägga till och ta bort textidéer till låtar
function Lyrics() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [userId] = useState<number>(1);

  function fetchNotes() {
    fetch(`http://localhost:4000/notes?userId=${userId}`)
      .then((response) => response.json())
      .then((data: Note[]) => {
        setNotes(data);
      })
      .catch((error) => console.error(error));
  }

  function addNote(title: string, content: string) {
    fetch(`http://localhost:4000/notes?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, userId }),
    })
      .then((response) => response.json())
      .then((newNote: Note) => {
        setNotes((prevNote) => [...prevNote, newNote]);
      })
      .catch((error) => console.error(error));
  }

  function deleteNote(id: number) {
    fetch(`http://localhost:4000/notes/${id}?userId=${userId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setNotes((prevNote) => prevNote.filter((n) => n.id !== id));
        } else {
          console.error("I have failed you!");
        }
      })
      .catch((error) => console.error(error));
  }
  // https://epicreact.dev/how-to-type-a-react-form-on-submit-handler/
  function formSumbit(event: React.FormEvent) {
    event.preventDefault();
    addNote(title, content);
    setTitle("");
    setContent("");
  }

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  return (
    <div className="wrapper">
      <div className="mini-wrapper">
        <h2>Song Lyrics</h2>
        <form className="lyrics-form" onSubmit={formSumbit}>
          <input
            className="input-field"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <textarea
            className="text-field"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            required
          />
          <button className="add-btn add-lyric-hover" type="submit">
            Add Lyrics
          </button>
        </form>
        <ul>
          {notes.map((note) => (
            <li className="saved-lyrics" key={note.id}>
              <div className="saved-lyric-wrapper">
                <h3>{note.title}</h3>
                <p>{note.content}</p>
              </div>
              <button
                className="remove-btn"
                onClick={() => deleteNote(note.id!)}
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

export default Lyrics;
