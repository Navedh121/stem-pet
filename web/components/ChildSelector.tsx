"use client";

// Custom child selector dropdown for the dashboard topbar.
// Replaces the browser-native <select> which opens an off-brand system
// picker on Android (wheel modal) and iOS (bottom sheet).
//
// v1 limitation: selecting a different child doesn't reload the dashboard
// data (the page always shows the first child). The dropdown is still useful
// as a named label, and is ready to wire up routing when v2 adds multi-child.

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Child } from "@/lib/types";

interface Props {
  kids: Child[];
}

export default function ChildSelector({ kids }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Child | undefined>(kids[0]);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / tap.
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // If only one child exists, just show the name with no toggle.
  if (kids.length <= 1) {
    return (
      <span className="text-sm text-paper px-3 py-1.5 bg-surface border border-silk/15 rounded-lg select-none">
        {kids[0]?.name ?? "No child"}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select child"
        className="flex items-center gap-2 bg-surface border border-silk/15 rounded-lg px-3 py-1.5 text-sm text-paper cursor-pointer hover:border-silk/30 transition-colors focus:outline-none focus:border-web-blue"
      >
        {selected?.name}
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Children"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 bg-surface border border-silk/15 rounded-xl overflow-hidden z-50 min-w-[130px] shadow-xl"
          >
            {kids.map((k) => (
              <li key={k.id}>
                <button
                  role="option"
                  aria-selected={k.id === selected?.id}
                  onClick={() => { setSelected(k); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                    ${k.id === selected?.id
                      ? "text-paper bg-ink/40"
                      : "text-silk hover:text-paper hover:bg-ink/30"
                    }`}
                >
                  {k.name}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
