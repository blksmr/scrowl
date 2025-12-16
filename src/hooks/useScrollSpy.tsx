// Misc
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import type { RefObject } from "react";

const __DEV__ = import.meta.env.DEV;
const DEBUG_SCROLL_SPY = __DEV__ && false;

type ScrollSpyOptions = {
  offset?: number;
  debounceMs?: number;
};

type SectionBounds = {
  id: string;
  top: number;
  bottom: number;
  height: number;
};

type DebugInfo = {
  scrollY: number;
  triggerLine: number;
  viewportHeight: number;
  sections: Array<{
    id: string;
    score: number;
    isActive: boolean;
    bounds: SectionBounds;
    visibilityRatio: number;
  }>;
};

type UseScrollSpyReturn = {
  activeId: string | null;
  registerRef: (id: string) => (el: HTMLElement | null) => void;
  scrollToSection: (id: string) => void;
  debugInfo: DebugInfo | null;
  DebugOverlay: () => JSX.Element | null;
};

type SectionScore = {
  id: string;
  score: number;
  visibilityRatio: number;
  distanceFromTrigger: number;
  isInViewport: boolean;
  bounds: SectionBounds;
};

const VISIBILITY_THRESHOLD = 0.6;

const DEBUG_STYLES = __DEV__
  ? {
      overlay: {
        position: "fixed" as const,
        top: "10px",
        right: "10px",
        width: "300px",
        maxHeight: "400px",
        overflowY: "auto" as const,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "#fff",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "11px",
        fontFamily: "monospace",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      },
      triggerLine: {
        position: "fixed" as const,
        left: 0,
        right: 0,
        height: "2px",
        backgroundColor: "rgba(255, 0, 0, 0.8)",
        zIndex: 9998,
        pointerEvents: "none" as const,
      },
      sectionActive: {
        outline: "3px solid rgba(0, 255, 0, 0.8)",
        outlineOffset: "-3px",
      },
      sectionInactive: {
        outline: "2px dashed rgba(255, 165, 0, 0.6)",
        outlineOffset: "-2px",
      },
      header: {
        fontWeight: "bold" as const,
        marginBottom: "8px",
        paddingBottom: "6px",
        borderBottom: "1px solid rgba(255,255,255,0.3)",
      },
      stat: {
        display: "flex" as const,
        justifyContent: "space-between" as const,
        marginBottom: "4px",
      },
      sectionItem: {
        padding: "6px",
        marginBottom: "4px",
        borderRadius: "4px",
      },
      activeSection: {
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        border: "1px solid rgba(0, 255, 0, 0.5)",
      },
      inactiveSection: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      },
    }
  : null;

