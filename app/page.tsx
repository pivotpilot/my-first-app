"use client";

import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  // Check for an existing session
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user as User || null);

      if (data?.session?.user) {
        fetchTasks();
      }
    };

    checkUser();
  }, []);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*");
    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data);
    }
  };

  // Add a new task
  const addTask = async () => {
    if (!newTask) return;
  
    const { data: newEntry, error } = await supabase
      .from("tasks")
      .insert([{ title: newTask, completed: false }])
      .select("*"); // Ensures the inserted row is returned
  
    if (error) {
      console.error("Error adding task:", error);
    } else {
      // Ensure newEntry is added as an array
      setTasks((prev) => [...prev, ...newEntry]);
      setNewTask(""); // Clear the input
    }
  };

  // Handle login
  const handleLogin = async () => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      alert("Login failed! Check your email and password.");
    } else {
      setUser(data.user);
      fetchTasks(); // Fetch tasks for the logged-in user
      alert("Login successful!");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
    } else {
      setUser(null);
      setTasks([]); // Clear tasks when logged out
      alert("Logged out successfully!");
    }
  };

  const markAsCompleted = async (id) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: true })
      .eq("id", id);
  
    if (error) {
      console.error("Error marking task as completed:", error);
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: true } : task
        )
      );
    }
  };

  const deleteTask = async (id) => {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);
  
    if (error) {
      console.error("Error deleting task:", error);
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }
  };

  return (
    <div>
      <h1>Supabase Authentication & Task Manager</h1>

      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleLogout}>Logout</button>

          <h2>Your Tasks</h2>
          <input
            type="text"
            placeholder="Enter a new task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button onClick={addTask}>Add Task</button>

          {tasks.length > 0 ? (
            <ul>
              {tasks.map((task) => (
                <li key={task.id}>
                  {task.title} - {task.completed ? "Completed" : "Not Completed"}
                  {!task.completed && (<button onClick={() => markAsCompleted(task.id)}>Mark as Completed</button>
    )}
    <button onClick={() => deleteTask(task.id)}>Delete</button> 
                </li>
              ))}
            </ul>
          ) : (
            <p>No tasks yet!</p>
          )}
        </div>
      ) : (
        <div>
          <h2>Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      )}
    </div>
  );
}