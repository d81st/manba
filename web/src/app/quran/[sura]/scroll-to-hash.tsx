"use client";

import { useEffect } from "react";

// Ayahs stream in after the browser has looked for the #anchor, so scroll
// to it once the list is on the page.
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  return null;
}
