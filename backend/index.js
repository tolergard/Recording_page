"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Starta servern och skriv in alla tabeller för databasen.
// Har samlat databasens alla tables i en och samma fil (database.sqlite).
// Alla backend-routes.
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield (0, sqlite_1.open)({
            filename: "./database.sqlite",
            driver: sqlite3_1.default.Database,
        });
        // Middleware för att inkludera databasen i varje förfrågan.
        app.use((req, _, next) => {
            req.db = db;
            next();
        });
        // Aktivera foreign keys
        yield db.run("PRAGMA foreign_keys = ON");
        // Skapa användartabellen
        yield db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL
  )
`);
        // Skapa anteckningstabellen
        yield db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);
        // Skapa inspelningstabellen
        yield db.exec(`
  CREATE TABLE IF NOT EXISTS recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data BLOB NOT NULL,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);
        // Skapa uppgiftstabellen (todos)
        yield db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);
        // Route för att hämta användarinformation från databasen baserat på användarnamnet
        app.get("/users/:username", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const db = req.db;
            const username = req.params.username;
            const user = yield db.get("SELECT * FROM users WHERE username = ?", [
                username,
            ]);
            const todos = yield db.all("SELECT * FROM todos WHERE userId = ?", [
                user.id,
            ]);
            const notes = yield db.all("SELECT * FROM notes WHERE userId = ?", [
                user.id,
            ]);
            const recordings = yield db.all("SELECT * FROM recordings WHERE userId = ?", [user.id]);
            res.json({ user, todos, notes, recordings });
        }));
        // Route för att hämta alla anteckningar
        app.get("/notes", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const db = req.db;
            const userId = req.query.userId;
            const notes = yield db.all("SELECT * FROM notes WHERE userId = ?", [
                userId,
            ]);
            res.json(notes);
        }));
        // Route för att lägga till nya anteckningar
        app.post("/notes", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { title, content, userId } = req.body;
            const db = req.db;
            const result = yield db.run("INSERT INTO notes (title, content, userId) VALUES (?, ?, ?)", [title, content, userId]);
            res.json({ id: result.lastID, title, content, userId });
        }));
        // Route för att ta bort en anteckning
        app.delete("/notes/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const userId = req.query.userId;
            const db = req.db;
            yield db.run("DELETE FROM notes WHERE id = ? AND userId = ?", [id, userId]);
            res.status(204).send();
        }));
        // Route för att hämta inspelningar
        app.get("/recordings", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const db = req.db;
            const userId = req.query.userId;
            try {
                const recordings = yield db.all("SELECT id, name FROM recordings WHERE userId = ?", [userId]);
                res.json(recordings);
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Slappin' the databass(e) error" });
            }
        }));
        // Route för att spara inspelningar
        // https://nodejs.org/api/buffer.html
        app.post("/upload", (req, res) => {
            const chunks = [];
            const { name, userId } = req.query;
            req.on("data", (chunk) => {
                chunks.push(chunk);
            });
            req.on("end", () => __awaiter(this, void 0, void 0, function* () {
                const data = Buffer.concat(chunks);
                const recordingName = name || `recording_${Date.now()}.wav`;
                const db = req.db;
                const result = yield db.run("INSERT INTO recordings (name, data, userId) VALUES (?, ?, ?)", [recordingName, data, userId]);
                res.json({ id: result.lastID });
            }));
        });
        // Route för att hämta inspelning baserat på ID
        app.get("/recording/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const userId = req.query.userId;
            const db = req.db;
            const recording = yield db.get("SELECT data FROM recordings WHERE id = ? AND userId = ?", [id, userId]);
            if (!recording) {
                return res.status(404).json({
                    error: "These are not the droids (recordings) you're looking for",
                });
            }
            res.send(recording.data);
        }));
        // Route för att ta bort en inspelning baserat på ID
        app.delete("/recording/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const userId = req.query.userId;
            const db = req.db;
            const result = yield db.run("DELETE FROM recordings WHERE id = ? AND userId = ?", [id, userId]);
            if (result.changes === 0) {
                res
                    .status(404)
                    .send("These are not the droids (recordings) you're looking for");
            }
            else {
                res.status(204).send();
            }
        }));
        // Route för att hämta todos
        app.get("/todos", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.query.userId;
            try {
                const db = req.db;
                const todo = yield db.all("SELECT * FROM todos WHERE userId = ?", [userId]);
                res.send(todo);
            }
            catch (error) {
                console.error(error);
                res.status(500).send("Something went wrong");
            }
        }));
        // Route för att posta todos
        app.post("/todos", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { title, userId } = req.body;
            try {
                const db = req.db;
                const result = yield db.run("INSERT INTO todos (title, userId) VALUES (?, ?)", [title, userId]);
                const todo = yield db.get("SELECT * FROM todos WHERE id = ?", [
                    result.lastID,
                ]);
                res.status(201).send(todo);
            }
            catch (error) {
                console.error(error);
                res.status(500).send("Could not add task to list");
            }
        }));
        // Route för att checka av (bocka av) todos
        app.put("/todos/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { completed } = req.body;
            const { id } = req.params;
            const userId = req.query.userId;
            try {
                const db = req.db;
                yield db.run("UPDATE todos SET completed = ? WHERE id = ? AND userId = ?", [completed, id, userId]);
                res.json({ message: "Todo updated successfully", completed });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Could not update task" });
            }
        }));
        // Route för att ta bort todos
        app.delete("/todos/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const userId = req.query.userId;
            try {
                const db = req.db;
                yield db.run("DELETE FROM todos WHERE id = ? AND userId = ?", [
                    id,
                    userId,
                ]);
                res.send({ message: "To-do task removed" });
            }
            catch (error) {
                console.error(error);
                res.status(500).send("Could not remove task");
            }
        }));
        // Lyssna på port: Bzzzzt!
        const port = 4000;
        app.listen(port, () => {
            console.log(`Server is listening to the exciting port: ${port}`);
        });
    });
}
// Starta servern
startServer().catch(console.error);
