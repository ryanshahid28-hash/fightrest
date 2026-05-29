"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, UserPlus, Loader2, Check } from "lucide-react";
import Link from "next/link";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ── Password strength indicator ─────────── */
  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0–5
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ["", "weak", "fair", "good", "strong", "elite"];
  const strengthColors = [
    "bg-white/10",
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-[#E23D68]",
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    
    if (isPlaceholder) {
      // Simulate successful login for local development
      router.push("/dashboard");
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
    });

    if (err) {
      const msg = err.message;
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setError("This email is already registered. Try signing in instead.");
      } else if (msg.includes("valid email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(msg);
      }
      setSubmitting(false);
      return;
    }

    // Supabase can auto-confirm or require email confirmation depending on project settings.
    // If the user is auto-confirmed (session exists), redirect immediately.
    if (data.session) {
      router.push("/dashboard");
    } else {
      // Email confirmation required
      setSuccess("Check your email for a confirmation link, then sign in.");
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
              join the club
            </span>
            <span className="fc-rule" />
          </div>
        </div>

        {/* Form card */}
        <div className="glass p-8 space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2"
              >
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="glass-input w-full px-4 py-3 text-sm text-white placeholder-white/20 font-mono outline-none"
                placeholder="fighter@club.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="glass-input w-full px-4 py-3 pr-12 text-sm text-white placeholder-white/20 font-mono outline-none"
                  placeholder="min 6 characters"
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

              {/* Strength meter */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 space-y-1"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength >= i ? strengthColors[strength] : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-white/30 tracking-wider uppercase">
                    {strengthLabels[strength]}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="glass-input w-full px-4 py-3 pr-12 text-sm text-white placeholder-white/20 font-mono outline-none"
                  placeholder="••••••••"
                />
                {confirmPassword.length > 0 && confirmPassword === password && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                    <Check size={16} />
                  </span>
                )}
              </div>
            </div>

            {/* Error / Success */}
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
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-green-400 text-sm mt-0.5">✓</span>
                    <p className="text-green-400 text-xs font-mono leading-relaxed">
                      {success}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              id="register-submit"
              className="fc-add-btn w-full px-5 py-3 rounded-xl text-white font-medium text-sm uppercase tracking-wider
                         disabled:opacity-50 disabled:cursor-not-allowed transition-opacity
                         flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Join <UserPlus size={14} />
                </>
              )}
            </button>
          </form>

          {/* Switch to login */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-white/30 hover:text-white/70 text-xs font-mono tracking-wide transition-colors"
            >
              ← Already a member? Sign in
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
