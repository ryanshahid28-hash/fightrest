"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";

/* ── Types (shared across the app) ──────────── */
export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ContentBlock {
  id: string;
  type: "text" | "image" | "link" | "music" | "todo" | "spark";
  value: string;
  todos?: TodoItem[];
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  expanded: boolean;
  blocks: ContentBlock[];
  rolledOverFrom?: string | null;
}

/* ── LocalStorage fallback ──────────────────── */
const STORAGE_PREFIX = "fc-tasks-";

function loadLocal(dateKey: string): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + dateKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(dateKey: string, tasks: Task[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + dateKey, JSON.stringify(tasks));
  } catch {
    /* storage full */
  }
}

/* ── DB → UI mapping ───────────────────────── */
function dbToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    text: row.title as string,
    completed: row.is_completed as boolean,
    expanded: false,
    blocks: (row.blocks as ContentBlock[]) || [],
    rolledOverFrom: (row.rolled_over_from as string) ?? null,
  };
}

/* ── Hook ────────────────────────────────────── */
export function useTasks(dateKey: string) {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Fetch ─────────────────────────────────── */
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks(loadLocal(dateKey));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", dateKey)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("fetchTasks error:", error.message);
      setTasks(loadLocal(dateKey));
    } else {
      const mapped = (data || []).map(dbToTask);
      setTasks(mapped);
      saveLocal(dateKey, mapped); // keep local cache
    }
    setIsLoading(false);
  }, [user, dateKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* ── Persist helper ─────────────────────────── */
  const persist = useCallback(
    async (updated: Task[]) => {
      setTasks(updated);
      saveLocal(dateKey, updated);

      if (!user) return;

      // Upsert all tasks for this date
      const rows = updated.map((t, i) => ({
        id: t.id,
        user_id: user.id,
        title: t.text,
        date: dateKey,
        is_completed: t.completed,
        order_index: i,
        blocks: t.blocks,
        rolled_over_from: t.rolledOverFrom || null,
      }));

      const { error } = await supabase.from("tasks").upsert(rows, { onConflict: "id" });
      if (error) console.error("persist tasks error:", error.message);
    },
    [user, dateKey]
  );

  /* ── CRUD ───────────────────────────────────── */
  const addTask = useCallback(
    async (text: string) => {
      const newTask: Task = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        expanded: false,
        blocks: [],
      };
      const updated = [...tasks, newTask];
      await persist(updated);
    },
    [tasks, persist]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const updated = tasks.filter((t) => t.id !== id);
      await persist(updated);

      if (user) {
        await supabase.from("tasks").delete().eq("id", id);
      }
    },
    [tasks, persist, user]
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      const updated = tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      await persist(updated);
    },
    [tasks, persist]
  );

  const toggleExpand = useCallback(
    (id: string) => {
      setTasks(tasks.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)));
    },
    [tasks]
  );

  const reorder = useCallback(
    async (newOrder: Task[]) => {
      await persist(newOrder);
    },
    [persist]
  );

  const updateBlocks = useCallback(
    async (taskId: string, blocks: ContentBlock[]) => {
      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, blocks } : t
      );
      await persist(updated);
    },
    [tasks, persist]
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      const updated = tasks.map((t) =>
        t.id === id ? { ...t, ...changes } : t
      );
      await persist(updated);
    },
    [tasks, persist]
  );

  /* ── Date-level queries ─────────────────────── */
  const getTaskDatesForMonth = useCallback(
    async (year: number, month: number): Promise<Set<string>> => {
      if (!user) {
        // Fallback: scan localStorage
        const dates = new Set<string>();
        if (typeof window === "undefined") return dates;
        const prefix = STORAGE_PREFIX;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) {
            const dateKey = key.slice(prefix.length);
            const [y, m] = dateKey.split("-").map(Number);
            if (y === year && m === month + 1) {
              try {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed) && parsed.length > 0) dates.add(dateKey);
                }
              } catch { /* skip */ }
            }
          }
        }
        return dates;
      }

      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

      const { data, error } = await supabase
        .from("tasks")
        .select("date")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) {
        console.error("getTaskDatesForMonth error:", error.message);
        return new Set<string>();
      }

      return new Set((data || []).map((r: { date: string }) => r.date));
    },
    [user]
  );

  return {
    tasks,
    setTasks,
    isLoading,
    addTask,
    deleteTask,
    toggleComplete,
    toggleExpand,
    reorder,
    updateBlocks,
    updateTask,
    getTaskDatesForMonth,
    refetch: fetchTasks,
  };
}
