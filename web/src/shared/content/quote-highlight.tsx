"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { findQuote, HIGHLIGHT_PARAM } from "./quote-match";

const NAME = "quote";
const WAIT_MS = 6000; // the fragment may still be streaming in

// Marks the words given in "?hl=" on the page a topic's quotation links to,
// and scrolls to them. The CSS Custom Highlight API paints the range without
// changing the page's text; where a browser lacks it, the link still opens
// the fragment at its anchor.
export function QuoteHighlight() {
  const pathname = usePathname();
  useEffect(() => {
    const quote = new URLSearchParams(window.location.search).get(HIGHLIGHT_PARAM);
    if (!quote || typeof CSS === "undefined" || !("highlights" in CSS)) return;
    let done = false;
    const attempt = () => {
      if (done) return;
      const range = locate(quote);
      if (!range) return;
      done = true;
      CSS.highlights.set(NAME, new Highlight(range));
      const box = range.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + box.top - window.innerHeight / 3, behavior: "smooth" });
    };
    attempt();
    const observer = new MutationObserver(attempt);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setTimeout(() => observer.disconnect(), WAIT_MS);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      CSS.highlights.delete(NAME);
    };
  }, [pathname]);
  return null;
}

// The words inside the fragment the anchor names, else anywhere in the main column.
function locate(quote: string): Range | null {
  const anchor = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
  const main = document.querySelector("main");
  for (const scope of [anchor, main]) {
    if (!scope) continue;
    const range = rangeIn(scope, quote);
    if (range) return range;
  }
  return null;
}

function rangeIn(scope: Element, quote: string): Range | null {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  const span = findQuote(nodes.map((n) => n.data), quote);
  if (!span) return null;
  const range = document.createRange();
  range.setStart(nodes[span.start.piece], span.start.offset);
  range.setEnd(nodes[span.end.piece], span.end.offset);
  return range;
}
