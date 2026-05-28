"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";

/* ── Types ────────────────────────────────────── */
export type Theme = "fight" | "zen";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/* ── LocalStorage fallback ──────────────────── */
const STORAGE_KEY = "fc-theme";

function loadThemeLocal(): Theme {
  if (typeof window === "undefined") return "fight";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "zen" ? "zen" : "fight";
  } catch {
    return "fight";
  }
}

function saveThemeLocal(theme: Theme) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch { /* ignore */ }
}

/* ── Apply theme to DOM ─────────────────────── */
function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove("theme-fight", "theme-zen");
  html.classList.add(`theme-${theme}`);

  // Also toggle dark class for Tailwind
  if (theme === "zen") {
    html.classList.remove("dark");
  } else {
    html.classList.add("dark");
  }
}

/* ── Provider ───────────────────────────────── */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [theme, setThemeState] = useState<Theme>("fight");
  const [isLoading, setIsLoading] = useState(true);

  // Load theme on mount
  useEffect(() => {
    const local = loadThemeLocal();
    setThemeState(local);
    applyTheme(local);
    setIsLoading(false);
  }, []);

  // Sync from Supabase when user logs in
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("theme")
        .eq("user_id", user.id)
        .single();

      if (data?.theme) {
        const t = data.theme === "zen" ? "zen" : "fight";
        setThemeState(t);
        saveThemeLocal(t);
        applyTheme(t);
      }
    })();
  }, [user]);

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);
      saveThemeLocal(newTheme);
      applyTheme(newTheme);

      if (user) {
        await supabase.from("user_preferences").upsert(
          {
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
    },
    [user]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ── Hook ────────────────────────────────────── */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
