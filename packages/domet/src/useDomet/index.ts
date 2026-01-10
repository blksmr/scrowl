import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  DometOptions,
  LinkProps,
  RegisterProps,
  ResolvedSection,
  ScrollBehavior,
  ScrollState,
  ScrollTarget,
  ScrollToOptions,
  ScrollToPosition,
  SectionState,
  UseDometReturn,
} from "../types";
import {
  DEFAULT_OFFSET,
  SCROLL_IDLE_MS,
} from "../constants";
import {
  resolveContainer,
  resolveSectionsFromIds,
  resolveSectionsFromSelector,
  resolveOffset,
  getSectionBounds,
  calculateSectionScores,
  determineActiveSection,
  sanitizeOffset,
  sanitizeThreshold,
  sanitizeHysteresis,
  sanitizeThrottle,
  sanitizeIds,
  sanitizeSelector,
} from "../utils";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type ScrollSnapshot = {
  scrollY: number;
  viewportHeight: number;
  scrollHeight: number;
};

const defaultSnapshot: ScrollSnapshot = {
  scrollY: 0,
  viewportHeight: 0,
  scrollHeight: 0,
};

function getScrollSnapshot(container: HTMLElement | null): ScrollSnapshot {
  if (typeof window === "undefined") {
    return defaultSnapshot;
  }

  if (container) {
    return {
      scrollY: container.scrollTop,
      viewportHeight: container.clientHeight,
      scrollHeight: container.scrollHeight,
    };
  }

  return {
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  };
}

