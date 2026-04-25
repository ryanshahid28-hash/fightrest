"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskTracker from "./components/TaskTracker";
import Calendar from "./components/Calendar";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start">
      {/* Animated mesh background */}
      <div className="bg-mesh">
        <div className="bg-mesh-extra" />
      </div>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Main content — crossfade between Calendar and TaskTracker */}
      <AnimatePresence mode="wait">
        {selectedDate === null ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={SPRING_SOFT}
            className="w-full"
          >
            <Calendar onSelectDate={(dateKey) => setSelectedDate(dateKey)} />
          </motion.div>
        ) : (
          <motion.div
            key="tracker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={SPRING_SOFT}
            className="w-full"
          >
            <TaskTracker dateKey={selectedDate} onBack={() => setSelectedDate(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
