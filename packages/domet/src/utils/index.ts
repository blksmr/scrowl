import {
  useEffect,
  useLayoutEffect,
} from "react";

import type { ScrollState, SectionState } from "../types";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function areIdInputsEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

export function areScrollStatesEqual(a: ScrollState, b: ScrollState): boolean {
  return (
    a.y === b.y &&
    a.progress === b.progress &&
    a.direction === b.direction &&
    a.velocity === b.velocity &&
    a.scrolling === b.scrolling &&
    a.maxScroll === b.maxScroll &&
    a.viewportHeight === b.viewportHeight &&
    a.trackingOffset === b.trackingOffset &&
    a.triggerLine === b.triggerLine
  );
}

export function areSectionsEqual(
  a: Record<string, SectionState>,
  b: Record<string, SectionState>,
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const sA = a[key];
    const sB = b[key];
    if (!sB) return false;
    if (
      sA.visibility !== sB.visibility ||
      sA.progress !== sB.progress ||
      sA.inView !== sB.inView ||
      sA.active !== sB.active ||
      sA.bounds.top !== sB.bounds.top ||
      sA.bounds.bottom !== sB.bounds.bottom ||
      sA.bounds.height !== sB.bounds.height
    ) {
      return false;
    }
  }
  return true;
}

export * from "./validation";
export * from "./resolvers";
export * from "./scoring";
