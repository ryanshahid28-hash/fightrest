"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";

/* ── Types ────────────────────────────────────── */
export interface DailyReflection {
  id?: string;
  date: string;
  totalTasks: number;
  completedTasks: number;
  summaryText: string;
}

/* ── Hook ────────────────────────────────────── */
export function useReflections() {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);

  /**
   * Save (upsert) a daily reflection.
   */
  const saveReflection = useCallback(
    async (reflection: DailyReflection) => {
      if (!user) return;
      setSaving(true);

      const { error } = await supabase.from("daily_reflections").upsert(
        {
          user_id: user.id,
          date: reflection.date,
          total_tasks: reflection.totalTasks,
          completed_tasks: reflection.completedTasks,
          summary_text: reflection.summaryText,
        },
        { onConflict: "user_id,date" }
      );

      if (error) console.error("saveReflection error:", error.message);
      setSaving(false);
    },
    [user]
  );

  /**
   * Roll over incomplete tasks to the next day.
   */
  const rolloverTasks = useCallback(
    async (fromDate: string, taskIds: string[]) => {
      if (!user || taskIds.length === 0) return;

      // Calculate next day
      const [y, m, d] = fromDate.split("-").map(Number);
      const next = new Date(y, m - 1, d + 1);
      const toDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;

      // Fetch the tasks to roll over
      const { data: sourceTasks, error: fetchErr } = await supabase
        .from("tasks")
        .select("*")
        .in("id", taskIds);

      if (fetchErr || !sourceTasks) {
        console.error("rollover fetch error:", fetchErr?.message);
        return;
      }

      // Get existing task count for the target date (for order_index)
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("date", toDate);

      const startIndex = count || 0;

      // Create copies for the next day
      const newTasks = sourceTasks.map((t: Record<string, unknown>, i: number) => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: t.title as string,
        date: toDate,
        is_completed: false,
        order_index: startIndex + i,
        blocks: t.blocks || [],
        rolled_over_from: fromDate,
      }));

      const { error: insertErr } = await supabase.from("tasks").insert(newTasks);
      if (insertErr) console.error("rollover insert error:", insertErr.message);

      return toDate;
    },
    [user]
  );

  /**
   * Fetch reflection for a specific date.
   */
  const getReflection = useCallback(
    async (date: string): Promise<DailyReflection | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .single();

      if (error || !data) return null;

      return {
        id: data.id as string,
        date: data.date as string,
        totalTasks: data.total_tasks as number,
        completedTasks: data.completed_tasks as number,
        summaryText: data.summary_text as string,
      };
    },
    [user]
  );

  return { saveReflection, rolloverTasks, getReflection, saving };
}