export const useScrollSpy = (
  sectionIds: string[],
  containerRef: RefObject<HTMLElement> | null = null,
  { offset = 100, debounceMs = 10 }: ScrollSpyOptions = {},
): UseScrollSpyReturn => {
  // States
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] || null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // Refs
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const lastScrollY = useRef<number>(0);
  const rafId = useRef<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Callbacks
  const registerRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) {
        refs.current[id] = el;
      } else {
        delete refs.current[id];
      }
    },
    [],
  );

  const scrollToSection = useCallback((id: string): void => {
    const element = refs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
    }
  }, []);

  const getSectionBounds = useCallback((): SectionBounds[] => {
    const container = containerRef.current;
    if (!container) return [];

    const containerRect = container.getBoundingClientRect();
    const containerScrollTop = container.scrollTop;

    return sectionIds
      .map((id) => {
        const el = refs.current[id];
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top + containerScrollTop;
        return {
          id,
          top: relativeTop,
          bottom: relativeTop + rect.height,
          height: rect.height,
        };
      })
      .filter((bounds): bounds is SectionBounds => bounds !== null);
  }, [sectionIds, containerRef]);

  const calculateActiveSection = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollY = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    const scrollDirection = scrollY > lastScrollY.current ? "down" : "up";
    lastScrollY.current = scrollY;

    const sections = getSectionBounds();
    if (sections.length === 0) return;

    const triggerLine = scrollY + offset;
    const viewportTop = scrollY;
    const viewportBottom = scrollY + viewportHeight;

    const buildDebugSections = (activeIdParam: string): DebugInfo["sections"] =>
      sections.map((section) => {
        const visibleTop = Math.max(section.top, viewportTop);
        const visibleBottom = Math.min(section.bottom, viewportBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibilityRatio = section.height > 0 ? visibleHeight / section.height : 0;

        return {
          id: section.id,
          score: section.id === activeIdParam ? 9999 : 0,
          isActive: section.id === activeIdParam,
          bounds: section,
          visibilityRatio,
        };
      });

    const isAtBottom = scrollY + viewportHeight >= scrollHeight - 5;
    if (isAtBottom && sectionIds.length > 0) {
      const lastId = sectionIds[sectionIds.length - 1];
      setActiveId((prev) => (prev !== lastId ? lastId : prev));
      if (import.meta.env.DEV && DEBUG_SCROLL_SPY) {
        setDebugInfo({
          scrollY,
          triggerLine,
          viewportHeight,
          sections: buildDebugSections(lastId),
        });
      }
      return;
    }

    const isAtTop = scrollY <= 5;
    if (isAtTop && sectionIds.length > 0) {
      const firstId = sectionIds[0];
      setActiveId((prev) => (prev !== firstId ? firstId : prev));
      if (__DEV__ && DEBUG_SCROLL_SPY) {
        setDebugInfo({
          scrollY,
          triggerLine,
          viewportHeight,
          sections: buildDebugSections(firstId),
        });
      }
      return;
    }

    const scores: SectionScore[] = sections.map((section) => {
      const visibleTop = Math.max(section.top, viewportTop);
      const visibleBottom = Math.min(section.bottom, viewportBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = section.height > 0 ? visibleHeight / section.height : 0;

      const visibleInViewportRatio = viewportHeight > 0 ? visibleHeight / viewportHeight : 0;

      const isInViewport = section.bottom > viewportTop && section.top < viewportBottom;

      let score = 0;

      if (visibilityRatio >= VISIBILITY_THRESHOLD) {
        score += 1000 + visibilityRatio * 500;
      } else if (isInViewport) {
        score += visibleInViewportRatio * 800;
      }

      const sectionIndex = sectionIds.indexOf(section.id);
      if (scrollDirection === "down" && isInViewport && section.top <= viewportTop + viewportHeight * 0.5) {
        score += 100;
      } else if (scrollDirection === "up" && isInViewport && section.bottom >= viewportTop + viewportHeight * 0.5) {
        score += 100;
      }

      score -= sectionIndex * 0.1;

      return {
        id: section.id,
        score,
        visibilityRatio,
        distanceFromTrigger: 0,
        isInViewport,
        bounds: section,
      };
    });

    const visibleScores = scores.filter((s) => s.isInViewport);
    const candidates = visibleScores.length > 0 ? visibleScores : scores;

    candidates.sort((a, b) => b.score - a.score);

    let newActiveId: string | null = null;
    if (candidates.length > 0) {
      newActiveId = candidates[0].id;
      setActiveId((prev) => (prev !== newActiveId ? newActiveId : prev));
    }

    if (__DEV__ && DEBUG_SCROLL_SPY) {
      setDebugInfo({
        scrollY,
        triggerLine,
        viewportHeight,
        sections: scores.map((s) => ({
          id: s.id,
          score: Math.round(s.score),
          isActive: s.id === newActiveId,
          bounds: s.bounds,
          visibilityRatio: Math.round(s.visibilityRatio * 100) / 100,
        })),
      });
    }
  }, [sectionIds, offset, getSectionBounds, DEBUG_SCROLL_SPY, containerRef]);

  // Effects
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = (): void => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }
        rafId.current = requestAnimationFrame(calculateActiveSection);
      }, debounceMs);
    };

    calculateActiveSection();

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [calculateActiveSection, debounceMs, containerRef]);

  useEffect(() => {
    if (!__DEV__ || !DEBUG_SCROLL_SPY || !DEBUG_STYLES) return;

    Object.entries(refs.current).forEach(([id, el]) => {
      if (el) {
        const isActive = id === activeId;
        const style = isActive ? DEBUG_STYLES.sectionActive : DEBUG_STYLES.sectionInactive;
        el.style.outline = style.outline;
        el.style.outlineOffset = style.outlineOffset;
      }
    });

    return () => {
      Object.values(refs.current).forEach((el) => {
        if (el) {
          el.style.outline = "";
          el.style.outlineOffset = "";
        }
      });
    };
  }, [DEBUG_SCROLL_SPY, activeId]);

  // Memos
  const DebugOverlay = useMemo(
    () =>
      function DebugOverlayComponent(): JSX.Element | null {
        if (!__DEV__ || !DEBUG_SCROLL_SPY || !debugInfo || !DEBUG_STYLES) return null;

        const container = containerRef.current;
        const containerRect = container?.getBoundingClientRect();
        const triggerLineTop = containerRect ? containerRect.top + offset : offset;

        return (
          <>
            <div style={{ ...DEBUG_STYLES.triggerLine, top: `${triggerLineTop}px` }}>
              <span
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "-18px",
                  backgroundColor: "rgba(255, 0, 0, 0.9)",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontSize: "10px",
                }}
              >
                {`Trigger Line (offset: ${offset}px)`}
              </span>
            </div>
            <div style={DEBUG_STYLES.overlay}>
              <div style={DEBUG_STYLES.header}>{"🔍 ScrollSpy Debug"}</div>
              <div style={DEBUG_STYLES.stat}>
                <span>{"Scroll Y:"}</span>
                <span>{`${Math.round(debugInfo.scrollY)}px`}</span>
              </div>
              <div style={DEBUG_STYLES.stat}>
                <span>{"Trigger Line:"}</span>
                <span>{`${Math.round(debugInfo.triggerLine)}px`}</span>
              </div>
              <div style={DEBUG_STYLES.stat}>
                <span>{"Viewport Height:"}</span>
                <span>{`${debugInfo.viewportHeight}px`}</span>
              </div>
              <div style={{ ...DEBUG_STYLES.stat, marginTop: "8px", marginBottom: "8px" }}>
                <span>{"Active:"}</span>
                <span style={{ color: "#0f0" }}>{activeId ? activeId.slice(0, 8) + "..." : "none"}</span>
              </div>
              <div style={{ fontWeight: "bold", marginBottom: "6px" }}>{"Sections:"}</div>
              {debugInfo.sections.map((section) => (
                <div
                  key={section.id}
                  style={{
                    ...DEBUG_STYLES.sectionItem,
                    ...(section.isActive ? DEBUG_STYLES.activeSection : DEBUG_STYLES.inactiveSection),
                  }}
                >
                  <div style={{ fontWeight: section.isActive ? "bold" : "normal" }}>
                    {section.isActive ? "✓ " : "  "}
                    {section.id.slice(0, 12)}
                    {section.id.length > 12 ? "..." : ""}
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.8, marginLeft: "16px" }}>
                    {`Score: ${section.score} | Vis: ${Math.round(section.visibilityRatio * 100)}%`}
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.6, marginLeft: "16px" }}>
                    {`Top: ${Math.round(section.bounds.top)}px | H: ${Math.round(section.bounds.height)}px`}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      },
    [DEBUG_SCROLL_SPY, debugInfo, activeId, offset, containerRef],
  );

  // Return
  return {
    activeId,
    registerRef,
    scrollToSection,
    debugInfo,
    DebugOverlay,
  };
};

export default useScrollSpy;
