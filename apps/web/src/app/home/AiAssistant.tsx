"use client" /* Floating launcher */

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, X, ArrowUpRight } from "lucide-react"

const SUGGESTIONS = [
  "What should I see in Gondar?",
  "What's near my hotel?",
  "Plan a day in Addis Ababa",
  "Show me heritage places near me",
]

export default function AiAssistant() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open YayeTech AI"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 w-14 h-14 rounded-2xl bg-[#0b1528] text-[#E7C868] shadow-2xl flex items-center justify-center hover:bg-[#12233a] hover:scale-105 transition-all"
      >
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-[#0b1528] text-white">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#E7C868]/15 border border-[#E7C868]/40 flex items-center justify-center text-[#E7C868]">
                  <Bot className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">YayeTech AI</p>
                  <p className="text-[10px] text-white/60">
                    Verified travel data only
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="font-serif text-lg font-bold text-[#0b1528]">
                &ldquo;Where would you like to explore?&rdquo;
              </p>
              <div className="mt-4 space-y-2">
                {SUGGESTIONS.map((s) => (
                  <Link
                    key={s}
                    href="/discover"
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:border-[#E7C868] hover:bg-[#FEF9E7] transition-colors"
                  >
                    {s}
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#B8963E] shrink-0" />
                  </Link>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                YayeTech AI answers only from verified YayeTech data — it never
                invents historical information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
