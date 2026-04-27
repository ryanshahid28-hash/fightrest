"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import TaskTracker from "./components/TaskTracker";
import Calendar from "./components/Calendar";
import HappyReset from "./components/HappyReset";
import AntiToDo from "./components/AntiToDo";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

/* ── VIP List (duplicated for guard) ──────── */
const ALLOWED_EMAILS = [
  "ryan.shahid2.8@gmail.com",
  "samihashahin23@gmail.com",
];

type View = "calendar" | "tracker" | "happy" | "anti";

export default function Home() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<View>("calendar");
  const [selectedDate, setSelectedDate] = useState<string>("");

  /* ── Session Guard ─────────────────────── */
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user.email?.toLowerCase() ?? "";

      if (!data.session || !ALLOWED_EMAILS.includes(email)) {
        router.replace("/login");
        return;
      }

      setAuthChecked(true);
    };

    checkSession();

    // Also listen for sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const goToCalendar = () => setView("calendar");

  const goToTracker = (dateKey: string) => {
    setSelectedDate(dateKey);
    setView("tracker");
  };

  const goToHappy = () => setView("happy");
  const goToAnti = () => setView("anti");

  /* ── Show nothing until auth is verified ── */
  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/10 border-t-pink-500 rounded-full"
        />
      </main>
    );
  }

  return (
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
            <Calendar onSelectDate={goToTracker} onOpenHappy={goToHappy} onOpenAnti={goToAnti} />
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
      </AnimatePresence>
    </main>
  );
}
