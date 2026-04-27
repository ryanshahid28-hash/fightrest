"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

/* ── Google "G" SVG — no external deps ────── */
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ── Background Image ─────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/club-door.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      />
      {/* ── Dark Overlay + Blur ──────────────── */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* ── Noise texture ────────────────────── */}
      <div className="noise-overlay" />

      {/* ── Login Card ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING_SOFT}
        className="relative z-10 bg-white/5 border border-white/10 p-8 sm:p-10 rounded-2xl w-full max-w-sm flex flex-col items-center gap-8"
        style={{
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        }}
      >
        {/* ── Title ──────────────────────────── */}
        <div className="text-center space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SOFT, delay: 0.1 }}
            className="text-white text-2xl sm:text-3xl font-black tracking-[0.2em] uppercase"
            style={{
              textShadow: "0 0 60px rgba(236, 72, 153, 0.3), 0 2px 4px rgba(0,0,0,0.9)",
            }}
          >
            Restricted Access
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center justify-center gap-3"
          >
            <span className="inline-block w-10 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
            <span className="text-white/30 text-[10px] tracking-[0.3em] uppercase font-mono">
              members only
            </span>
            <span className="inline-block w-10 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
          </motion.div>
        </div>

        {/* ── Google Auth Button ─────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SOFT, delay: 0.2 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          className="group relative w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-black font-bold text-sm tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
            />
          ) : (
            <>
              <GoogleLogo />
              <span>Authenticate</span>
            </>
          )}
        </motion.button>

        {/* ── Error Message ──────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={SPRING_SOFT}
              className="text-red-500 text-xs font-mono text-center tracking-wide"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Footer rule ────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/10 text-[9px] font-mono tracking-[0.2em] uppercase"
        >
          first rule: you do not talk about fight club
        </motion.p>
      </motion.div>
    </main>
  );
}
