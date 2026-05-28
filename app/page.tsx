"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/hooks/useTheme";
import AuthGate from "./components/AuthGate";
import TaskTracker from "./components/TaskTracker";
import Calendar from "./components/Calendar";
import HappyReset from "./components/HappyReset";
import AntiToDo from "./components/AntiToDo";
import InsightsPanel from "./components/InsightsPanel";
import ThemeSwitcher from "./components/ThemeSwitcher";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

type View = "calendar" | "tracker" | "happy" | "anti" | "insights";

export default function Home() {
  const [view, setView] = useState<View>("calendar");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const goToCalendar = () => setView("calendar");

  const goToTracker = (dateKey: string) => {
    setSelectedDate(dateKey);
    setView("tracker");
  };

  const goToHappy = () => setView("happy");
  const goToAnti = () => setView("anti");
  const goToInsights = () => setView("insights");

  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthGate>
          <main className="relative min-h-screen flex flex-col items-center justify-start">
            {/* Animated mesh background — hidden on HappyReset/AntiToDo for pure black */}
            {(view !== "happy" && view !== "anti") && (
              <>
                <div className="bg-mesh">
                  <div className="bg-mesh-extra" />
                </div>
                <div className="noise-overlay" />
              </>
            )}

            {/* Main content — crossfade between views */}
            <AnimatePresence mode="wait">
              {view === "calendar" && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={SPRING_SOFT}
                  className="w-full"
                >
                  <Calendar
                    onSelectDate={goToTracker}
                    onOpenHappy={goToHappy}
                    onOpenAnti={goToAnti}
                    onOpenInsights={goToInsights}
                  />
                </motion.div>
              )}

              {view === "tracker" && (
                <motion.div
                  key="tracker"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={SPRING_SOFT}
                  className="w-full"
                >
                  <TaskTracker dateKey={selectedDate} onBack={goToCalendar} />
                </motion.div>
              )}

              {view === "happy" && (
                <motion.div
                  key="happy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={SPRING_SOFT}
                  className="w-full"
                >
                  <HappyReset onBack={goToCalendar} />
                </motion.div>
              )}

              {view === "anti" && (
                <motion.div
                  key="anti"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={SPRING_SOFT}
                  className="w-full"
                >
                  <AntiToDo onBack={goToCalendar} />
                </motion.div>
              )}

              {view === "insights" && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={SPRING_SOFT}
                  className="w-full"
                >
                  <InsightsPanel onBack={goToCalendar} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Theme switcher — always visible */}
            <ThemeSwitcher />
          </main>
        </AuthGate>
      </ThemeProvider>
    </AuthProvider>
  );
}
