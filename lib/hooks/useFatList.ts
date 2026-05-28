"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";

/* ── Types ────────────────────────────────────── */
export interface FatItem {
  id: string;
  text: string;
  checked: boolean;
  streakStart: string;   // ISO date YYYY-MM-DD
  lastBroken: string | null;
}

/* ── LocalStorage fallback ──────────────────── */
const STORAGE_KEY = "fc-anti-list";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadLocal(): FatItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old format: items without streakStart
    return parsed.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      text: (item.text ?? item.content) as string,
      checked: (item.checked ?? item.is_checked ?? false) as boolean,
      streakStart: (item.streakStart as string) || todayKey(),
      lastBroken: (item.lastBroken as string) || null,
    }));
  } catch {
    return [];
  }
}

function saveLocal(items: FatItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* storage full */ }
}

/* ── Streak calculation ──────────────────────── */
export function getStreakDays(item: FatItem): number {
  const start = new Date(item.streakStart + "T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getStreakEmoji(days: number): string {
  if (days >= 15) return "🔥🔥🔥🔥";
  if (days >= 8) return "🔥🔥🔥";
  if (days >= 4) return "🔥🔥";
  if (days >= 1) return "🔥";
  return "💤";
}

/* ── Hook ────────────────────────────────────── */
export function useFatList() {
  const { user } = useUser();
  const [items, setItems] = useState<FatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems(loadLocal());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("fat_list")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("fetchFatList error:", error.message);
      setItems(loadLocal());
    } else {
      const mapped: FatItem[] = (data || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        text: r.content as string,
        checked: r.is_checked as boolean,
        streakStart: r.streak_start as string,
        lastBroken: (r.last_broken as string) || null,
      }));
      setItems(mapped);
      saveLocal(mapped);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(
    async (text: string) => {
      const today = todayKey();
      const newItem: FatItem = {
        id: crypto.randomUUID(),
        text,
        checked: false,
        streakStart: today,
        lastBroken: null,
      };
      const updated = [...items, newItem];
      setItems(updated);
      saveLocal(updated);

      if (user) {
        const { error } = await supabase.from("fat_list").insert({
          id: newItem.id,
          user_id: user.id,
          content: text,
          is_checked: false,
          streak_start: today,
          last_broken: null,
        });
        if (error) console.warn("addFatItem error:", error.message);
      }
    },
    [items, user]
  );

  const removeItem = useCallback(
    async (id: string) => {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      saveLocal(updated);

      if (user) {
        const { error } = await supabase.from("fat_list").delete().eq("id", id);
        if (error) console.warn("removeFatItem error:", error.message);
      }
    },
    [items, user]
  );

  /**
   * "Break streak" — user admits they broke the rule.
   * Resets streak_start to today and marks last_broken.
   */
  const breakStreak = useCallback(
    async (id: string) => {
      const today = todayKey();
      const updated = items.map((i) =>
        i.id === id ? { ...i, checked: true, streakStart: today, lastBroken: today } : i
      );
      setItems(updated);
      saveLocal(updated);

      if (user) {
        const { error } = await supabase
          .from("fat_list")
          .update({ is_checked: true, streak_start: today, last_broken: today })
          .eq("id", id);
        if (error) console.warn("breakStreak error:", error.message);
      }
    },
    [items, user]
  );

  /**
   * Restore streak — undo an accidental check.
   * Reverts is_checked but does NOT restore the original streak_start
   * (the old start date is lost once broken).
   */
  const restoreStreak = useCallback(
    async (id: string) => {
      const updated = items.map((i) =>
        i.id === id ? { ...i, checked: false } : i
      );
      setItems(updated);
      saveLocal(updated);

      if (user) {
        const { error } = await supabase
          .from("fat_list")
          .update({ is_checked: false })
          .eq("id", id);
        if (error) console.warn("restoreStreak error:", error.message);
      }
    },
    [items, user]
  );

  const updateItem = useCallback(
    async (id: string, newText: string) => {
      const updated = items.map((i) =>
        i.id === id ? { ...i, text: newText } : i
      );
      setItems(updated);
      saveLocal(updated);

      if (user) {
        const { error } = await supabase
          .from("fat_list")
          .update({ content: newText })
          .eq("id", id);
        if (error) console.warn("updateFatItem error:", error.message);
      }
    },
    [items, user]
  );

  /* ── Aggregate stats ─────────────────────── */
  const totalStreakDays = useMemo(
    () => items.reduce((sum, item) => sum + getStreakDays(item), 0),
    [items]
  );

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    updateItem,
    breakStreak,
    restoreStreak,
    totalStreakDays,
    refetch: fetchItems,
  };
}
