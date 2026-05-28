"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/auth";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn, signUp, signOut } = useUser();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#E23D68] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (user) {
    return (
      <>
        {children}
        {/* Floating sign-out pill */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_SOFT}
          onClick={signOut}
          title="Sign Out"
          className="absolute sm:fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center text-xl
                     bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30
                     hover:bg-white/10 backdrop-blur-xl transition-all duration-300 shadow-lg"
        >
          ➜]
        </motion.button>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    if (mode === "signin") {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } else {
      const { error: err } = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        setSuccess("Check your email for a confirmation link.");
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background mesh */}
      <div className="bg-mesh">
        <div className="bg-mesh-extra" />
      </div>
      <div className="noise-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SOFT}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="fc-title">Fight Club</h1>
          <div className="fc-subtitle">
            <span className="fc-rule" />
            <span className="text-white/40 text-xs tracking-[0.25em] uppercase font-mono">
              {mode === "signin" ? "enter the ring" : "join the club"}
            </span>
            <span className="fc-rule" />
          </div>
        </div>

        {/* Form card */}
        <div className="glass p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input w-full px-4 py-3 text-sm text-white placeholder-white/20 font-mono"
                placeholder="fighter@club.com"
              />
            </div>

            <div>
              <label className="block text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="glass-input w-full px-4 py-3 text-sm text-white placeholder-white/20 font-mono"
                placeholder="••••••••"
              />
            </div>

            {/* Error / Success */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs font-mono"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-green-400 text-xs font-mono"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="fc-add-btn w-full px-5 py-3 rounded-xl text-white font-medium text-sm uppercase tracking-wider
                         disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting
                ? "..."
                : mode === "signin"
                ? "Enter"
                : "Join"}
            </button>
          </form>

          {/* Mode toggle */}
          <div className="text-center">
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setSuccess(null);
              }}
              className="text-white/30 hover:text-white/70 text-xs font-mono tracking-wide transition-colors"
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already a member? Sign in"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/10 text-[10px] font-mono tracking-wider mt-6">
          first rule: you do not talk about fight club
        </p>
      </motion.div>
    </div>
  );
}
