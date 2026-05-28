"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Flame, AlertTriangle } from "lucide-react";
import { useFatList, getStreakDays, getStreakEmoji } from "@/lib/hooks/useFatList";
import EditableListItem from "./EditableListItem";

/* ── Component ────────────────────────────── */
interface AntiToDoProps {
  onBack: () => void;
}

export default function AntiToDo({ onBack }: AntiToDoProps) {
  const { items, isLoading, addItem, removeItem, updateItem, breakStreak, restoreStreak, totalStreakDays } = useFatList();
  const [input, setInput] = useState("");
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [confirmBreak, setConfirmBreak] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setInput("");
  };

  const handleBreakStreak = (id: string) => {
    // Show shake animation
    setShakingId(id);
    setTimeout(() => setShakingId(null), 600);

    breakStreak(id);
    setConfirmBreak(null);
  };

  const handleToggle = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (item.checked) {
      // Restore streak (undo accidental break)
      restoreStreak(id);
    } else {
      // Confirm before breaking
      setConfirmBreak(id);
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
            className="text-rose-900 text-center font-bold text-lg sm:text-2xl tracking-[0.3em] uppercase select-none mb-4"
          >
            THE FAT TO IGNORE
          </motion.h1>

          {/* Total streak score & Review button */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8 flex flex-col items-center gap-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-950/30 border border-rose-900/20">
                <Flame size={14} className="text-rose-500" />
                <span className="text-rose-500/80 text-xs font-mono tracking-wider">
                  {totalStreakDays} total streak days
                </span>
              </div>
              <button
                onClick={() => {
                  setReviewIndex(0);
                  setShowReviewModal(true);
                }}
                className="px-4 py-2 rounded border border-rose-900/50 text-rose-500/80 text-xs font-mono uppercase tracking-widest hover:bg-rose-950/20 transition-colors"
              >
                End Day Review
              </button>
            </motion.div>
          )}

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
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g., checking Instagram, perfectly centering a div..."
              className="w-full bg-transparent border-b border-neutral-800 pb-3 text-neutral-300 text-sm sm:text-base font-mono placeholder-neutral-700 focus:outline-none focus:border-rose-900 transition-colors rounded-none"
            />
          </motion.div>

          {/* Loading state */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-neutral-900/50 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* List */}
              <div className="space-y-0">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => {
                    const streakDays = getStreakDays(item);
                    const streakEmoji = getStreakEmoji(streakDays);
                    const isShaking = shakingId === item.id;
                    const isConfirming = confirmBreak === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -30 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          x: isShaking ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.95,
                          transition: { duration: 0.15 },
                        }}
                        transition={{
                          type: "spring",
                          stiffness: isShaking ? 500 : 400,
                          damping: isShaking ? 10 : 40,
                          mass: isShaking ? 0.5 : 2,
                        }}
                        className="group"
                      >
                        <div className={`flex items-center gap-3 py-4 border-b border-neutral-900/50 ${
                          isConfirming ? "bg-rose-950/10" : ""
                        }`}>
                          {/* Check / Break button */}
                          <button
                            onClick={() => handleToggle(item.id)}
                            className={`w-5 h-5 flex flex-shrink-0 items-center justify-center rounded-none border transition-colors ${
                              item.checked
                                ? "bg-rose-950 text-rose-500 border-rose-900"
                                : "border-neutral-800 text-transparent hover:border-neutral-600"
                            }`}
                          >
                            {item.checked && <AlertTriangle size={12} strokeWidth={3} />}
                          </button>

                          {/* Content + streak */}
                          <div className="flex-1 min-w-0 flex flex-col">
                            <EditableListItem
                              initialText={item.text}
                              onSave={(newText) => updateItem(item.id, newText)}
                              onDelete={() => removeItem(item.id)}
                              textClassName={`font-mono text-sm sm:text-base block truncate transition-all duration-300 ${
                                item.checked
                                  ? "text-rose-900/40 line-through"
                                  : "text-neutral-400"
                              }`}
                            />

                            {/* Streak display */}
                            <div className="flex items-center gap-2 mt-1">
                              <motion.span
                                key={streakDays}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="text-xs"
                              >
                                {streakEmoji}
                              </motion.span>
                              <span className={`text-[11px] font-mono tracking-wide ${
                                streakDays === 0
                                  ? "text-rose-900/50"
                                  : streakDays >= 15
                                  ? "text-orange-400/80"
                                  : streakDays >= 7
                                  ? "text-amber-500/60"
                                  : "text-neutral-600"
                              }`}>
                                {streakDays === 0
                                  ? item.lastBroken
                                    ? "streak broken today"
                                    : "just started"
                                  : `${streakDays} day${streakDays !== 1 ? "s" : ""} clean`}
                              </span>

                              {/* Streak glow for high streaks */}
                              {streakDays >= 15 && (
                                <motion.span
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="text-[10px] text-orange-400/60 font-mono uppercase tracking-widest"
                                >
                                  legendary
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Confirm break overlay */}
                        <AnimatePresence>
                          {isConfirming && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: "spring", mass: 0.5, stiffness: 200, damping: 20 }}
                              className="overflow-hidden"
                            >
                              <div className="flex items-center gap-3 px-4 py-3 bg-rose-950/20 border-b border-rose-900/20">
                                <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                                <span className="text-rose-400/70 text-xs font-mono">
                                  Break your {streakDays}-day streak?
                                </span>
                                <button
                                  onClick={() => handleBreakStreak(item.id)}
                                  className="ml-auto px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 transition-colors"
                                >
                                  Yes, I broke it
                                </button>
                                <button
                                  onClick={() => setConfirmBreak(null)}
                                  className="px-3 py-1 rounded text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
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
            </>
          )}
        </div>
      </motion.div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", mass: 0.5, stiffness: 200, damping: 20 }}
              className="w-full max-w-md p-8 rounded-none border border-neutral-800 bg-neutral-950 shadow-2xl relative overflow-hidden"
            >
              {reviewIndex < items.length ? (
                <div className="text-center space-y-8">
                  <div className="space-y-2">
                    <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">
                      Habit {reviewIndex + 1} of {items.length}
                    </p>
                    <h2 className="text-xl font-bold font-mono text-rose-500 uppercase tracking-wide">
                      Did you resist today?
                    </h2>
                  </div>
                  
                  <div className="p-6 bg-neutral-900/50 border border-neutral-800/50">
                    <p className="text-lg font-mono text-neutral-300">
                      {items[reviewIndex].text}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                      onClick={() => {
                        breakStreak(items[reviewIndex].id);
                        if (reviewIndex + 1 < items.length) {
                          setReviewIndex(reviewIndex + 1);
                        } else {
                          setShowReviewModal(false);
                        }
                      }}
                      className="flex-1 py-3 rounded-none border border-neutral-700 text-neutral-400 font-bold font-mono uppercase hover:bg-neutral-800 transition-colors"
                    >
                      No
                    </button>
                    <button
                      onClick={() => {
                        if (items[reviewIndex].checked) {
                          restoreStreak(items[reviewIndex].id);
                        }
                        if (reviewIndex + 1 < items.length) {
                          setReviewIndex(reviewIndex + 1);
                        } else {
                          setShowReviewModal(false);
                        }
                      }}
                      className="flex-1 py-3 rounded-none border border-rose-900 bg-rose-950/20 text-rose-500 font-bold font-mono uppercase hover:bg-rose-900/40 transition-colors"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
