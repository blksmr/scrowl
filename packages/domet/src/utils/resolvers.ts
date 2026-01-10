import type { ScrollContainer, ResolvedSection, Offset } from "../types";

const PERCENT_REGEX = /^(-?\d+(?:\.\d+)?)%$/;

export function resolveContainer(input: ScrollContainer | undefined): HTMLElement | null {
  if (typeof window === "undefined") return null;
  if (input === undefined) return null;
  return input.current;
}

export function resolveSectionsFromIds(
  ids: string[],
  refs: Record<string, HTMLElement | null>,
): ResolvedSection[] {
  return ids
    .map((id) => ({ id, element: refs[id] }))
    .filter((s): s is ResolvedSection => s.element != null);
}

export function resolveSectionsFromSelector(
  selector: string,
): ResolvedSection[] {
  if (typeof window === "undefined") return [];

  try {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    return Array.from(elements).map((el, index) => ({
      id: el.id || el.dataset.domet || `section-${index}`,
      element: el,
    }));
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[domet] Invalid CSS selector: "${selector}"`);
    }
    return [];
  }
}

export function resolveOffset(
  offset: Offset | undefined,
  viewportHeight: number,
  defaultOffset: Offset,
): number {
  const value = offset ?? defaultOffset;
  const safeViewportHeight = Number.isFinite(viewportHeight) ? viewportHeight : 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const match = PERCENT_REGEX.exec(value);
  if (match) {
    const percent = parseFloat(match[1]);
    if (!Number.isFinite(percent)) return 0;
    return (percent / 100) * safeViewportHeight;
  }

  return 0;
}
