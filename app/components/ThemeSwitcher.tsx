"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Palette, X, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/lib/hooks/useTheme";

const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

const THEMES: { id: Theme; name: string; emoji: string; description: string; icon: typeof Moon; colors: string[] }[] = [
  {
    id: "fight",
    name: "Fight Mode",
    emoji: "🥊",
    description: "Dark, intense, pink accents",
    icon: Moon,
    colors: ["#ec4899", "#be185d", "#050505"],
  },
  {
    id: "zen",
    name: "Zen Mode",
    emoji: "🧘",
    description: "Soft, calm, sage & cream",
    icon: Sun,
    colors: ["#7c9a92", "#b8c5a0", "#faf8f5"],
  },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...SPRING_SOFT, delay: 0.2 }}
        onClick={() => setIsOpen(true)}
        className="absolute sm:fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center
                   bg-white/10 border border-white/20 text-white/70 hover:text-white hover:border-white/40
                   hover:bg-white/20 backdrop-blur-xl transition-all duration-300 shadow-lg
                   theme-zen:bg-black/10 theme-zen:border-black/20 theme-zen:text-black/70 theme-zen:hover:text-black"
      >
        <span className="text-xl">💀</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={SPRING_SOFT}
              className="relative z-10 w-full max-w-sm glass p-6 space-y-5 rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-white/80 font-bold text-sm font-mono tracking-wider uppercase">
                  Choose your vibe
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/20 hover:text-white/60 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Theme cards */}
              <div className="space-y-3">
                {THEMES.map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setTheme(t.id);
                        setTimeout(() => setIsOpen(false), 300);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ${
                        isActive
                          ? "bg-[#E23D68]/10 border-2 border-[#E23D68]/30 shadow-[0_0_20px_rgba(226,61,104,0.15)]"
                          : "bg-white/3 border-2 border-white/5 hover:border-white/10 hover:bg-white/5"
                      }`}
                    >
                      {/* Color preview */}
                      <div className="flex items-center gap-1">
                        {t.colors.map((c, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/10"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{t.emoji}</span>
                          <span className="text-white/80 text-sm font-mono font-bold">
                            {t.name}
                          </span>
                        </div>
                        <p className="text-white/30 text-xs font-mono mt-0.5">
                          {t.description}
                        </p>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 rounded-full bg-[#E23D68] shadow-[0_0_8px_rgba(226,61,104,0.5)]"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-center text-white/10 text-[10px] font-mono tracking-wider">
                your vibe attracts your tribe
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
