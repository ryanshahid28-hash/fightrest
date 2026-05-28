"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";

/* ── Types ────────────────────────────────────── */
export interface HappyItem {
  id: string;
  text: string;
  checked: boolean;
}

/* ── LocalStorage fallback ──────────────────── */
const STORAGE_KEY = "fc-happy-list";

function loadLocal(): HappyItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: HappyItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* storage full */ }
}

/* ── Hook ────────────────────────────────────── */
export function useHappyList() {
  const { user } = useUser();
  const [items, setItems] = useState<HappyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems(loadLocal());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("happy_list")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("fetchHappyList error:", error.message);
      setItems(loadLocal());
    } else {
      const mapped: HappyItem[] = (data || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        text: r.content as string,
        checked: r.is_checked as boolean,
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
      const newItem: HappyItem = { id: crypto.randomUUID(), text, checked: false };
      const updated = [...items, newItem];
      setItems(updated);
      saveLocal(updated);

      if (user) {
        const { error } = await supabase.from("happy_list").insert({
          id: newItem.id,
          user_id: user.id,
          content: text,
          is_checked: false,
        });
        if (error) console.warn("addHappyItem error:", error.message);
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
        const { error } = await supabase.from("happy_list").delete().eq("id", id);
        if (error) console.warn("removeHappyItem error:", error.message);
      }
    },
    [items, user]
  );

  const toggleItem = useCallback(
    async (id: string) => {
      const updated = items.map((i) =>
        i.id === id ? { ...i, checked: !i.checked } : i
      );
      setItems(updated);
      saveLocal(updated);

      if (user) {
        const item = updated.find((i) => i.id === id);
        if (item) {
          const { error } = await supabase
            .from("happy_list")
            .update({ is_checked: item.checked })
            .eq("id", id);
          if (error) console.warn("toggleHappyItem error:", error.message);
        }
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
          .from("happy_list")
          .update({ content: newText })
          .eq("id", id);
        if (error) console.warn("updateHappyItem error:", error.message);
      }
    },
    [items, user]
  );

  return { items, isLoading, addItem, removeItem, toggleItem, updateItem, refetch: fetchItems };
}
