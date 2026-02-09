"use client";

import { useEffect } from "react";
import { trackPhoneClick, trackEmailClick } from "@/lib/analytics";

export function LinkTracker() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      if (href.startsWith("tel:")) {
        trackPhoneClick();
      } else if (href.startsWith("mailto:")) {
        trackEmailClick();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