function useScrollSnapshot(container: HTMLElement | null): ScrollSnapshot {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const target = container ?? window;
      const handleChange = () => onStoreChange();

      target.addEventListener("scroll", handleChange, { passive: true });
      window.addEventListener("resize", handleChange, { passive: true });

      return () => {
        target.removeEventListener("scroll", handleChange);
        window.removeEventListener("resize", handleChange);
      };
    },
    [container]
  );

  const getSnapshot = useCallback(
    () => getScrollSnapshot(container),
    [container]
  );

  const getServerSnapshot = useCallback(() => defaultSnapshot, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function areIdInputsEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

export function useDomet(options: DometOptions): UseDometReturn {
  const {
    container: containerInput,
    behavior = "auto",
    onActive,
    onEnter,
    onLeave,
    onScrollStart,
    onScrollEnd,
  } = options;

  const offset = sanitizeOffset(options.offset);
  const throttle = sanitizeThrottle(options.throttle);
  const threshold = sanitizeThreshold(options.threshold);
  const hysteresis = sanitizeHysteresis(options.hysteresis);

  const rawIds = "ids" in options ? options.ids : undefined;
  const rawSelector = "selector" in options ? options.selector : undefined;

  const idsCacheRef = useRef<{
    raw: unknown;
    sanitized: string[] | undefined;
  }>({ raw: undefined, sanitized: undefined });

  const idsArray = useMemo(() => {
    if (rawIds === undefined) {
      idsCacheRef.current = { raw: undefined, sanitized: undefined };
      return undefined;
    }

    if (areIdInputsEqual(rawIds, idsCacheRef.current.raw)) {
      idsCacheRef.current.raw = rawIds;
      return idsCacheRef.current.sanitized;
    }

    const sanitized = sanitizeIds(rawIds);
    idsCacheRef.current = { raw: rawIds, sanitized };
    return sanitized;
  }, [rawIds]);

  const selectorString = useMemo(() => {
    if (rawSelector === undefined) return undefined;
    return sanitizeSelector(rawSelector);
  }, [rawSelector]);
  const useSelector = selectorString !== undefined && selectorString !== "";

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
    triggerLine: 0,
  });
  const [sections, setSections] = useState<Record<string, SectionState>>({});

  const refs = useRef<Record<string, HTMLElement | null>>({});
  const refCallbacks = useRef<Record<string, (el: HTMLElement | null) => void>>({});
  const registerPropsCache = useRef<Record<string, RegisterProps>>({});
  const activeIdRef = useRef<string | null>(initialActiveId);
  const lastScrollY = useRef<number>(0);
  const lastScrollTime = useRef<number>(Date.now());
  const rafId = useRef<number | null>(null);
  const isThrottled = useRef<boolean>(false);
  const throttleTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingScroll = useRef<boolean>(false);
  const isProgrammaticScrolling = useRef<boolean>(false);
  const isScrollingRef = useRef<boolean>(false);
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSectionsInViewport = useRef<Set<string>>(new Set());
  const recalculateRef = useRef<() => void>(() => {});
  const scheduleRecalculate = useCallback(() => {
    if (typeof window === "undefined") return;
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      recalculateRef.current();
    });
  }, []);
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const mutationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef({ offset, behavior });
  const callbackRefs = useRef({
    onActive,
    onEnter,
    onLeave,
    onScrollStart,
    onScrollEnd,
  });

  useIsomorphicLayoutEffect(() => {
    optionsRef.current = { offset, behavior };
  }, [offset, behavior]);

  useIsomorphicLayoutEffect(() => {
    callbackRefs.current = {
      onActive,
      onEnter,
      onLeave,
      onScrollStart,
      onScrollEnd,
    };
  }, [onActive, onEnter, onLeave, onScrollStart, onScrollEnd]);

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

  const containerRefCurrent = containerInput?.current ?? null;

  useIsomorphicLayoutEffect(() => {
    const resolved = resolveContainer(containerInput);
    if (resolved !== containerElement) {
      setContainerElement(resolved);
    }
  }, [containerInput, containerRefCurrent]);

  useIsomorphicLayoutEffect(() => {
    if (!containerInput || containerRefCurrent !== null) return;
    const nextActive = initialActiveId;
    if (activeIdRef.current !== nextActive) {
      activeIdRef.current = nextActive;
      setActiveId(nextActive);
    }
    setSections({});
    prevSectionsInViewport.current = new Set();
    lastScrollY.current = 0;
    lastScrollTime.current = Date.now();
    isScrollingRef.current = false;
    setScroll((prev) => ({
      ...prev,
      y: 0,
      progress: 0,
      direction: null,
      velocity: 0,
      scrolling: false,
      maxScroll: 0,
      viewportHeight: 0,
      triggerLine: prev.offset,
    }));
  }, [containerInput, containerRefCurrent, initialActiveId]);

  const updateSectionsFromSelector = useCallback((selector: string) => {
    const resolved = resolveSectionsFromSelector(selector);
    setResolvedSections(resolved);
    if (resolved.length > 0) {
      const currentStillExists = resolved.some((s) => s.id === activeIdRef.current);
      if (!activeIdRef.current || !currentStillExists) {
        activeIdRef.current = resolved[0].id;
        setActiveId(resolved[0].id);
      }
    } else if (activeIdRef.current !== null) {
      activeIdRef.current = null;
      setActiveId(null);
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (useSelector && selectorString) {
      updateSectionsFromSelector(selectorString);
    }
  }, [selectorString, useSelector, updateSectionsFromSelector]);

  useEffect(() => {
    if (
      !useSelector ||
      !selectorString ||
      typeof window === "undefined" ||
      typeof MutationObserver === "undefined"
    ) {
      return;
    }

    const handleMutation = () => {
      if (mutationDebounceRef.current) {
        clearTimeout(mutationDebounceRef.current);
      }
      mutationDebounceRef.current = setTimeout(() => {
        updateSectionsFromSelector(selectorString);
      }, 50);
    };

    mutationObserverRef.current = new MutationObserver(handleMutation);
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["id", "data-domet"],
    });

    return () => {
      if (mutationDebounceRef.current) {
        clearTimeout(mutationDebounceRef.current);
        mutationDebounceRef.current = null;
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
        mutationObserverRef.current = null;
      }
    };
  }, [useSelector, selectorString, updateSectionsFromSelector]);

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
      scheduleRecalculate();
    };

    refCallbacks.current[id] = callback;
    return callback;
  }, [scheduleRecalculate]);

  const getResolvedBehavior = useCallback((behaviorOverride?: ScrollBehavior): ScrollBehavior => {
    const b = behaviorOverride ?? optionsRef.current.behavior;
    if (b === "auto") {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return "smooth";
      }
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
    (target: ScrollTarget, scrollOptions?: ScrollToOptions): void => {
      const resolvedTarget = typeof target === "string"
        ? { type: "id" as const, id: target }
        : "id" in target
          ? { type: "id" as const, id: target.id }
          : { type: "top" as const, top: target.top };

      const lockActive = scrollOptions?.lockActive ?? resolvedTarget.type === "id";
      const container = containerElement;
      const scrollTarget = container || window;
      const viewportHeight = container ? container.clientHeight : window.innerHeight;
      const scrollHeight = container
        ? container.scrollHeight
        : document.documentElement.scrollHeight;
      const maxScroll = Math.max(0, scrollHeight - viewportHeight);
      const scrollBehavior = getResolvedBehavior(scrollOptions?.behavior);
      const offsetValue = scrollOptions?.offset !== undefined
        ? sanitizeOffset(scrollOptions.offset)
        : optionsRef.current.offset;
      const effectiveOffset = resolveOffset(offsetValue, viewportHeight, DEFAULT_OFFSET);

      const stopProgrammaticScroll = () => {
        if (scrollCleanupRef.current) {
          scrollCleanupRef.current();
          scrollCleanupRef.current = null;
        }
        isProgrammaticScrolling.current = false;
      };

      if (!lockActive) {
        stopProgrammaticScroll();
      } else if (scrollCleanupRef.current) {
        scrollCleanupRef.current();
      }

      const setupLock = () => {
        const unlockScroll = () => {
          isProgrammaticScrolling.current = false;
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

        return { doUnlock, resetDebounce };
      };

      const clampValue = (value: number, min: number, max: number): number =>
        Math.max(min, Math.min(max, value));

      let targetScroll: number | null = null;
      let activeTargetId: string | null = null;

      if (resolvedTarget.type === "id") {
        const id = resolvedTarget.id;
        if (!sectionIndexMap.has(id)) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[domet] scrollTo: id "${id}" not found`);
          }
          return;
        }

        const currentSections = getCurrentSections();
        const section = currentSections.find((s) => s.id === id);
        if (!section) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[domet] scrollTo: element for id "${id}" not yet mounted`);
          }
          return;
        }

        const elementRect = section.element.getBoundingClientRect();

        const position: ScrollToPosition | undefined = scrollOptions?.position;

        const sectionTop = container
          ? elementRect.top - container.getBoundingClientRect().top + container.scrollTop
          : elementRect.top + window.scrollY;
        const sectionHeight = elementRect.height;

        const calculateTargetScroll = (): number => {
          if (maxScroll <= 0) return 0;

          const topTarget = sectionTop - effectiveOffset;
          const centerTarget = sectionTop - (viewportHeight - sectionHeight) / 2;
          const bottomTarget = sectionTop + sectionHeight - viewportHeight;

          if (position === "top") {
            return clampValue(topTarget, 0, maxScroll);
          }

          if (position === "center") {
            return clampValue(centerTarget, 0, maxScroll);
          }

          if (position === "bottom") {
            return clampValue(bottomTarget, 0, maxScroll);
          }

          const fits = sectionHeight <= viewportHeight;

          const dynamicRange = viewportHeight - effectiveOffset;
          const denominator = dynamicRange !== 0 ? 1 + dynamicRange / maxScroll : 1;

          const triggerMin = (sectionTop - effectiveOffset) / denominator;
          const triggerMax = (sectionTop + sectionHeight - effectiveOffset) / denominator;

          if (fits) {
            if (centerTarget >= triggerMin && centerTarget <= triggerMax) {
              return clampValue(centerTarget, 0, maxScroll);
            }

            if (centerTarget < triggerMin) {
              return clampValue(triggerMin, 0, maxScroll);
            }

            return clampValue(triggerMax, 0, maxScroll);
          }

          return clampValue(topTarget, 0, maxScroll);
        };

        targetScroll = calculateTargetScroll();
        activeTargetId = id;
      } else {
        const top = resolvedTarget.top;
        if (!Number.isFinite(top)) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[domet] scrollTo: top "${top}" is not a valid number`);
          }
          return;
        }
        targetScroll = clampValue(top - effectiveOffset, 0, maxScroll);
      }

      if (targetScroll === null) return;

      if (lockActive) {
        isProgrammaticScrolling.current = true;
        if (activeTargetId) {
          activeIdRef.current = activeTargetId;
          setActiveId(activeTargetId);
        }
      }

      const lockControls = lockActive ? setupLock() : null;

      if (container) {
        container.scrollTo({
          top: targetScroll,
          behavior: scrollBehavior,
        });
      } else {
        window.scrollTo({
          top: targetScroll,
          behavior: scrollBehavior,
        });
      }

      if (lockControls) {
        if (scrollBehavior === "instant") {
          lockControls.doUnlock();
        } else {
          lockControls.resetDebounce();
        }
      }
    },
    [sectionIndexMap, containerElement, getResolvedBehavior, getCurrentSections],
  );

  const register = useCallback(
    (id: string): RegisterProps => {
      const cached = registerPropsCache.current[id];
      if (cached) return cached;

      const props: RegisterProps = {
        id,
        ref: registerRef(id),
        "data-domet": id,
      };
      registerPropsCache.current[id] = props;
      return props;
    },
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
    const maxScroll = Math.max(1, scrollHeight - viewportHeight);
    const scrollProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
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

    const triggerLine =
      effectiveOffset + scrollProgress * (viewportHeight - effectiveOffset);

    const newScrollState: ScrollState = {
      y: scrollY,
      progress: Math.max(0, Math.min(1, scrollProgress)),
      direction: scrollDirection,
      velocity,
      scrolling: isScrollingRef.current,
      maxScroll,
      viewportHeight,
      offset: effectiveOffset,
      triggerLine,
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

      scheduleRecalculate();

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
        updateSectionsFromSelector(selectorString);
      }
      scheduleRecalculate();
    };

    const deferredRecalcId = setTimeout(() => {
      scheduleRecalculate();
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
  }, [throttle, containerElement, useSelector, selectorString, updateSectionsFromSelector, scheduleRecalculate]);

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
