import { useMemo } from "react";
import type { DebugInfo } from "scrowl";

type ProgressMap = Record<string, number>;

type IndicatorStyle = {
  width: string;
  opacity: number;
};

const MIN_WIDTH = 14;
const MAX_WIDTH = 24;
const MIN_OPACITY = 0.15;
const MAX_OPACITY = 1;

export function useNavProgress(sectionIds: string[], debugInfo: DebugInfo) {
  const sectionProgress = useMemo((): ProgressMap => {
    const progress: ProgressMap = {};
    sectionIds.forEach((id) => { progress[id] = 0; });

    if (!debugInfo.sections.length) {
      progress[sectionIds[0]] = 1;
      return progress;
    }

    const { scrollY, viewportHeight } = debugInfo;
    const sections = debugInfo.sections;
    const lastSection = sections[sections.length - 1];
    const scrollHeight = lastSection.bounds.bottom;
    const maxScroll = Math.max(1, scrollHeight - viewportHeight);

    const scrollProgress = Math.max(0, Math.min(1, scrollY / maxScroll));
    const sectionIndex = scrollProgress * (sections.length - 1);

    const lowerIndex = Math.floor(sectionIndex);
    const upperIndex = Math.min(sections.length - 1, Math.ceil(sectionIndex));
    const ratio = sectionIndex - lowerIndex;

    progress[sections[lowerIndex].id] = 1 - ratio;
    if (upperIndex !== lowerIndex) {
      progress[sections[upperIndex].id] = ratio;
    }

    return progress;
  }, [debugInfo, sectionIds]);

  const getIndicatorStyle = (id: string): IndicatorStyle => {
    const progress = sectionProgress[id] ?? 0;
    const amplified = Math.pow(progress, 0.6);
    const width = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * amplified;
    const opacity = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * amplified;
    return { width: `${width}px`, opacity };
  };

  return { sectionProgress, getIndicatorStyle };
}
