"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X } from "lucide-react";
import TabsDemo, { ClassroomContextData } from "@/components/ui/tabs-10";
import { cn } from "@/lib/utils";

export interface FloatingAITabsProps {
  className?: string;
  defaultOpen?: boolean;
  role?: "student" | "professor";
  userName?: string;
  userEmail?: string;
  activeClassroom?: ClassroomContextData | null;
  classrooms?: ClassroomContextData[];
}

export function FloatingAITabs({
  className,
  defaultOpen = false,
  role,
  userName,
  userEmail,
  activeClassroom,
  classrooms,
}: FloatingAITabsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="dark mb-3 w-[380px] max-w-[calc(100vw-2rem)] p-3 rounded-3xl bg-[#0f0f13]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.75)]"
          >
            <TabsDemo
              role={role}
              userName={userName}
              userEmail={userEmail}
              activeClassroom={activeClassroom}
              classrooms={classrooms}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] font-medium text-sm transition-all duration-300 border cursor-pointer select-none",
          isOpen
            ? "bg-[#18181e] border-white/15 text-white hover:bg-[#22222a]"
            : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-white/20 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40"
        )}
        aria-label="Toggle AI Assistant"
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="size-4 text-white" />
          ) : (
            <>
              <Sparkles className="size-4 text-white animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 animate-ping" />
            </>
          )}
        </div>
        <span className="font-semibold text-xs tracking-wide">
          {isOpen ? "Close" : "AI Assistant"}
        </span>
      </motion.button>
    </div>
  );
}

export default FloatingAITabs;
