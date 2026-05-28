import { supabase } from "../supabase";

/**
 * Supabase Data Actions
 *
 * Server-side helpers for tasks, happy list, and fat list.
 * All operations are scoped to the authenticated user via RLS.
 */

// ── Types ─────────────────────────────────────────
export interface SupabaseTask {
  id: string;
  user_id: string;
  title: string;
  date: string;
  is_completed: boolean;
  order_index: number;
  blocks: unknown[];
  rolled_over_from?: string | null;
  created_at?: string;
}

export interface SupabaseHappyItem {
  id: string;
  user_id: string;
  content: string;
  is_checked: boolean;
  created_at?: string;
}

export interface SupabaseFatItem {
  id: string;
  user_id: string;
  content: string;
  streak_start: string;
  last_broken: string | null;
  is_checked: boolean;
  created_at?: string;
}

// ── Tasks ─────────────────────────────────────────
export async function fetchTasks(date: string, userId: string): Promise<SupabaseTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error.message);
    throw new Error(error.message);
  }

  return (data || []) as SupabaseTask[];
}

export async function addTask(
  title: string,
  date: string,
  orderIndex: number,
  userId: string,
  blocks: unknown[] = []
): Promise<SupabaseTask> {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ title, date, order_index: orderIndex, is_completed: false, user_id: userId, blocks }])
    .select()
    .single();

  if (error) {
    console.error("Error adding task:", error.message);
    throw new Error(error.message);
  }

  return data as SupabaseTask;
}

export async function toggleTaskCompletion(id: string, isCompleted: boolean): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ is_completed: isCompleted })
    .eq("id", id);

  if (error) {
    console.error("Error toggling completion:", error.message);
    throw new Error(error.message);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting task:", error.message);
    throw new Error(error.message);
  }
}

export async function updateTaskBlocks(id: string, blocks: unknown[]): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ blocks })
    .eq("id", id);

  if (error) {
    console.error("Error updating blocks:", error.message);
    throw new Error(error.message);
  }
}

// ── Happy List ────────────────────────────────────
export async function fetchHappyList(userId: string): Promise<SupabaseHappyItem[]> {
  const { data, error } = await supabase
    .from("happy_list")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching happy list:", error.message);
    throw new Error(error.message);
  }

  return (data || []) as SupabaseHappyItem[];
}

// ── Fat List ──────────────────────────────────────
export async function fetchFatList(userId: string): Promise<SupabaseFatItem[]> {
  const { data, error } = await supabase
    .from("fat_list")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching fat list:", error.message);
    throw new Error(error.message);
  }

  return (data || []) as SupabaseFatItem[];
}

// ── Task dates for calendar ───────────────────────
export async function getTaskDatesForMonth(
  userId: string,
  year: number,
  month: number
): Promise<string[]> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("tasks")
    .select("date")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Error fetching task dates:", error.message);
    return [];
  }

  return [...new Set((data || []).map((r: { date: string }) => r.date))];
}
