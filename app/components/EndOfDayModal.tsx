"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles } from "lucide-react";
import type { Task } from "@/lib/hooks/useTasks";

const SPRING = { type: "spring" as const, mass: 0.8, stiffness: 180, damping: 20 };
const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

interface EndOfDayModalProps {
  tasks: Task[];
  dateKey: string;
  onClose: () => void;
  onRollover: (taskIds: string[], note: string) => void;
}

function getMotivation(pct: number): { emoji: string; message: string } {
  if (pct === 100) return { emoji: "🧼", message: "PERFECT DAY! You're unstoppable." };
  if (pct >= 80) return { emoji: "🔥", message: "Incredible. You crushed it today." };
  if (pct >= 60) return { emoji: "💪", message: "Solid day. Keep the momentum going." };
  if (pct >= 40) return { emoji: "🫧", message: "Progress is progress. Tomorrow is another fight." };
  if (pct >= 20) return { emoji: "🌱", message: "Small steps count. Show up again tomorrow." };
  return { emoji: "💤", message: "Rest up. Tomorrow you come back swinging." };
}

export default function EndOfDayModal({ tasks, dateKey, onClose, onRollover }: EndOfDayModalProps) {
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const incompleteTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);

  const total = tasks.length;
  const done = completedTasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const motivation = getMotivation(pct);

  const [selectedForRollover, setSelectedForRollover] = useState<Set<string>>(
    new Set(incompleteTasks.map((t) => t.id))
  );
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleRollover = (id: string) => {
    setSelectedForRollover((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFinish = () => {
    setSubmitted(true);
    onRollover(Array.from(selectedForRollover), note);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={SPRING}
          className="relative z-10 w-full max-w-md glass p-8 space-y-6 max-h-[85vh] overflow-y-auto"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"
          >
            <X size={18} />
          </button>

          {!submitted ? (
            <>
              {/* Stats */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...SPRING, delay: 0.1 }}
                  className="text-5xl"
                >
                  {motivation.emoji}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING_SOFT, delay: 0.2 }}
                >
                  <h2 className="text-white font-bold text-2xl font-mono tracking-wide">
                    {done}/{total}
                  </h2>
                  <p className="text-white/40 text-xs font-mono tracking-wider uppercase mt-1">
                    tasks completed
                  </p>
                </motion.div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#B11F42] to-[#E23D68]"
                  />
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/50 text-sm font-mono italic"
                >
                  {motivation.message}
                </motion.p>
              </div>

              {/* Incomplete tasks — rollover selection */}
              {incompleteTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight size={14} className="text-[#E23D68]" />
                    <span className="text-white/50 text-xs font-mono tracking-wider uppercase">
                      Roll to tomorrow
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {incompleteTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => toggleRollover(task.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 ${
                          selectedForRollover.has(task.id)
                            ? "bg-[#E23D68]/10 border border-[#E23D68]/20"
                            : "bg-white/3 border border-white/5 opacity-50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            selectedForRollover.has(task.id)
                              ? "border-[#E23D68] bg-[#E23D68]/20"
                              : "border-white/20"
                          }`}
                        >
                          {selectedForRollover.has(task.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-sm bg-[#E23D68]"
                            />
                          )}
                        </div>
                        <span className="text-white/70 text-sm font-mono truncate">
                          {task.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reflection note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <span className="text-white/30 text-[10px] font-mono tracking-widest uppercase">
                  Reflection (optional)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="How did today go? What will you fight for tomorrow?"
                  rows={3}
                  className="glass-textarea w-full px-3 py-2 text-sm text-white/80 placeholder-white/20 font-mono"
                />
              </motion.div>

              {/* Submit */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleFinish}
                className="fc-add-btn w-full px-5 py-3 rounded-xl text-white font-medium text-sm uppercase tracking-wider"
              >
                <Sparkles size={16} className="inline mr-2" />
                Finish Day
              </motion.button>
            </>
          ) : (
            /* ── Submitted confirmation ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRING}
              className="text-center space-y-4 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                className="text-5xl"
              >
                ✨
              </motion.div>
              <h3 className="text-white font-bold text-lg font-mono">Day complete</h3>
              <p className="text-white/40 text-xs font-mono">
                {selectedForRollover.size > 0
                  ? `${selectedForRollover.size} task${selectedForRollover.size > 1 ? "s" : ""} rolled to tomorrow.`
                  : "Nothing rolled over. Clean slate tomorrow."}
              </p>
              <button
                onClick={onClose}
                className="mt-4 text-white/30 hover:text-white/70 text-xs font-mono tracking-wider transition-colors"
              >
                close
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
