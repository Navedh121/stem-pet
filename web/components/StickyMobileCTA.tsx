"use client";

// Sticky bottom bar that slides up on mobile once the user has scrolled
// past the hero. Gives scroll-through visitors a persistent way to sign up
// without hunting for the hero CTA they already passed.
// Hidden on lg+ screens (desktop has the hero CTA always visible).

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      // Show after scrolling 80% of the first viewport height.
      setVisible(window.scrollY > window.innerHeight * 0.8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Safe area bottom padding for iPhone notch */}
          <div
            className="bg-ink/95 backdrop-blur-md border-t border-silk/10 px-4 py-3 flex items-center justify-between gap-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <p className="text-silk text-sm leading-tight">
              Track your child&apos;s progress — free
            </p>
            <Link
              href="/signup"
              className="flex-shrink-0 bg-spider-red hover:bg-spider-red/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Start free →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
