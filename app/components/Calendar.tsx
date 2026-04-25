"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Smile } from "lucide-react";

/* ── Spring configs ───────────────────────── */
const SPRING = { type: "spring" as const, mass: 0.8, stiffness: 180, damping: 20 };
const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

interface CalendarProps {
  onSelectDate: (dateKey: string) => void;
  onOpenHappy: () => void;
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

/* ── Check if a date has tasks stored ─────── */
function dateHasTasks(dateKey: string): boolean {
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

export default function Calendar({ onSelectDate, onOpenHappy }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next

  const todayKey = getTodayKey();

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfMonth(viewYear, viewMonth), [viewYear, viewMonth]);

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
  // Pad remaining cells to complete last row
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
        <h1 className="fc-title">Fight Club</h1>
        <div className="fc-subtitle">
          <span className="fc-rule" />
          <span className="text-white/40 text-xs tracking-[0.25em] uppercase font-mono">
            choose your day
          </span>
          <span className="fc-rule" />
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
              className="p-1.5 rounded-lg text-white/20 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
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
              const hasTasks = dateHasTasks(dateKey);

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
                      ? "bg-pink-500/15 text-pink-400 font-bold border border-pink-500/30 shadow-[0_0_16px_rgba(236,72,153,0.2)]"
                      : "text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent"
                    }
                  `}
                >
                  <span>{day}</span>
                  {/* Task indicator dot */}
                  {hasTasks && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? "bg-pink-400" : "bg-white/30"}`} />
                  )}
                  {/* Today pulse ring */}
                  {isToday && (
                    <span className="absolute inset-0 rounded-xl animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite] border border-pink-500/20" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Quick action: go to today ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-6 text-center"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectDate(todayKey)}
          className="fc-add-btn px-6 py-3 rounded-xl text-white font-bold text-sm tracking-wider uppercase"
        >
          Fight Today
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenHappy}
          className="ml-3 px-5 py-3 rounded-xl text-white/50 hover:text-white font-bold text-sm tracking-wider uppercase border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors inline-flex items-center gap-2"
        >
          <Smile size={16} />
          Happy
        </motion.button>
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
