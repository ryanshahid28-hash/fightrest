"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Smile, Ban, Sparkles, Wind } from "lucide-react";
import { useUser } from "@/lib/auth";
import { useHappyList } from "@/lib/hooks/useHappyList";
import { supabase } from "@/lib/supabase";

/* ── Spring configs ───────────────────────── */
const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

interface CalendarProps {
  onSelectDate: (dateKey: string) => void;
  onOpenHappy: () => void;
  onOpenAnti: () => void;
  onOpenInsights?: () => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTodayKey() {
  const d = new Date();
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

/* ── Check if a date has tasks (localStorage fallback) ── */
function dateHasTasksLocal(dateKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(`fc-tasks-${dateKey}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export default function Calendar({ onSelectDate, onOpenHappy, onOpenAnti, onOpenInsights }: CalendarProps) {
  const { user } = useUser();
  const { items: happyItems } = useHappyList();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [direction, setDirection] = useState(0);
  const [taskDates, setTaskDates] = useState<Set<string>>(new Set());

  const todayKey = getTodayKey();

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  /* ── Fetch task dates for the visible month ── */
  const fetchTaskDates = useCallback(async () => {
    if (!user) {
      // Fallback to localStorage
      const dates = new Set<string>();
      for (let d = 1; d <= daysInMonth; d++) {
        const dk = toDateKey(viewYear, viewMonth, d);
        if (dateHasTasksLocal(dk)) dates.add(dk);
      }
      setTaskDates(dates);
      return;
    }

    const startDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
    const endDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("tasks")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.warn("fetchTaskDates error:", error.message);
      return;
    }

    setTaskDates(new Set((data || []).map((r: { date: string }) => r.date)));
  }, [user, viewYear, viewMonth, daysInMonth]);

  useEffect(() => {
    fetchTaskDates();
  }, [fetchTaskDates]);

  const prevMonth = () => {
    setDirection(-1);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    setDirection(1);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setDirection(0);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir >= 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-12 pb-8 relative z-10">
      {/* ── Title ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SOFT}
        className="text-center mb-8"
      >
        <h1 className="fc-title italic text-5xl tracking-tight mb-2">FIGHT CLUB</h1>
        <div className="fc-subtitle">
          <span className="text-white/60 text-sm tracking-[0.2em] uppercase font-mono">
            CHOOSE YOUR DAY
          </span>
        </div>
      </motion.div>

      {/* ── Month Navigation ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass p-5"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl text-white/30 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.h2
                key={`${viewYear}-${viewMonth}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", mass: 0.5, stiffness: 200, damping: 18 }}
                className="text-white font-bold text-lg tracking-[0.15em] uppercase font-mono select-none"
              >
                {MONTH_NAMES[viewMonth]} {viewYear}
              </motion.h2>
            </AnimatePresence>
            <button
              onClick={goToToday}
              className="p-1.5 rounded-lg text-white/20 hover:text-[#E23D68] hover:bg-[#E23D68]/10 transition-colors"
              title="Go to today"
            >
              <CalendarDays size={16} />
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-xl text-white/30 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ── Weekday Headers ── */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-mono tracking-widest text-white/25 uppercase py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* ── Day Grid ── */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", mass: 0.5, stiffness: 200, damping: 18 }}
            className="grid grid-cols-7 gap-1"
          >
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }

              const dateKey = toDateKey(viewYear, viewMonth, day);
              const isToday = dateKey === todayKey;
              const hasTasks = taskDates.has(dateKey);

              return (
                <motion.button
                  key={dateKey}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectDate(dateKey)}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center relative
                    font-mono text-sm transition-colors duration-300 cursor-pointer
                    ${isToday
                      ? "bg-[#E23D68] text-white font-bold shadow-[0_0_20px_#E23D68] border border-[#F68FA6]/50"
                      : "text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent"
                    }
                  `}
                >
                  <span>{day}</span>
                  {hasTasks && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-white/30"}`} />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-6 flex flex-col items-center justify-center gap-6"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectDate(todayKey)}
          className="fc-add-btn px-10 py-4 rounded-xl text-white font-bold text-xl uppercase tracking-wider"
        >
          FIGHT TODAY
        </motion.button>
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-center gap-4 w-full mt-2">
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenHappy}
            className="w-14 h-14 bg-[#121212] rounded-lg text-white/80 hover:text-white border border-[#333] hover:border-[#555] transition-colors flex items-center justify-center shadow-md"
          >
            <Smile size={24} />
          </motion.button>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-[#E23D68] text-white text-[11px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-[0_0_12px_rgba(226,61,104,0.4)] pointer-events-none">
            Happy List
          </span>
        </div>
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenAnti}
            className="w-14 h-14 bg-[#121212] rounded-lg text-[#E23D68]/80 hover:text-[#F68FA6] border border-[#333] hover:border-[#E23D68]/50 transition-colors flex items-center justify-center shadow-md"
          >
            <Ban size={24} />
          </motion.button>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-[#E23D68] text-white text-[11px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-[0_0_12px_rgba(226,61,104,0.4)] pointer-events-none">
            Ignore
          </span>
        </div>
        {onOpenInsights && (
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenInsights}
              className="w-14 h-14 bg-[#121212] rounded-lg text-amber-500/80 hover:text-amber-400 border border-[#333] hover:border-amber-500/50 transition-colors flex items-center justify-center shadow-md"
            >
              <Sparkles size={24} />
            </motion.button>
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-[#E23D68] text-white text-[11px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-[0_0_12px_rgba(226,61,104,0.4)] pointer-events-none">
              Insights
            </span>
          </div>
        )}
        </div>
      </motion.div>

      {/* ── Footer ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-8 text-center"
      >
        <p className="text-white/15 text-[10px] font-mono tracking-wider">
          first rule: you do not talk about fight club
        </p>
      </motion.div>
    </div>
  );
}
