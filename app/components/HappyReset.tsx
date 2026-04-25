"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

/* ── Types ────────────────────────────────── */
interface HappyItem {
  id: string;
  text: string;
}

/* ── LocalStorage helpers ────────────────── */
const STORAGE_KEY = "fc-happy-list";

function loadItems(): HappyItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveItems(items: HappyItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silently ignore
  }
}

/* ── Component ────────────────────────────── */
interface HappyResetProps {
  onBack: () => void;
}

export default function HappyReset({ onBack }: HappyResetProps) {
  const [items, setItems] = useState<HappyItem[]>(() => loadItems());
  const [input, setInput] = useState("");

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const addItem = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setItems([...items, { id: crypto.randomUUID(), text: trimmed }]);
    setInput("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-start relative z-10">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", mass: 0.6, stiffness: 130, damping: 16 }}
        onClick={onBack}
        className="absolute top-6 left-6 text-white/30 hover:text-white/80 transition-colors z-20 font-mono text-xs tracking-widest uppercase"
      >
        ← back
      </motion.button>

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", mass: 0.8, stiffness: 120, damping: 18 }}
        className="w-full max-w-lg mx-auto mt-24 px-4"
      >
        {/* The brutalist card */}
        <div className="border border-white/20 rounded-sm p-8 sm:p-10">
          {/* Header */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-white text-center font-semibold text-lg sm:text-xl tracking-[0.2em] uppercase select-none mb-8"
          >
            I feel happy when I&apos;m
          </motion.h1>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="...coding / listening to Yuvan / at the gym"
              className="w-full bg-transparent border-b border-white/15 pb-3 text-white text-sm sm:text-base font-mono placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
            />
          </motion.div>

          {/* List */}
          <div className="space-y-0">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ type: "spring", mass: 0.5, stiffness: 200, damping: 20 }}
                  className="group"
                >
                  <div className="flex items-center gap-3 py-3 border-b border-white/5">
                    <span className="text-white/30 text-xs select-none">●</span>
                    <span className="flex-1 text-white text-sm sm:text-base font-mono">
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-white transition-opacity p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          <AnimatePresence>
            {items.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-white/10 text-xs font-mono tracking-wider mt-8 select-none"
              >
                type something that makes you alive. press enter.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-white/10 text-[10px] font-mono tracking-wider mt-6 select-none"
        >
          a secret manifesto of things that keep the engine running
        </motion.p>
      </motion.div>
    </div>
  );
}
