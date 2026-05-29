"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AuthProvider, useUser } from "@/lib/auth";
import { ThemeProvider } from "@/lib/hooks/useTheme";
import TaskTracker from "../components/TaskTracker";
import Calendar from "../components/Calendar";
import HappyReset from "../components/HappyReset";
import AntiToDo from "../components/AntiToDo";
import InsightsPanel from "../components/InsightsPanel";
import ThemeSwitcher from "../components/ThemeSwitcher";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

type View = "calendar" | "tracker" | "happy" | "anti" | "insights";

/* ── Inner dashboard (needs AuthProvider above it) ── */
function DashboardContent() {
  const { user, loading, signOut } = useUser();
  const router = useRouter();
  const [view, setView] = useState<View>("calendar");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const goToCalendar = () => setView("calendar");
  const goToTracker = (dateKey: string) => {
    setSelectedDate(dateKey);
    setView("tracker");
  };
  const goToHappy = () => setView("happy");
  const goToAnti = () => setView("anti");
  const goToInsights = () => setView("insights");

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#E23D68] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) return null;

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start">
      {/* Animated mesh background */}
      {view !== "happy" && view !== "anti" && (
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

      {/* Sign-out pill */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING_SOFT}
        onClick={signOut}
        title="Sign Out"
        id="sign-out-btn"
        className="absolute sm:fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center text-xl
                   bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30
                   hover:bg-white/10 backdrop-blur-xl transition-all duration-300 shadow-lg"
      >
        ➜]
      </motion.button>
    </main>
  );
}

/* ── Page wrapper ────────────────────────── */
export default function DashboardPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DashboardContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
