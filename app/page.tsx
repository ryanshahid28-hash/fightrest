"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

/**
 * Root page — redirects to /dashboard if authenticated, /login otherwise.
 * This preserves backward compatibility: users who visit "/" are routed correctly.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const isPlaceholder =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

      // If using placeholder Supabase, check local storage for our mock session
      if (isPlaceholder) {
        const mockSession = localStorage.getItem("fc-mock-session");
        if (mockSession === "true") {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  // Show a loading spinner while we determine where to redirect
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
