import { useEffect, useRef, useState, useCallback } from "react";

type ScrollSpyOptions = {
  // Offset to adjust the "active zone" (e.g., center of viewport)
  rootMargin?: string;
  // More thresholds = finer detection
  threshold?: number | number[];
  // Debounce delay in ms to prevent rapid state changes during fast scrolling
  debounceMs?: number;
};

export function useScrollSpy(
  sectionIds: string[],
  { rootMargin = "0px 0px -50% 0px", threshold = [0, 0.25, 0.5, 0.75, 1], debounceMs = 100 }: ScrollSpyOptions = {}
) {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] || null);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Callback to attach refs to sections
  const registerRef = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) {
      refs.current[id] = el;
    } else {
      delete refs.current[id];
    }
  }, []);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => refs.current[id])
      .filter((el): el is HTMLElement => !!el);

    if (!elements.length) return;

    let pendingActiveId: string | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        // Sort by visible ratio to find the most visible section
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visibleEntries.length) return;

        const best = visibleEntries[0];
        const newActiveId = best.target.getAttribute("data-scrollspy-id");

        if (newActiveId && newActiveId !== pendingActiveId) {
          pendingActiveId = newActiveId;
          
          // Clear existing debounce timer
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          // Debounce the state update to prevent rapid changes during fast scrolling
          debounceTimerRef.current = setTimeout(() => {
            setActiveId(newActiveId);
          }, debounceMs);
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sectionIds, rootMargin, threshold, debounceMs]);

  return { activeId, registerRef };
}
