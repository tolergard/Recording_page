import express, { Request, Response } from "express";
import cors from "cors";
import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

interface Note {
  id: number;
  title: string;
  content: string;
}

interface Recording {
  id: number;
  name: string;
  data: Buffer;
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// Starta servern och skriv in alla tabeller för databasen.
// Har samlat databasens alla tables i en och samma fil (database.sqlite).
// Alla backend-routes.
async function startServer() {
  const db: Database = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  // Middleware för att inkludera databasen i varje förfrågan.
  app.use((req, _, next) => {
    (req as any).db = db;
    next();
  });

  // Aktivera foreign keys
  await db.run("PRAGMA foreign_keys = ON");

  // Skapa användartabellen
  await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL
  )
`);

  // Skapa anteckningstabellen
  await db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);

  // Skapa inspelningstabellen
  await db.exec(`
  CREATE TABLE IF NOT EXISTS recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data BLOB NOT NULL,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);

  // Skapa uppgiftstabellen (todos)
  await db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);
  // Route för att hämta användarinformation från databasen baserat på användarnamnet
  app.get("/users/:username", async (req: Request, res: Response) => {
    const db: Database = (req as any).db;
    const username = req.params.username;
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    const todos = await db.all("SELECT * FROM todos WHERE userId = ?", [
      user.id,
    ]);
    const notes = await db.all("SELECT * FROM notes WHERE userId = ?", [
      user.id,
    ]);
    const recordings = await db.all(
      "SELECT * FROM recordings WHERE userId = ?",
      [user.id]
    );
    res.json({ user, todos, notes, recordings });
  });

  // Route för att hämta alla anteckningar
  app.get("/notes", async (req: Request, res: Response) => {
    const db: Database = (req as any).db;
    const userId = req.query.userId;
    const notes: Note[] = await db.all("SELECT * FROM notes WHERE userId = ?", [
      userId,
    ]);
    res.json(notes);
  });

  // Route för att lägga till nya anteckningar
  app.post("/notes", async (req: Request, res: Response) => {
    const { title, content, userId } = req.body;
    const db: Database = (req as any).db;
    const result = await db.run(
      "INSERT INTO notes (title, content, userId) VALUES (?, ?, ?)",
      [title, content, userId]
    );
    res.json({ id: result.lastID, title, content, userId });
  });

  // Route för att ta bort en anteckning
  app.delete("/notes/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.query.userId;
    const db: Database = (req as any).db;
    await db.run("DELETE FROM notes WHERE id = ? AND userId = ?", [id, userId]);
    res.status(204).send();
  });

  // Route för att hämta inspelningar
  app.get("/recordings", async (req: Request, res: Response) => {
    const db: Database = (req as any).db;
    const userId = req.query.userId;
    try {
      const recordings: Recording[] = await db.all(
        "SELECT id, name FROM recordings WHERE userId = ?",
        [userId]
      );
      res.json(recordings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Slappin' the databass(e) error" });
    }
  });

  // Route för att spara inspelningar
  // https://nodejs.org/api/buffer.html
  app.post("/upload", (req: Request, res: Response) => {
    const chunks: Buffer[] = [];
    const { name, userId } = req.query;
    req.on("data", (chunk) => {
      chunks.push(chunk);
    });
    req.on("end", async () => {
      const data = Buffer.concat(chunks);
      const recordingName = name || `recording_${Date.now()}.wav`;
      const db: Database = (req as any).db;
      const result = await db.run(
        "INSERT INTO recordings (name, data, userId) VALUES (?, ?, ?)",
        [recordingName, data, userId]
      );
      res.json({ id: result.lastID });
    });
  });

  // Route för att hämta inspelning baserat på ID
  app.get("/recording/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.query.userId;
    const db: Database = (req as any).db;

    const recording = await db.get(
      "SELECT data FROM recordings WHERE id = ? AND userId = ?",
      [id, userId]
    );

    if (!recording) {
      return res.status(404).json({
        error: "These are not the droids (recordings) you're looking for",
      });
    }

    res.send(recording.data);
  });

  // Route för att ta bort en inspelning baserat på ID
  app.delete("/recording/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.query.userId;
    const db: Database = (req as any).db;
    const result = await db.run(
      "DELETE FROM recordings WHERE id = ? AND userId = ?",
      [id, userId]
    );
    if (result.changes === 0) {
      res
        .status(404)
        .send("These are not the droids (recordings) you're looking for");
    } else {
      res.status(204).send();
    }
  });

  // Route för att hämta todos
  app.get("/todos", async (req: Request, res: Response) => {
    const userId = req.query.userId;
    try {
      const db: Database = (req as any).db;
      const todo: Todo[] = await db.all(
        "SELECT * FROM todos WHERE userId = ?",
        [userId]
      );
      res.send(todo);
    } catch (error) {
      console.error(error);
      res.status(500).send("Something went wrong");
    }
  });

  // Route för att posta todos
  app.post("/todos", async (req: Request, res: Response) => {
    const { title, userId } = req.body;
    try {
      const db: Database = (req as any).db;
      const result = await db.run(
        "INSERT INTO todos (title, userId) VALUES (?, ?)",
        [title, userId]
      );
      const todo = await db.get("SELECT * FROM todos WHERE id = ?", [
        result.lastID,
      ]);
      res.status(201).send(todo);
    } catch (error) {
      console.error(error);
      res.status(500).send("Could not add task to list");
    }
  });

  // Route för att checka av (bocka av) todos
  app.put("/todos/:id", async (req: Request, res: Response) => {
    const { completed } = req.body;
    const { id } = req.params;
    const userId = req.query.userId;

    try {
      const db: Database = (req as any).db;
      await db.run(
        "UPDATE todos SET completed = ? WHERE id = ? AND userId = ?",
        [completed, id, userId]
      );
      res.json({ message: "Todo updated successfully", completed });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not update task" });
    }
  });

  // Route för att ta bort todos
  app.delete("/todos/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.query.userId;

    try {
      const db: Database = (req as any).db;
      await db.run("DELETE FROM todos WHERE id = ? AND userId = ?", [
        id,
        userId,
      ]);
      res.send({ message: "To-do task removed" });
    } catch (error) {
      console.error(error);
      res.status(500).send("Could not remove task");
    }
  });

  // Lyssna på port: Bzzzzt!
  const port = 4000;
  app.listen(port, () => {
    console.log(`Server is listening to the exciting port: ${port}`);
  });
}

// Starta servern
startServer().catch(console.error);
