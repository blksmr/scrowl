import type {
  InternalSectionBounds,
  SectionScore,
  ResolvedSection,
} from "../types";
import { MIN_SCROLL_THRESHOLD, EDGE_TOLERANCE } from "../constants";

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

  return sections.map(({ id, element }) => {
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
  });
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
    scrollDirection: _scrollDirection,
    sectionIndexMap: _sectionIndexMap,
  } = ctx;

  const viewportTop = scrollY;
  const viewportBottom = scrollY + viewportHeight;

  const maxScroll = Math.max(1, ctx.scrollHeight - viewportHeight);
  const scrollProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
  const dynamicOffset = effectiveOffset + scrollProgress * (viewportHeight - effectiveOffset);
  const triggerLine = scrollY + dynamicOffset;

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

    if (isInView) {
      const containsTriggerLine =
        triggerLine >= section.top && triggerLine < section.bottom;

      if (containsTriggerLine) {
        score += 300;
      }

      const sectionCenter = section.top + section.height / 2;
      const distanceFromTrigger = Math.abs(sectionCenter - triggerLine);
      const maxDistance = viewportHeight;
      const proximityScore =
        Math.max(0, 1 - distanceFromTrigger / maxDistance) * 500;
      score += proximityScore;
    }

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

  const scoredIds = new Set(scores.map((s) => s.id));

  const maxScroll = Math.max(0, scrollHeight - viewportHeight);
  const hasScroll = maxScroll > MIN_SCROLL_THRESHOLD;
  const isAtBottom = hasScroll && scrollY + viewportHeight >= scrollHeight - EDGE_TOLERANCE;
  const isAtTop = hasScroll && scrollY <= EDGE_TOLERANCE;

  if (isAtBottom && sectionIds.length >= 2) {
    const lastId = sectionIds[sectionIds.length - 1];
    const secondLastId = sectionIds[sectionIds.length - 2];
    const secondLastScore = scores.find((s) => s.id === secondLastId);
    const secondLastNotVisible = !secondLastScore || !secondLastScore.inView;
    if (scoredIds.has(lastId) && secondLastNotVisible) {
      return lastId;
    }
  }

  if (isAtTop && sectionIds.length >= 2) {
    const firstId = sectionIds[0];
    const secondId = sectionIds[1];
    const secondScore = scores.find((s) => s.id === secondId);
    const secondNotVisible = !secondScore || !secondScore.inView;
    if (scoredIds.has(firstId) && secondNotVisible) {
      return firstId;
    }
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
