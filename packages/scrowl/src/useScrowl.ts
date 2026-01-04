import {
    useRef,
    useState,
    useEffect,
    useCallback,
    useLayoutEffect,
    useMemo
} from 'react';
import type { RefObject } from 'react';

const VISIBILITY_THRESHOLD = 0.6;
const HYSTERESIS_SCORE_MARGIN = 150;
const SCROLL_IDLE_MS = 100;
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type SectionBounds = {
    id: string;
    top: number;
    bottom: number;
    height: number;
};

export type DebugInfo = {
    scrollY: number;
    triggerLine: number;
    viewportHeight: number;
    offsetBase: number;
    offsetEffective: number;
    sections: Array<{
        id: string;
        score: number;
        isActive: boolean;
        bounds: SectionBounds;
        visibilityRatio: number;
    }>;
};

export type ScrowlOptions = {
    offset?: number | 'auto';
    offsetRatio?: number;
    debounceMs?: number;
};

type ScrowlOptionsWithDebug = ScrowlOptions & {
    debug: true;
};

type ScrowlOptionsWithoutDebug = ScrowlOptions & {
    debug?: false;
};

export type SectionProps = {
    id: string;
    ref: (el: HTMLElement | null) => void;
    'data-scrowl': string;
};

export type NavProps = {
    onClick: () => void;
    'aria-current': 'page' | undefined;
    'data-active': boolean;
};

export type UseScrowlReturn = {
    activeId: string | null;
    registerRef: (id: string) => (el: HTMLElement | null) => void;
    scrollToSection: (id: string) => void;
    sectionProps: (id: string) => SectionProps;
    navProps: (id: string) => NavProps;
};

export type UseScrowlReturnWithDebug = UseScrowlReturn & {
    debugInfo: DebugInfo;
};

type SectionScore = {
    id: string;
    score: number;
    visibilityRatio: number;
    isInViewport: boolean;
    bounds: SectionBounds;
};

const OVERLAY_SELECTORS = 'header, nav, [role="banner"], [data-sticky], .sticky, .fixed, .fixed-header, .fixed-top, .navbar, .topbar, .app-bar';

const isValidOverlay = (el: Element): boolean => {
    if (el === document.documentElement || el === document.body) return false;

    const htmlEl = el as HTMLElement;
    if (htmlEl.id === 'scrowl-debug-root') return false;
    if (htmlEl.closest('#scrowl-debug-root')) return false;

    const style = window.getComputedStyle(el);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;

    const zIndex = parseInt(style.zIndex, 10);
    if (!isNaN(zIndex) && zIndex >= 9998) return false;

    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top <= 50 && rect.height > 0 && rect.width > 0;
};

const detectTopOverlayHeight = (): number => {
    let maxBottom = 0;

    const candidates = document.querySelectorAll(OVERLAY_SELECTORS);
    for (const el of candidates) {
        if (isValidOverlay(el)) {
            maxBottom = Math.max(maxBottom, el.getBoundingClientRect().bottom);
        }
    }

    if (maxBottom === 0) {
        for (const el of document.body.children) {
            if (isValidOverlay(el)) {
                maxBottom = Math.max(maxBottom, el.getBoundingClientRect().bottom);
            }
        }
    }

    return maxBottom;
};

export function useScrowl(
    sectionIds: string[],
    containerRef?: RefObject<HTMLElement> | null,
    options?: ScrowlOptionsWithDebug
): UseScrowlReturnWithDebug;

export function useScrowl(
    sectionIds: string[],
    containerRef?: RefObject<HTMLElement> | null,
    options?: ScrowlOptionsWithoutDebug
): UseScrowlReturn;

