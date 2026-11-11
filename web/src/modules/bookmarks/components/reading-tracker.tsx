"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { currentPlace, type Place, readingSection, type ReadingSection } from "../bookmark.place";

// "Continue reading" lives in this browser only (localStorage): what a person
// reads is not sent to the server. One last place per section of the library.
const KEY = "manba:reading";

export type ReadingPlaces = Partial<Record<ReadingSection, Place & { at: number }>>;

export function readPlaces(raw: string | null): ReadingPlaces {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as ReadingPlaces) : {};
  } catch {
    return {};
  }
}

export const readingStore = {
  raw(): string | null {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null; // private mode, storage turned off
    }
  },
  write(places: ReadingPlaces | null) {
    try {
      if (places && Object.keys(places).length > 0) window.localStorage.setItem(KEY, JSON.stringify(places));
      else window.localStorage.removeItem(KEY);
      // The same tab does not get a "storage" event of its own.
      window.dispatchEvent(new Event("manba:reading"));
    } catch {}
  },
  subscribe(listener: () => void) {
    window.addEventListener("storage", listener);
    window.addEventListener("manba:reading", listener);
    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener("manba:reading", listener);
    };
  },
};

// Remembers the place on the pages that are read from top to bottom: when the
// page opens and, a moment after the reader stops scrolling, the row on screen.
// The login page clears it, so signing out leaves nothing behind.
export function ReadingTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === "/login") return readingStore.write(null);
    const section = readingSection(pathname);
    if (!section) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      const place = currentPlace();
      // The text streams in after the page: wait until its heading is there.
      if (!document.querySelector("main h1")) return;
      readingStore.write({ ...readPlaces(readingStore.raw()), [section]: { ...place, at: Date.now() } });
    };
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(save, 1200);
    };
    later();
    window.addEventListener("scroll", later, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", later);
    };
  }, [pathname]);
  return null;
}
