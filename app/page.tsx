"use client";

import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<{ id: number; title: string; completed: boolean }[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);

      if (data?.session?.user) {
        fetchTasks();
      }
    };

    checkUser();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*");
    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data || []);
    }
  };

  const addTask = async () => {
    if (!newTask) return;

    const { data: newEntry, error } = await supabase
      .from("tasks")
      .insert([{ title: newTask, completed: false }])
      .select("*");

    if (error) {
      console.error("Error adding task:", error);
    } else {
      setTasks((prev) => [...prev, ...(newEntry || [])]);
      setNewTask("");
    }
  };

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
      fetchTasks();
      alert("Login successful!");
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
    } else {
      setUser(null);
      setTasks([]);
      alert("Logged out successfully!");
    }
  };

  const markAsCompleted = async (id: number) => {
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

  const deleteTask = async (id: number) => {
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
                  {!task.completed && (
                    <button onClick={() => markAsCompleted(task.id)}>Mark as Completed</button>
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