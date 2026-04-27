"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

/* ── VIP List — the only two emails allowed ── */
const ALLOWED_EMAILS = [
  "ryan.shahid2.8@gmail.com",
  "samihashahin23@gmail.com",
];

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase client-side automatically picks up the hash fragment
      // from the OAuth redirect and exchanges it for a session.
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !data.session) {
        setError("Authentication failed. No session found.");
        setChecking(false);
        return;
      }

      const email = data.session.user.email?.toLowerCase() ?? "";

      /* ── The Bouncer Logic ──────────────── */
      if (ALLOWED_EMAILS.includes(email)) {
        // ✅ VIP — push to dashboard
        router.replace("/");
      } else {
        // ❌ Unauthorized — sign out immediately
        await supabase.auth.signOut();
        setError("Unauthorized. You do not belong here.");
        setChecking(false);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <main className="relative min-h-screen flex items-center justify-center">
      {/* ── Background ───────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/club-door.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <div className="noise-overlay" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING_SOFT}
        className="relative z-10 bg-white/5 border border-white/10 p-8 rounded-2xl w-full max-w-sm flex flex-col items-center gap-6"
        style={{
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        }}
      >
        {checking && !error ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-white/10 border-t-pink-500 rounded-full"
            />
            <p className="text-white/40 text-xs font-mono tracking-[0.2em] uppercase">
              Verifying identity…
            </p>
          </>
        ) : (
          <>
            {/* ── Unauthorized Error ─────────── */}
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <span className="text-red-500 text-xl font-black">✕</span>
            </div>
            <p className="text-red-500 text-sm font-mono font-bold tracking-wide text-center">
              {error}
            </p>
            <button
              onClick={() => router.replace("/login")}
              className="text-white/30 text-xs font-mono tracking-wider uppercase hover:text-white/60 transition-colors"
            >
              ← Back to login
            </button>
          </>
        )}
      </motion.div>
    </main>
  );
}
