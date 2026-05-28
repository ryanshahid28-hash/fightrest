"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, RefreshCw, TrendingUp, Heart, Shield } from "lucide-react";
import { useUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

interface InsightsPanelProps {
  onBack: () => void;
}

interface InsightData {
  taskSummary: string;
  moodSummary: string;
  streakSummary: string;
  nudge: string;
  overallScore: number;
}

export default function InsightsPanel({ onBack }: InsightsPanelProps) {
  const { user } = useUser();
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const generateInsights = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch last 7 days of data
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const startDate = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, "0")}-${String(weekAgo.getDate()).padStart(2, "0")}`;
      const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      // Parallel fetch
      const [tasksRes, happyRes, fatRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("title, date, is_completed")
          .eq("user_id", user.id)
          .gte("date", startDate)
          .lte("date", endDate),
        supabase
          .from("happy_list")
          .select("content, is_checked")
          .eq("user_id", user.id),
        supabase
          .from("fat_list")
          .select("content, streak_start, last_broken")
          .eq("user_id", user.id),
      ]);

      const tasks = tasksRes.data || [];
      const happyItems = happyRes.data || [];
      const fatItems = fatRes.data || [];

      // Analyze data locally (rule-based insights)
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: Record<string, unknown>) => t.is_completed).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Group tasks by day
      const tasksByDay: Record<string, { total: number; done: number }> = {};
      for (const t of tasks) {
        const d = t.date as string;
        if (!tasksByDay[d]) tasksByDay[d] = { total: 0, done: 0 };
        tasksByDay[d].total++;
        if (t.is_completed) tasksByDay[d].done++;
      }

      const activeDays = Object.keys(tasksByDay).length;
      const bestDay = Object.entries(tasksByDay)
        .sort(([, a], [, b]) => (b.done / b.total) - (a.done / a.total))[0];

      // Streak analysis
      const streaks = fatItems.map((f: Record<string, unknown>) => {
        const start = new Date(f.streak_start as string);
        const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return { content: f.content as string, days: Math.max(0, diff), broken: f.last_broken as string | null };
      });

      const longestStreak = streaks.length > 0
        ? streaks.reduce((a, b) => a.days > b.days ? a : b)
        : null;

      // Build insights
      let taskSummary: string;
      if (totalTasks === 0) {
        taskSummary = "No tasks logged this week. Start adding tasks to see your progress!";
      } else if (completionRate >= 80) {
        taskSummary = `🔥 You completed ${completedTasks}/${totalTasks} tasks (${completionRate}%) — absolutely crushing it!`;
      } else if (completionRate >= 50) {
        taskSummary = `💪 You completed ${completedTasks}/${totalTasks} tasks (${completionRate}%). Solid progress, keep pushing.`;
      } else {
        taskSummary = `🌱 You completed ${completedTasks}/${totalTasks} tasks (${completionRate}%). Consider setting fewer, more focused tasks.`;
      }

      if (bestDay) {
        const dayName = new Date(bestDay[0]).toLocaleDateString("en", { weekday: "long" });
        taskSummary += ` Your strongest day was ${dayName}.`;
      }

      const moodSummary = happyItems.length > 0
        ? `You have ${happyItems.length} happy triggers logged. ${
            happyItems.filter((h: Record<string, unknown>) => h.is_checked).length > 0
              ? "Some have been checked off — schedule more of what makes you feel alive!"
              : "Try checking the ones you've experienced recently."
          }`
        : "Your Happy Reset list is empty. Add things that make you feel alive!";

      const streakSummary = longestStreak
        ? `Your longest active streak is "${longestStreak.content}" at ${longestStreak.days} day${longestStreak.days !== 1 ? "s" : ""}. ${
            longestStreak.days >= 14
              ? "That's legendary discipline! 🧼"
              : longestStreak.days >= 7
              ? "A full week clean — impressive! Keep going."
              : "Building momentum. Every day counts."
          }`
        : fatItems.length > 0
          ? "Your Anti-ToDo streaks are just getting started. Stay disciplined!"
          : "Add habits to avoid in the Ignore list to start tracking streaks.";

      // Generate nudge
      const nudges = [];
      if (completionRate < 50 && totalTasks > 5) nudges.push("Try the 3-task rule: pick only your 3 most important tasks for tomorrow.");
      if (activeDays < 4) nudges.push(`You were active ${activeDays}/7 days. Consistency beats intensity — try showing up daily, even with 1 task.`);
      if (happyItems.length === 0) nudges.push("Fill your Happy Reset list! Knowing what recharges you is half the battle.");
      if (fatItems.length === 0) nudges.push("Identify 2-3 habits draining your time and add them to the Ignore list.");
      if (streaks.some(s => s.days === 0 && s.broken)) nudges.push("A streak was broken recently. Don't let it spiral — restart strong tomorrow.");
      if (nudges.length === 0) nudges.push("You're doing great. Keep showing up and fighting for what matters.");

      const overallScore = Math.min(100, Math.round(
        (completionRate * 0.4) +
        (Math.min(activeDays / 7, 1) * 30) +
        (Math.min(happyItems.length / 5, 1) * 15) +
        (Math.min((longestStreak?.days ?? 0) / 14, 1) * 15)
      ));

      setInsights({
        taskSummary,
        moodSummary,
        streakSummary,
        nudge: nudges[0],
        overallScore,
      });
      setHasLoaded(true);
    } catch (err) {
      setError("Failed to generate insights. Try again later.");
      console.error("Insights error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start relative z-10 px-4">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={SPRING_SOFT}
        onClick={onBack}
        className="absolute top-4 left-4 p-2 rounded-xl text-white/30 hover:text-white/80 hover:bg-white/5 transition-colors z-20"
      >
        <ArrowLeft size={20} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SOFT}
        className="w-full max-w-lg mx-auto mt-20"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="fc-title text-3xl">Weekly Insights</h1>
          <div className="fc-subtitle">
            <span className="fc-rule" />
            <span className="text-white/40 text-xs tracking-[0.25em] uppercase font-mono">
              know yourself
            </span>
            <span className="fc-rule" />
          </div>
        </div>

        {!hasLoaded && !isLoading ? (
          /* ── Generate button ── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-6"
          >
            <div className="glass p-8 space-y-4">
              <Sparkles size={32} className="mx-auto text-amber-400/60" />
              <p className="text-white/50 text-sm font-mono">
                Analyze your last 7 days of tasks, happy triggers, and habit streaks to get personalized insights.
              </p>
              <button
                onClick={generateInsights}
                className="fc-add-btn px-6 py-3 rounded-xl text-white font-medium text-sm uppercase tracking-wider"
              >
                <Sparkles size={16} className="inline mr-2" />
                Generate Insights
              </button>
            </div>
          </motion.div>
        ) : isLoading ? (
          /* ── Loading ── */
          <div className="glass p-8 space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-8 h-8 flex items-center justify-center"
            >
              <RefreshCw size={24} className="text-[#E23D68]" />
            </motion.div>
            <p className="text-center text-white/30 text-xs font-mono animate-pulse">
              Analyzing your week...
            </p>
          </div>
        ) : error ? (
          /* ── Error ── */
          <div className="glass p-8 text-center space-y-4">
            <p className="text-red-400 text-sm font-mono">{error}</p>
            <button
              onClick={generateInsights}
              className="text-white/30 hover:text-white/70 text-xs font-mono transition-colors"
            >
              Try again
            </button>
          </div>
        ) : insights ? (
          /* ── Insights display ── */
          <div className="space-y-4">
            {/* Overall score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...SPRING_SOFT, delay: 0.1 }}
              className="glass p-6 text-center"
            >
              <div className="text-4xl font-bold font-mono text-white mb-1">
                {insights.overallScore}
                <span className="text-lg text-white/30">/100</span>
              </div>
              <p className="text-white/30 text-xs font-mono tracking-wider uppercase">
                weekly fight score
              </p>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${insights.overallScore}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className={`h-full rounded-full ${
                    insights.overallScore >= 70
                      ? "bg-gradient-to-r from-green-500 to-emerald-400"
                      : insights.overallScore >= 40
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                      : "bg-gradient-to-r from-red-500 to-rose-400"
                  }`}
                />
              </div>
            </motion.div>

            {/* Task Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: 0.2 }}
              className="glass p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-[#E23D68]" />
                <span className="text-white/50 text-xs font-mono tracking-wider uppercase">
                  Tasks
                </span>
              </div>
              <p className="text-white/80 text-sm font-mono leading-relaxed">
                {insights.taskSummary}
              </p>
            </motion.div>

            {/* Mood Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: 0.3 }}
              className="glass p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Heart size={16} className="text-[#E23D68]" />
                <span className="text-white/50 text-xs font-mono tracking-wider uppercase">
                  Mood
                </span>
              </div>
              <p className="text-white/80 text-sm font-mono leading-relaxed">
                {insights.moodSummary}
              </p>
            </motion.div>

            {/* Streak Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: 0.4 }}
              className="glass p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-[#E23D68]" />
                <span className="text-white/50 text-xs font-mono tracking-wider uppercase">
                  Streaks
                </span>
              </div>
              <p className="text-white/80 text-sm font-mono leading-relaxed">
                {insights.streakSummary}
              </p>
            </motion.div>

            {/* Nudge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: 0.5 }}
              className="glass p-5 border-l-2 border-amber-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-amber-400/70 text-xs font-mono tracking-wider uppercase">
                  Nudge
                </span>
              </div>
              <p className="text-white/80 text-sm font-mono leading-relaxed italic">
                {insights.nudge}
              </p>
            </motion.div>

            {/* Refresh */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center pt-2"
            >
              <button
                onClick={generateInsights}
                className="text-white/20 hover:text-white/50 text-xs font-mono tracking-wider transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            </motion.div>
          </div>
        ) : null}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-white/10 text-[10px] font-mono tracking-wider mt-8"
        >
          self-awareness is the first punch
        </motion.p>
      </motion.div>
    </div>
  );
}