export function useScrowl(
    sectionIds: string[],
    containerRef: RefObject<HTMLElement> | null = null,
    options: ScrowlOptions & { debug?: boolean } = {}
): UseScrowlReturn | UseScrowlReturnWithDebug {
    const { offset = 'auto', offsetRatio = 0.08, debounceMs = 10, debug = false } = options;

    const sectionIdsKey = JSON.stringify(sectionIds);
    const stableSectionIds = useMemo(() => sectionIds, [sectionIdsKey]);
    const sectionIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        stableSectionIds.forEach((id, i) => map.set(id, i));
        return map;
    }, [stableSectionIds]);

    const [activeId, setActiveId] = useState<string | null>(stableSectionIds[0] || null);
    const [debugInfo, setDebugInfo] = useState<DebugInfo>({
        scrollY: 0,
        triggerLine: 0,
        viewportHeight: 0,
        offsetBase: 0,
        offsetEffective: 0,
        sections: []
    });
    const [detectedOffset, setDetectedOffset] = useState<number | null>(() => {
        if (offset === 'auto' && typeof window !== 'undefined') {
            return detectTopOverlayHeight();
        }
        return null;
    });
    const [containerElement, setContainerElement] = useState<HTMLElement | null>(null);

    const refs = useRef<Record<string, HTMLElement | null>>({});
    const refCallbacks = useRef<Record<string, (el: HTMLElement | null) => void>>({});
    const activeIdRef = useRef<string | null>(stableSectionIds[0] || null);
    const lastScrollY = useRef<number>(0);
    const rafId = useRef<number | null>(null);
    const isThrottled = useRef<boolean>(false);
    const throttleTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasPendingScroll = useRef<boolean>(false);
    const isProgrammaticScrolling = useRef<boolean>(false);
    const programmaticScrollTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debugRef = useRef<boolean>(debug);
    const debugInfoRef = useRef<DebugInfo>(debugInfo);
    const recalculateRef = useRef<() => void>(() => {});
    const scrollCleanupRef = useRef<(() => void) | null>(null);

    debugRef.current = debug;

    const getEffectiveOffset = useCallback((): number => {
        if (offset === 'auto') {
            if (typeof window === 'undefined') return 0;
            return detectedOffset ?? detectTopOverlayHeight();
        }
        return offset;
    }, [offset, detectedOffset]);

    useIsomorphicLayoutEffect(() => {
        if (offset !== 'auto') return;

        const updateDetectedOffset = (): void => {
            const detected = detectTopOverlayHeight();
            setDetectedOffset(detected);
        };

        updateDetectedOffset();

        let resizeTimeout: ReturnType<typeof setTimeout>;
        const handleResize = (): void => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateDetectedOffset, 100);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', handleResize);
        };
    }, [offset]);

    useIsomorphicLayoutEffect(() => {
        if (offset !== 'auto') return;

        const timeoutId = setTimeout(() => {
            const detected = detectTopOverlayHeight();
            setDetectedOffset(detected);
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [offset, debug]);

    useIsomorphicLayoutEffect(() => {
        const nextContainer = containerRef?.current ?? null;
        if (nextContainer !== containerElement) {
            setContainerElement(nextContainer);
        }
    }, [containerRef, containerElement]);

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

    const scrollToSection = useCallback((id: string): void => {
        if (!stableSectionIds.includes(id)) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`[scrowl] scrollToSection: id "${id}" not in sectionIds`);
            }
            return;
        }

        const element = refs.current[id];
        if (!element) return;

        if (programmaticScrollTimeoutId.current) {
            clearTimeout(programmaticScrollTimeoutId.current);
        }

        scrollCleanupRef.current?.();

        isProgrammaticScrolling.current = true;
        activeIdRef.current = id;
        setActiveId(id);

        const container = containerElement;
        const elementRect = element.getBoundingClientRect();
        const effectiveOffset = getEffectiveOffset() + 10;

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
            scrollTarget.removeEventListener('scroll', handleScrollActivity);
            if ('onscrollend' in scrollTarget) {
                scrollTarget.removeEventListener('scrollend', handleScrollEnd);
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

        scrollTarget.addEventListener('scroll', handleScrollActivity, { passive: true });

        if ('onscrollend' in scrollTarget) {
            scrollTarget.addEventListener('scrollend', handleScrollEnd, { once: true });
        }

        scrollCleanupRef.current = cleanup;

        if (container) {
            const containerRect = container.getBoundingClientRect();
            const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
            container.scrollTo({
                top: relativeTop - effectiveOffset,
                behavior: 'smooth'
            });
        } else {
            const absoluteTop = elementRect.top + window.scrollY;
            window.scrollTo({
                top: absoluteTop - effectiveOffset,
                behavior: 'smooth'
            });
        }

        resetDebounce();
    }, [stableSectionIds, containerElement, getEffectiveOffset]);

    const sectionProps = useCallback(
        (id: string): SectionProps => ({
            id,
            ref: registerRef(id),
            'data-scrowl': id,
        }),
        [registerRef]
    );

    const navProps = useCallback(
        (id: string): NavProps => ({
            onClick: () => scrollToSection(id),
            'aria-current': activeId === id ? 'page' : undefined,
            'data-active': activeId === id,
        }),
        [activeId, scrollToSection]
    );

    useEffect(() => {
        const idsSet = new Set(stableSectionIds);

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
        const nextActive = currentActive && idsSet.has(currentActive)
            ? currentActive
            : stableSectionIds[0] ?? null;

        if (nextActive !== currentActive) {
            activeIdRef.current = nextActive;
        }

        setActiveId((prev) => (prev !== nextActive ? nextActive : prev));
    }, [sectionIdsKey, stableSectionIds]);

    const getSectionBounds = useCallback((): SectionBounds[] => {
        const container = containerElement;
        const scrollTop = container ? container.scrollTop : window.scrollY;
        const containerTop = container ? container.getBoundingClientRect().top : 0;

        return stableSectionIds
            .map((id) => {
                const el = refs.current[id];
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const relativeTop = container
                    ? rect.top - containerTop + scrollTop
                    : rect.top + window.scrollY;
                return {
                    id,
                    top: relativeTop,
                    bottom: relativeTop + rect.height,
                    height: rect.height
                };
            })
            .filter((bounds): bounds is SectionBounds => bounds !== null);
    }, [stableSectionIds, containerElement]);

    const calculateActiveSection = useCallback(() => {
        if (isProgrammaticScrolling.current) return;

        const container = containerElement;
        const currentActiveId = activeIdRef.current;
        const scrollY = container ? container.scrollTop : window.scrollY;
        const viewportHeight = container ? container.clientHeight : window.innerHeight;
        const scrollHeight = container ? container.scrollHeight : document.documentElement.scrollHeight;
        const scrollDirection = scrollY > lastScrollY.current ? 'down' : 'up';
        lastScrollY.current = scrollY;

        const sections = getSectionBounds();
        if (sections.length === 0) return;

        const baseOffset = getEffectiveOffset();
        const effectiveOffset = Math.max(baseOffset, viewportHeight * offsetRatio);
        const triggerLine = scrollY + effectiveOffset;
        const viewportTop = scrollY;
        const viewportBottom = scrollY + viewportHeight;

        const buildDebugSections = (activeIdParam: string): DebugInfo['sections'] =>
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
                    visibilityRatio
                };
            });

        const updateDebugInfo = (info: DebugInfo): void => {
            if (debugRef.current) {
                const current = debugInfoRef.current;
                const hasChanged =
                    current.scrollY !== info.scrollY ||
                    current.triggerLine !== info.triggerLine ||
                    current.offsetEffective !== info.offsetEffective ||
                    current.sections.length !== info.sections.length ||
                    current.sections.some((s, i) =>
                        s.id !== info.sections[i]?.id ||
                        s.isActive !== info.sections[i]?.isActive ||
                        s.score !== info.sections[i]?.score
                    );

                if (hasChanged) {
                    debugInfoRef.current = info;
                    setDebugInfo(info);
                }
            }
        };

        const isAtBottom = scrollY + viewportHeight >= scrollHeight - 5;
        if (isAtBottom && stableSectionIds.length > 0) {
            const lastId = stableSectionIds[stableSectionIds.length - 1];
            activeIdRef.current = lastId;
            setActiveId((prev) => (prev !== lastId ? lastId : prev));
            updateDebugInfo({
                scrollY,
                triggerLine,
                viewportHeight,
                offsetBase: baseOffset,
                offsetEffective: effectiveOffset,
                sections: buildDebugSections(lastId)
            });
            return;
        }

        const isAtTop = scrollY <= 5;
        if (isAtTop && stableSectionIds.length > 0) {
            const firstId = stableSectionIds[0];
            activeIdRef.current = firstId;
            setActiveId((prev) => (prev !== firstId ? firstId : prev));
            updateDebugInfo({
                scrollY,
                triggerLine,
                viewportHeight,
                offsetBase: baseOffset,
                offsetEffective: effectiveOffset,
                sections: buildDebugSections(firstId)
            });
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

            const sectionIndex = sectionIndexMap.get(section.id) ?? 0;
            if (scrollDirection === 'down' && isInViewport && section.top <= triggerLine && section.bottom > triggerLine) {
                score += 200;
            } else if (scrollDirection === 'up' && isInViewport && section.top <= triggerLine && section.bottom > triggerLine) {
                score += 200;
            }

            score -= sectionIndex * 0.1;

            return {
                id: section.id,
                score,
                visibilityRatio,
                isInViewport,
                bounds: section
            };
        });

        const visibleScores = scores.filter((s) => s.isInViewport);
        const candidates = visibleScores.length > 0 ? visibleScores : scores;

        candidates.sort((a, b) => b.score - a.score);

        let newActiveId: string | null = null;
        if (candidates.length > 0) {
            const bestCandidate = candidates[0];
            const currentScore = scores.find((s) => s.id === currentActiveId);

            const shouldSwitch =
                !currentScore ||
                !currentScore.isInViewport ||
                bestCandidate.score > currentScore.score + HYSTERESIS_SCORE_MARGIN ||
                bestCandidate.id === currentActiveId;

            if (shouldSwitch) {
                newActiveId = bestCandidate.id;
                activeIdRef.current = newActiveId;
                setActiveId((prev) => (prev !== newActiveId ? newActiveId : prev));
            } else {
                newActiveId = currentActiveId;
            }
        }

        updateDebugInfo({
            scrollY,
            triggerLine,
            viewportHeight,
            offsetBase: baseOffset,
            offsetEffective: effectiveOffset,
            sections: scores.map((s) => ({
                id: s.id,
                score: Math.round(s.score),
                isActive: s.id === newActiveId,
                bounds: s.bounds,
                visibilityRatio: Math.round(s.visibilityRatio * 100) / 100
            }))
        });
    }, [stableSectionIds, sectionIndexMap, getEffectiveOffset, offsetRatio, getSectionBounds, containerElement]);

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

        const handleScroll = (): void => {
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
            }, debounceMs);
        };

        const handleResize = (): void => {
            scheduleCalculate();
        };

        calculateActiveSection();

        const deferredRecalcId = setTimeout(() => {
            calculateActiveSection();
        }, 0);

        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            clearTimeout(deferredRecalcId);
            scrollTarget.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
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
            scrollCleanupRef.current?.();
            isThrottled.current = false;
            hasPendingScroll.current = false;
            isProgrammaticScrolling.current = false;
        };
    }, [calculateActiveSection, debounceMs, containerElement]);

    if (debug) {
        return {
            activeId,
            registerRef,
            scrollToSection,
            sectionProps,
            navProps,
            debugInfo
        };
    }

    return {
        activeId,
        registerRef,
        scrollToSection,
        sectionProps,
        navProps
    };
}

export default useScrowl;
