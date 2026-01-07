import type { ScrollContainer, ResolvedSection, Offset } from "./types";

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

  const elements = document.querySelectorAll<HTMLElement>(selector);
  return Array.from(elements).map((el, index) => ({
    id: el.id || el.dataset.domet || `section-${index}`,
    element: el,
  }));
}

export function resolveOffset(
  offset: Offset | undefined,
  viewportHeight: number,
  defaultOffset: Offset,
): number {
  const value = offset ?? defaultOffset;

  if (typeof value === "number") {
    return value;
  }

  const match = value.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (match) {
    const percent = parseFloat(match[1]);
    return (percent / 100) * viewportHeight;
  }

  return 0;
}
