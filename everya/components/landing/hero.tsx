"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--muted)_0%,_transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl px-6 pt-20 sm:pt-28 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-6">
            Technical publishing, reimagined
          </p>
          <h1 className="font-serif text-[2.5rem] sm:text-5xl md:text-[3.5rem] tracking-tight max-w-3xl mx-auto leading-[1.06]">
            Where engineers come to read, write, and measure what matters.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Long-form stories with live stats — views, claps, ratings, and responses on every piece. Cleaner than Medium. Built for technical teams.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-8 text-sm font-medium text-background hover:opacity-90"
            >
              Start reading
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-8 text-sm font-medium hover:bg-muted transition-colors"
            >
              Become a writer
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
