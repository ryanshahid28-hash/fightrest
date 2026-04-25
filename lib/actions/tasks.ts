import { supabase } from "../supabase";

// Define the Task interface mirroring the Supabase schema
export interface SupabaseTask {
  id: string;
  user_id?: string;
  title: string;
  date: string;
  is_completed: boolean;
  order_index: number;
  created_at?: string;
}

/**
 * Fetch all tasks for a specific calendar date.
 * Tasks are sorted dynamically by their designated 'order_index' to maintain drag-and-drop order.
 * 
 * @param date - The date string formatted as YYYY-MM-DD
 */
export async function fetchTasks(date: string): Promise<SupabaseTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("date", date)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Insert a brand new task.
 * 
 * @param title - The text body of the task.
 * @param date - The date string (YYYY-MM-DD).
 * @param order_index - Integer mapping physical hierarchy for drag-and-drop constraints.
 */
export async function addTask(title: string, date: string, order_index: number): Promise<SupabaseTask> {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ title, date, order_index, is_completed: false }])
    .select() // Return the inserted row
    .single();

  if (error) {
    console.error("Error adding task:", error.message);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Toggle the boolean status of a specific task (Switch between Soap & Bubble state).
 * 
 * @param id - UUID of the task.
 * @param is_completed - The new boolean state.
 */
export async function toggleTaskCompletion(id: string, is_completed: boolean): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ is_completed })
    .eq("id", id);

  if (error) {
    console.error("Error toggling completion:", error.message);
    throw new Error(error.message);
  }
}

/**
 * Permanently delete a task globally.
 * 
 * @param id - UUID of the task.
 */
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
