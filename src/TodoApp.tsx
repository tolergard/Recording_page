import { useState, useEffect } from "react";
import "./index.css";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}
// Komponent för att kunna lägga till, ta bort eller bocka av tankar och påminnelser i en todo-lista.
function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState<string>("");
  const [userId] = useState<number>(1);

  useEffect(() => {
    fetchTodos();
  }, [userId]);

  function fetchTodos() {
    fetch(`http://localhost:4000/todos?userId=${userId}`)
      .then((response) => response.json())
      .then((data: Todo[]) => setTodos(data))
      .catch((error) => console.error(error));
  }

  function addTodo() {
    if (!newTodo.trim()) return;

    fetch("http://localhost:4000/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTodo, userId }),
    })
      .then((response) => response.json())
      .then((newTodoItem: Todo) => {
        setTodos((prevTodos) => [...prevTodos, newTodoItem]);
        setNewTodo("");
      })
      .catch((error) => console.error(error));
  }

  function toggleTodoCompletion(id: number, completed: boolean) {
    fetch(`http://localhost:4000/todos/${id}?userId=${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed, userId }),
    })
      .then((response) => response.json())
      .then(() => {
        setTodos((prevTodos) =>
          prevTodos.map((todo) =>
            todo.id === id ? { ...todo, completed: !completed } : todo
          )
        );
      })
      .catch((error) => console.error(error));
  }

  function removeTodoTask(id: number) {
    fetch(`http://localhost:4000/todos/${id}?userId=${userId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
        } else {
          console.error("I have failed you!");
        }
      })
      .catch((error) => console.error(error));
  }

  return (
    <div className="wrapper">
      <div className="mini-wrapper todo-hover">
        <h2>To-do List</h2>
        <input
          className="input-field"
          type="text"
          value={newTodo}
          placeholder="New task"
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTodo();
            }
          }}
        />
        <button className="add-btn add-todo-hover" onClick={addTodo}>
          Add Task
        </button>
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              <label className="container">
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodoCompletion(todo.id, todo.completed)}
                />
                <span className="checkmark"></span>
              </label>
              <span
                style={{
                  textDecoration: todo.completed ? "line-through" : "none",
                  textDecorationColor: todo.completed ? "#fefefe" : "#000000",
                  flexGrow: 2,
                }}
              >
                {todo.title}
              </span>
              <button
                className="remove-btn"
                onClick={() => removeTodoTask(todo.id)}
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

export default TodoApp;
