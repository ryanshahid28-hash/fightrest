"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Check } from "lucide-react";

/* ── Types ────────────────────────────────── */
interface IgnoredItem {
  id: string;
  text: string;
  checked?: boolean;
}

/* ── LocalStorage helpers ────────────────── */
const STORAGE_KEY = "fc-anti-list";

function loadItems(): IgnoredItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveItems(items: IgnoredItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silently ignore
  }
}

/* ── Component ────────────────────────────── */
interface AntiToDoProps {
  onBack: () => void;
}

export default function AntiToDo({ onBack }: AntiToDoProps) {
  const [items, setItems] = useState<IgnoredItem[]>(() => loadItems());
  const [input, setInput] = useState("");

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const addItem = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setItems([...items, { id: crypto.randomUUID(), text: trimmed, checked: false }]);
    setInput("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const toggleItem = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  // Heavy "clunk" animation variants
  const clunkVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 400, 
        damping: 40,
        mass: 2
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.15 } 
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 flex flex-col items-center justify-start relative z-10 px-4">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", mass: 0.6, stiffness: 130, damping: 16 }}
        onClick={onBack}
        className="absolute top-6 left-6 text-neutral-500 hover:text-neutral-300 transition-colors z-20 font-mono text-xs tracking-widest uppercase"
      >
        ← return
      </motion.button>

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.4 }}
        className="w-full max-w-lg mx-auto mt-24"
      >
        {/* The brutalist card */}
        <div className="border border-neutral-800/50 rounded-none p-8 sm:p-10 bg-neutral-950 shadow-2xl">
          {/* Header */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-rose-900 text-center font-bold text-lg sm:text-2xl tracking-[0.3em] uppercase select-none mb-10"
          >
            THE FAT TO IGNORE
          </motion.h1>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-10"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="e.g., checking Instagram, perfectly centering a div..."
              className="w-full bg-transparent border-b border-neutral-800 pb-3 text-neutral-300 text-sm sm:text-base font-mono placeholder-neutral-700 focus:outline-none focus:border-rose-900 transition-colors rounded-none"
            />
          </motion.div>

          {/* List */}
          <div className="space-y-0">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={clunkVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="group"
                >
                  <div className="flex items-center gap-3 py-4 border-b border-neutral-900/50">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-5 h-5 flex flex-shrink-0 items-center justify-center rounded-none border transition-colors ${
                        item.checked
                          ? "bg-rose-950 text-rose-500 border-rose-900"
                          : "border-neutral-800 text-transparent hover:border-neutral-600"
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <span 
                      className={`flex-1 font-mono text-sm sm:text-base truncate transition-all duration-300 line-through decoration-neutral-800 ${
                        item.checked 
                          ? "text-rose-900/40 opacity-30" 
                          : "text-neutral-600 opacity-60"
                      }`}
                    >
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-opacity p-2"
                    >
                      <Trash2 size={16} />
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
                className="text-center text-neutral-700 text-xs font-mono tracking-widest mt-8 select-none"
              >
                QUARANTINE YOUR DISTRACTIONS.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
