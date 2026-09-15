"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-20 sm:pt-28 pb-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-6">
          Writing, structured
        </p>
        <h1 className="font-serif text-[2.4rem] sm:text-5xl md:text-[3.6rem] tracking-tight max-w-3xl mx-auto leading-[1.08]">
          Stories worth keeping. Knowledge teams can actually use.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          EVERYA is a publishing platform for long-form writing and technical documentation —
          the clarity of a magazine, the structure of a knowledge base.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background hover:opacity-90"
          >
            Start writing
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-7 text-sm font-medium hover:bg-muted"
          >
            Read stories
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
