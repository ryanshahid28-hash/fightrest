"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    
    if (isPlaceholder) {
      // Simulate successful login for local development
      localStorage.setItem("fc-mock-session", "true");
      router.push("/dashboard");
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      // Map common Supabase errors to friendlier messages
      const msg = err.message;
      if (msg.includes("Invalid login credentials")) {
        setError("You must join Fight Club first.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please confirm your email before signing in.");
      } else {
        setError(msg);
      }
      setSubmitting(false);
      return;
    }

    // Redirect to dashboard on success
    router.push("/dashboard");
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
          <h1 className="fc-title italic text-5xl tracking-tight mb-2">FIGHT CLUB</h1>
          <div className="fc-subtitle">
            <span className="text-white/60 text-sm tracking-[0.2em] uppercase font-mono">
              ENTER THE RING
            </span>
          </div>
        </div>

        {/* Form card */}
        <div className="glass p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-white/50 text-xs font-mono tracking-widest uppercase mb-2"
              >
                EMAIL
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 text-sm text-white bg-[#1A1A1A] border border-white/10 rounded-xl placeholder-white/20 font-mono outline-none focus:border-[#E23D68] transition-colors"
                placeholder="fighter@club.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-white/50 text-xs font-mono tracking-widest uppercase mb-2"
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 text-sm text-white bg-[#1A1A1A] border border-white/10 rounded-xl placeholder-white/20 font-mono outline-none focus:border-[#E23D68] transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-red-400 text-sm mt-0.5">⚠</span>
                    <p className="text-red-400 text-xs font-mono leading-relaxed">
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              id="login-submit"
              className="w-full px-5 py-4 rounded-xl text-white font-bold text-lg uppercase tracking-wider
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]
                         flex items-center justify-center gap-2 mt-6"
              style={{ 
                backgroundColor: '#E23D68', 
                boxShadow: '0 0 20px #E23D68, 0 0 40px rgba(226, 61, 104, 0.4)',
              }}
            >
              {submitting ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  ENTER -&gt;
                </>
              )}
            </button>
          </form>

          {/* Switch to register */}
          <div className="text-center">
            <Link
              href="/register"
              className="text-white/30 hover:text-white/70 text-xs font-mono tracking-wide transition-colors"
            >
              New here? Create an account →
            </Link>
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
