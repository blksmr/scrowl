import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  DometOptions,
  LinkProps,
  Offset,
  RegisterProps,
  ResolvedSection,
  ScrollBehavior,
  ScrollState,
  ScrollToOptions,
  SectionState,
  UseDometReturn,
} from "./types";
import {
  DEFAULT_THRESHOLD,
  DEFAULT_HYSTERESIS,
  DEFAULT_OFFSET,
  DEFAULT_THROTTLE,
  SCROLL_IDLE_MS,
} from "./constants";
import {
  resolveContainer,
  resolveSectionsFromIds,
  resolveSectionsFromSelector,
  resolveOffset,
} from "./resolvers";
import {
  getSectionBounds,
  calculateSectionScores,
  determineActiveSection,
} from "./scoring";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useDomet(options: DometOptions): UseDometReturn {
  const {
    container: containerInput,
    offset = DEFAULT_OFFSET,
    throttle = DEFAULT_THROTTLE,
    threshold = DEFAULT_THRESHOLD,
    hysteresis = DEFAULT_HYSTERESIS,
    behavior = "auto",
    onActive,
    onEnter,
    onLeave,
    onScrollStart,
    onScrollEnd,
  } = options;

  const idsArray = "ids" in options ? options.ids : undefined;
  const selectorString = "selector" in options ? options.selector : undefined;
  const useSelector = selectorString !== undefined;

  const initialActiveId = idsArray && idsArray.length > 0 ? idsArray[0] : null;

  const [containerElement, setContainerElement] = useState<HTMLElement | null>(null);
  const [resolvedSections, setResolvedSections] = useState<ResolvedSection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  const [scroll, setScroll] = useState<ScrollState>({
    y: 0,
    progress: 0,
    direction: null,
    velocity: 0,
    scrolling: false,
    maxScroll: 0,
    viewportHeight: 0,
    offset: 0,
  });
  const [sections, setSections] = useState<Record<string, SectionState>>({});

  const refs = useRef<Record<string, HTMLElement | null>>({});
  const refCallbacks = useRef<Record<string, (el: HTMLElement | null) => void>>({});
  const activeIdRef = useRef<string | null>(initialActiveId);
  const lastScrollY = useRef<number>(0);
  const lastScrollTime = useRef<number>(Date.now());
  const rafId = useRef<number | null>(null);
  const isThrottled = useRef<boolean>(false);
  const throttleTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingScroll = useRef<boolean>(false);
  const isProgrammaticScrolling = useRef<boolean>(false);
  const programmaticScrollTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSectionsInViewport = useRef<Set<string>>(new Set());
  const recalculateRef = useRef<() => void>(() => {});
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef({ offset, behavior });
  const callbackRefs = useRef({
    onActive,
    onEnter,
    onLeave,
    onScrollStart,
    onScrollEnd,
  });

  optionsRef.current = { offset, behavior };
  callbackRefs.current = {
    onActive,
    onEnter,
    onLeave,
    onScrollStart,
    onScrollEnd,
  };

  const sectionIds = useMemo(() => {
    if (!useSelector && idsArray) return idsArray;
    return resolvedSections.map((s) => s.id);
  }, [useSelector, idsArray, resolvedSections]);

  const sectionIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < sectionIds.length; i++) {
      map.set(sectionIds[i], i);
    }
    return map;
  }, [sectionIds]);

  useIsomorphicLayoutEffect(() => {
    const resolved = resolveContainer(containerInput);
    if (resolved !== containerElement) {
      setContainerElement(resolved);
    }
  }, [containerInput]);

  useIsomorphicLayoutEffect(() => {
    if (useSelector && selectorString) {
      const resolved = resolveSectionsFromSelector(selectorString);
      setResolvedSections(resolved);
      if (resolved.length > 0 && !activeIdRef.current) {
        activeIdRef.current = resolved[0].id;
        setActiveId(resolved[0].id);
      }
    }
  }, [selectorString, useSelector]);

  useEffect(() => {
    if (!useSelector && idsArray) {
      const idsSet = new Set(idsArray);

      for (const id of Object.keys(refs.current)) {
        if (!idsSet.has(id)) {
          delete refs.current[id];
        }
      }

      for (const id of Object.keys(refCallbacks.current)) {
        if (!idsSet.has(id)) {
          delete refCallbacks.current[id];
        }
      }

      const currentActive = activeIdRef.current;
      const nextActive =
        currentActive && idsSet.has(currentActive)
          ? currentActive
          : (idsArray[0] ?? null);

      if (nextActive !== currentActive) {
        activeIdRef.current = nextActive;
        setActiveId(nextActive);
      }
    }
  }, [idsArray, useSelector]);

  const registerRef = useCallback((id: string) => {
    const existing = refCallbacks.current[id];
    if (existing) return existing;

    const callback = (el: HTMLElement | null) => {
      if (el) {
        refs.current[id] = el;
      } else {
        delete refs.current[id];
      }
    };

    refCallbacks.current[id] = callback;
    return callback;
  }, []);

  const getResolvedBehavior = useCallback((behaviorOverride?: ScrollBehavior): ScrollBehavior => {
    const b = behaviorOverride ?? optionsRef.current.behavior;
    if (b === "auto") {
      if (typeof window === "undefined") return "instant";
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      return prefersReducedMotion ? "instant" : "smooth";
    }
    return b;
  }, []);

  const getCurrentSections = useCallback((): ResolvedSection[] => {
    if (!useSelector && idsArray) {
      return resolveSectionsFromIds(idsArray, refs.current);
    }
    return resolvedSections;
  }, [useSelector, idsArray, resolvedSections]);

  const scrollTo = useCallback(
    (id: string, scrollOptions?: ScrollToOptions): void => {
      if (!sectionIds.includes(id)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[domet] scrollTo: id "${id}" not found`);
        }
        return;
      }

      const currentSections = getCurrentSections();
      const section = currentSections.find((s) => s.id === id);
      if (!section) return;

      if (programmaticScrollTimeoutId.current) {
        clearTimeout(programmaticScrollTimeoutId.current);
      }

      scrollCleanupRef.current?.();

      isProgrammaticScrolling.current = true;
      activeIdRef.current = id;
      setActiveId(id);

      const container = containerElement;
      const elementRect = section.element.getBoundingClientRect();
      const viewportHeight = container ? container.clientHeight : window.innerHeight;

      const offsetValue = scrollOptions?.offset ?? optionsRef.current.offset;
      const effectiveOffset = resolveOffset(offsetValue, viewportHeight, DEFAULT_OFFSET);

      const scrollTarget = container || window;

      const unlockScroll = () => {
        isProgrammaticScrolling.current = false;
        if (programmaticScrollTimeoutId.current) {
          clearTimeout(programmaticScrollTimeoutId.current);
          programmaticScrollTimeoutId.current = null;
        }
        requestAnimationFrame(() => {
          recalculateRef.current();
        });
      };

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let isUnlocked = false;

      const cleanup = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        scrollTarget.removeEventListener("scroll", handleScrollActivity);
        if ("onscrollend" in scrollTarget) {
          scrollTarget.removeEventListener("scrollend", handleScrollEnd);
        }
        scrollCleanupRef.current = null;
      };

      const doUnlock = () => {
        if (isUnlocked) return;
        isUnlocked = true;
        cleanup();
        unlockScroll();
      };

      const resetDebounce = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(doUnlock, SCROLL_IDLE_MS);
      };

      const handleScrollActivity = () => {
        resetDebounce();
      };

      const handleScrollEnd = () => {
        doUnlock();
      };

      scrollTarget.addEventListener("scroll", handleScrollActivity, {
        passive: true,
      });

      if ("onscrollend" in scrollTarget) {
        scrollTarget.addEventListener("scrollend", handleScrollEnd, {
          once: true,
        });
      }

      scrollCleanupRef.current = cleanup;

      const scrollBehavior = getResolvedBehavior(scrollOptions?.behavior);

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const relativeTop =
          elementRect.top - containerRect.top + container.scrollTop;
        container.scrollTo({
          top: relativeTop - effectiveOffset,
          behavior: scrollBehavior,
        });
      } else {
        const absoluteTop = elementRect.top + window.scrollY;
        window.scrollTo({
          top: absoluteTop - effectiveOffset,
          behavior: scrollBehavior,
        });
      }

      if (scrollBehavior === "instant") {
        doUnlock();
      } else {
        resetDebounce();
      }
    },
    [sectionIds, containerElement, getResolvedBehavior, getCurrentSections],
  );

  const register = useCallback(
    (id: string): RegisterProps => ({
      id,
      ref: registerRef(id),
      "data-domet": id,
    }),
    [registerRef],
  );

  const link = useCallback(
    (id: string): LinkProps => ({
      onClick: () => scrollTo(id),
      "aria-current": activeId === id ? "page" : undefined,
      "data-active": activeId === id,
    }),
    [activeId, scrollTo],
  );

  const calculateActiveSection = useCallback(() => {
    const container = containerElement;
    const currentActiveId = activeIdRef.current;
    const now = Date.now();
    const scrollY = container ? container.scrollTop : window.scrollY;
    const viewportHeight = container ? container.clientHeight : window.innerHeight;
    const scrollHeight = container
      ? container.scrollHeight
      : document.documentElement.scrollHeight;
    const maxScroll = Math.max(0, scrollHeight - viewportHeight);
    const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
    const scrollDirection: "up" | "down" | null =
      scrollY === lastScrollY.current
        ? null
        : scrollY > lastScrollY.current
          ? "down"
          : "up";
    const deltaTime = now - lastScrollTime.current;
    const deltaY = scrollY - lastScrollY.current;
    const velocity = deltaTime > 0 ? Math.abs(deltaY) / deltaTime : 0;

    lastScrollY.current = scrollY;
    lastScrollTime.current = now;

    const currentSections = getCurrentSections();
    const sectionBounds = getSectionBounds(currentSections, container);
    if (sectionBounds.length === 0) return;

    const effectiveOffset = resolveOffset(offset, viewportHeight, DEFAULT_OFFSET);

    const scores = calculateSectionScores(sectionBounds, currentSections, {
      scrollY,
      viewportHeight,
      scrollHeight,
      effectiveOffset,
      visibilityThreshold: threshold,
      scrollDirection,
      sectionIndexMap,
    });

    const isProgrammatic = isProgrammaticScrolling.current;

    const newActiveId = isProgrammatic
      ? currentActiveId
      : determineActiveSection(
          scores,
          sectionIds,
          currentActiveId,
          hysteresis,
          scrollY,
          viewportHeight,
          scrollHeight,
        );

    if (!isProgrammatic && newActiveId !== currentActiveId) {
      activeIdRef.current = newActiveId;
      setActiveId(newActiveId);
      callbackRefs.current.onActive?.(newActiveId, currentActiveId);
    }

    if (!isProgrammatic) {
      const currentInViewport = new Set(
        scores.filter((s) => s.inView).map((s) => s.id),
      );
      const prevInViewport = prevSectionsInViewport.current;

      for (const id of currentInViewport) {
        if (!prevInViewport.has(id)) {
          callbackRefs.current.onEnter?.(id);
        }
      }
      for (const id of prevInViewport) {
        if (!currentInViewport.has(id)) {
          callbackRefs.current.onLeave?.(id);
        }
      }
      prevSectionsInViewport.current = currentInViewport;
    }

    const newScrollState: ScrollState = {
      y: scrollY,
      progress: Math.max(0, Math.min(1, scrollProgress)),
      direction: scrollDirection,
      velocity,
      scrolling: isScrollingRef.current,
      maxScroll,
      viewportHeight,
      offset: effectiveOffset,
    };

    const newSections: Record<string, SectionState> = {};
    for (const s of scores) {
      newSections[s.id] = {
        bounds: {
          top: s.bounds.top,
          bottom: s.bounds.bottom,
          height: s.bounds.height,
        },
        visibility: Math.round(s.visibilityRatio * 100) / 100,
        progress: Math.round(s.progress * 100) / 100,
        inView: s.inView,
        active: s.id === (isProgrammatic ? currentActiveId : newActiveId),
        rect: s.rect,
      };
    }

    setScroll(newScrollState);
    setSections(newSections);
  }, [
    sectionIds,
    sectionIndexMap,
    offset,
    threshold,
    hysteresis,
    containerElement,
    getCurrentSections,
  ]);

  recalculateRef.current = calculateActiveSection;

  useEffect(() => {
    const container = containerElement;
    const scrollTarget = container || window;

    const scheduleCalculate = (): void => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        calculateActiveSection();
      });
    };

    const handleScrollEnd = (): void => {
      isScrollingRef.current = false;
      setScroll((prev) => ({ ...prev, scrolling: false }));
      callbackRefs.current.onScrollEnd?.();
    };

    const handleScroll = (): void => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        setScroll((prev) => ({ ...prev, scrolling: true }));
        callbackRefs.current.onScrollStart?.();
      }

      if (scrollIdleTimeoutRef.current) {
        clearTimeout(scrollIdleTimeoutRef.current);
      }
      scrollIdleTimeoutRef.current = setTimeout(handleScrollEnd, SCROLL_IDLE_MS);

      if (isThrottled.current) {
        hasPendingScroll.current = true;
        return;
      }

      isThrottled.current = true;
      hasPendingScroll.current = false;

      if (throttleTimeoutId.current) {
        clearTimeout(throttleTimeoutId.current);
      }

      scheduleCalculate();

      throttleTimeoutId.current = setTimeout(() => {
        isThrottled.current = false;
        throttleTimeoutId.current = null;

        if (hasPendingScroll.current) {
          hasPendingScroll.current = false;
          handleScroll();
        }
      }, throttle);
    };

    const handleResize = (): void => {
      if (useSelector && selectorString) {
        const resolved = resolveSectionsFromSelector(selectorString);
        setResolvedSections(resolved);
      }
      scheduleCalculate();
    };

    calculateActiveSection();

    const deferredRecalcId = setTimeout(() => {
      calculateActiveSection();
    }, 0);

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(deferredRecalcId);
      scrollTarget.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (throttleTimeoutId.current) {
        clearTimeout(throttleTimeoutId.current);
        throttleTimeoutId.current = null;
      }
      if (programmaticScrollTimeoutId.current) {
        clearTimeout(programmaticScrollTimeoutId.current);
        programmaticScrollTimeoutId.current = null;
      }
      if (scrollIdleTimeoutRef.current) {
        clearTimeout(scrollIdleTimeoutRef.current);
        scrollIdleTimeoutRef.current = null;
      }
      scrollCleanupRef.current?.();
      isThrottled.current = false;
      hasPendingScroll.current = false;
      isProgrammaticScrolling.current = false;
      isScrollingRef.current = false;
    };
  }, [calculateActiveSection, throttle, containerElement, useSelector, selectorString]);

  const index = useMemo(() => {
    if (!activeId) return -1;
    return sectionIndexMap.get(activeId) ?? -1;
  }, [activeId, sectionIndexMap]);

  return {
    active: activeId,
    index,
    progress: scroll.progress,
    direction: scroll.direction,
    scroll,
    sections,
    ids: sectionIds,
    scrollTo,
    register,
    link,
  };
}

export default useDomet;
