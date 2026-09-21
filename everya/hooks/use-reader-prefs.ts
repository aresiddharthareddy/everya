"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FontSize = "sm" | "base" | "lg" | "xl";
export type ContentWidth = "narrow" | "default" | "wide";

interface ReaderPrefs {
  fontSize: FontSize;
  contentWidth: ContentWidth;
  focusMode: boolean;
  setFontSize: (size: FontSize) => void;
  setContentWidth: (width: ContentWidth) => void;
  toggleFocusMode: () => void;
}

export const useReaderPrefs = create<ReaderPrefs>()(
  persist(
    (set) => ({
      fontSize: "base",
      contentWidth: "default",
      focusMode: false,
      setFontSize: (fontSize) => set({ fontSize }),
      setContentWidth: (contentWidth) => set({ contentWidth }),
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
    }),
    { name: "everya-reader" }
  )
);

export const fontSizeClass: Record<FontSize, string> = {
  sm: "text-[1rem] leading-[1.75]",
  base: "text-[1.125rem] leading-[1.8]",
  lg: "text-[1.25rem] leading-[1.85]",
  xl: "text-[1.375rem] leading-[1.9]",
};

export const widthClass: Record<ContentWidth, string> = {
  narrow: "max-w-xl",
  default: "max-w-2xl",
  wide: "max-w-3xl",
};
