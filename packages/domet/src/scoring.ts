import type {
  InternalSectionBounds,
  SectionScore,
  ResolvedSection,
} from "./types";

export type ScoringContext = {
  scrollY: number;
  viewportHeight: number;
  scrollHeight: number;
  effectiveOffset: number;
  visibilityThreshold: number;
  scrollDirection: "up" | "down" | null;
  sectionIndexMap: Map<string, number>;
};

export function getSectionBounds(
  sections: ResolvedSection[],
  container: HTMLElement | null,
): InternalSectionBounds[] {
  const scrollTop = container ? container.scrollTop : window.scrollY;
  const containerTop = container ? container.getBoundingClientRect().top : 0;

  return sections
    .map(({ id, element }) => {
      const rect = element.getBoundingClientRect();
      const relativeTop = container
        ? rect.top - containerTop + scrollTop
        : rect.top + window.scrollY;
      return {
        id,
        top: relativeTop,
        bottom: relativeTop + rect.height,
        height: rect.height,
      };
    })
    .filter((bounds): bounds is InternalSectionBounds => bounds !== null);
}

export function calculateSectionScores(
  sectionBounds: InternalSectionBounds[],
  sections: ResolvedSection[],
  ctx: ScoringContext,
): SectionScore[] {
  const {
    scrollY,
    viewportHeight,
    effectiveOffset,
    visibilityThreshold,
    scrollDirection,
    sectionIndexMap,
  } = ctx;

  const triggerLine = scrollY + effectiveOffset;
  const viewportTop = scrollY;
  const viewportBottom = scrollY + viewportHeight;

  const elementMap = new Map(sections.map((s) => [s.id, s.element]));

  return sectionBounds.map((section) => {
    const visibleTop = Math.max(section.top, viewportTop);
    const visibleBottom = Math.min(section.bottom, viewportBottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibilityRatio =
      section.height > 0 ? visibleHeight / section.height : 0;
    const visibleInViewportRatio =
      viewportHeight > 0 ? visibleHeight / viewportHeight : 0;
    const isInView =
      section.bottom > viewportTop && section.top < viewportBottom;

    const sectionProgress = (() => {
      if (section.height === 0) return 0;
      const entryPoint = viewportBottom;
      const totalTravel = viewportHeight + section.height;
      const traveled = entryPoint - section.top;
      return Math.max(0, Math.min(1, traveled / totalTravel));
    })();

    let score = 0;

    if (visibilityRatio >= visibilityThreshold) {
      score += 1000 + visibilityRatio * 500;
    } else if (isInView) {
      score += visibleInViewportRatio * 800;
    }

    const sectionIndex = sectionIndexMap.get(section.id) ?? 0;
    if (
      scrollDirection &&
      isInView &&
      section.top <= triggerLine &&
      section.bottom > triggerLine
    ) {
      score += 200;
    }

    score -= sectionIndex * 0.1;

    const element = elementMap.get(section.id);
    const rect = element ? element.getBoundingClientRect() : null;

    return {
      id: section.id,
      score,
      visibilityRatio,
      inView: isInView,
      bounds: section,
      progress: sectionProgress,
      rect,
    };
  });
}

export function determineActiveSection(
  scores: SectionScore[],
  sectionIds: string[],
  currentActiveId: string | null,
  hysteresisMargin: number,
  scrollY: number,
  viewportHeight: number,
  scrollHeight: number,
): string | null {
  if (scores.length === 0 || sectionIds.length === 0) return null;

  const maxScroll = Math.max(0, scrollHeight - viewportHeight);
  const hasScroll = maxScroll > 10;
  const isAtBottom = hasScroll && scrollY + viewportHeight >= scrollHeight - 5;
  const isAtTop = hasScroll && scrollY <= 5;

  if (isAtBottom) {
    return sectionIds[sectionIds.length - 1];
  }

  if (isAtTop) {
    return sectionIds[0];
  }

  const visibleScores = scores.filter((s) => s.inView);
  const candidates = visibleScores.length > 0 ? visibleScores : scores;
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  if (sorted.length === 0) return null;

  const bestCandidate = sorted[0];
  const currentScore = scores.find((s) => s.id === currentActiveId);

  const shouldSwitch =
    !currentScore ||
    !currentScore.inView ||
    bestCandidate.score > currentScore.score + hysteresisMargin ||
    bestCandidate.id === currentActiveId;

  return shouldSwitch ? bestCandidate.id : currentActiveId;
}
