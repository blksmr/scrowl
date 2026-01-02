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

export type ScrollSpyOptions = {
    offset?: number | 'auto';
    offsetRatio?: number;
    debounceMs?: number;
};

type ScrollSpyOptionsWithDebug = ScrollSpyOptions & {
    debug: true;
};

type ScrollSpyOptionsWithoutDebug = ScrollSpyOptions & {
    debug?: false;
};

export type UseScrollSpyReturn = {
    activeId: string | null;
    registerRef: (id: string) => (el: HTMLElement | null) => void;
    scrollToSection: (id: string) => void;
};

export type UseScrollSpyReturnWithDebug = UseScrollSpyReturn & {
    debugInfo: DebugInfo;
};

type SectionScore = {
    id: string;
    score: number;
    visibilityRatio: number;
    distanceFromTrigger: number;
    isInViewport: boolean;
    bounds: SectionBounds;
};

const detectTopOverlayHeight = (): number => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.ts:69',message:'detectTopOverlayHeight entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    let maxBottom = 0;
    const allElements = document.querySelectorAll('*');

    for (const el of allElements) {
        if (el === document.documentElement || el === document.body) continue;

        const htmlEl = el as HTMLElement;

        if (htmlEl.id === 'scrollspy-debug-root') continue;

        const style = window.getComputedStyle(el);
        const position = style.position;

        if (position !== 'fixed' && position !== 'sticky') continue;

        const zIndex = parseInt(style.zIndex, 10);
        if (!isNaN(zIndex) && zIndex >= 9998) continue;

        let parent = htmlEl.parentElement;
        let isDebugElement = false;
        while (parent && parent !== document.body) {
            if (parent.id === 'scrollspy-debug-root') {
                isDebugElement = true;
                break;
            }
            parent = parent.parentElement;
        }
        if (isDebugElement) continue;

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.ts:99',message:'before getBoundingClientRect in detectTopOverlayHeight',data:{hasId:!!htmlEl.id,id:htmlEl.id||'NO_ID',tagName:el.tagName,nodeType:el.nodeType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const rect = el.getBoundingClientRect();

        if (rect.top >= 0 && rect.top <= 50 && rect.height > 0 && rect.width > 0) {
            maxBottom = Math.max(maxBottom, rect.bottom);
        }
    }

    return maxBottom;
};

export function useScrollSpy(
    sectionIds: string[],
    containerRef?: RefObject<HTMLElement> | null,
    options?: ScrollSpyOptionsWithDebug
): UseScrollSpyReturnWithDebug;

export function useScrollSpy(
    sectionIds: string[],
    containerRef?: RefObject<HTMLElement> | null,
    options?: ScrollSpyOptionsWithoutDebug
): UseScrollSpyReturn;

export function useScrollSpy(
    sectionIds: string[],
    containerRef: RefObject<HTMLElement> | null = null,
    options: ScrollSpyOptions & { debug?: boolean } = {}
): UseScrollSpyReturn | UseScrollSpyReturnWithDebug {
    const { offset = 'auto', offsetRatio = 0.08, debounceMs = 10, debug = false } = options;

    const sectionIdsKey = sectionIds.join(',');
    const stableSectionIds = useMemo(() => sectionIds, [sectionIdsKey]);

    const [activeId, setActiveId] = useState<string | null>(stableSectionIds[0] || null);
    const [debugInfo, setDebugInfo] = useState<DebugInfo>({
        scrollY: 0,
        triggerLine: 0,
        viewportHeight: 0,
        offsetBase: 0,
        offsetEffective: 0,
        sections: []
    });
    const [detectedOffset, setDetectedOffset] = useState<number>(() => {
        if (offset === 'auto' && typeof window !== 'undefined') {
            return detectTopOverlayHeight();
        }
        return 0;
    });

    const refs = useRef<Record<string, HTMLElement | null>>({});
    const activeIdRef = useRef<string | null>(stableSectionIds[0] || null);
    const lastScrollY = useRef<number>(0);
    const lastActiveScore = useRef<number>(0);
    const rafId = useRef<number | null>(null);
    const isThrottled = useRef<boolean>(false);
    const throttleTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasPendingScroll = useRef<boolean>(false);
    const debugRef = useRef<boolean>(debug);
    const debugInfoRef = useRef<DebugInfo>(debugInfo);

    debugRef.current = debug;

    const getEffectiveOffset = useCallback((): number => {
        if (offset === 'auto') {
            return detectedOffset || detectTopOverlayHeight();
        }
        return offset;
    }, [offset, detectedOffset]);

    useLayoutEffect(() => {
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

    useLayoutEffect(() => {
        if (offset !== 'auto') return;

        const timeoutId = setTimeout(() => {
            const detected = detectTopOverlayHeight();
            setDetectedOffset(detected);
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [offset, debug]);

    const registerRef = useCallback((id: string) => (el: HTMLElement | null) => {
        if (el) {
            refs.current[id] = el;
        } else {
            delete refs.current[id];
        }
    }, []);

    const scrollToSection = useCallback((id: string): void => {
        const element = refs.current[id];
        if (!element) return;

        const container = containerRef?.current;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.ts:214',message:'before element getBoundingClientRect in scrollToSection',data:{id,hasId:!!element.id,elementId:element.id||'NO_ID'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const elementRect = element.getBoundingClientRect();
        const effectiveOffset = getEffectiveOffset() + 10;

        if (container) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.ts:218',message:'before container getBoundingClientRect in scrollToSection',data:{hasId:!!container.id,id:container.id||'NO_ID',tagName:container.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
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

        activeIdRef.current = id;
        setActiveId(id);
    }, [containerRef, getEffectiveOffset]);

    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    const getSectionBounds = useCallback((): SectionBounds[] => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.ts:240',message:'getSectionBounds entry',data:{hasContainer:!!containerRef?.current,sectionIds:stableSectionIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const container = containerRef?.current;
        const scrollTop = container ? container.scrollTop : window.scrollY;
        // #region agent log
        if(container){fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.ts:243',message:'before container getBoundingClientRect',data:{hasId:!!container.id,id:container.id||'NO_ID',tagName:container.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});}
        // #endregion
        const containerTop = container ? container.getBoundingClientRect().top : 0;

        return stableSectionIds
            .map((id) => {
                const el = refs.current[id];
                if (!el) return null;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.ts:249',message:'before section getBoundingClientRect',data:{id,hasId:!!el.id,elementId:el.id||'NO_ID',tagName:el.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
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
    }, [stableSectionIds, containerRef]);

    const calculateActiveSection = useCallback(() => {
        const container = containerRef?.current;
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
                // Only update if info actually changed to avoid unnecessary re-renders
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

            const sectionIndex = stableSectionIds.indexOf(section.id);
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
                distanceFromTrigger: 0,
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
                lastActiveScore.current = bestCandidate.score;
                setActiveId((prev) => (prev !== newActiveId ? newActiveId : prev));
            } else {
                newActiveId = currentActiveId;
                lastActiveScore.current = currentScore.score;
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
    }, [stableSectionIds, getEffectiveOffset, offsetRatio, getSectionBounds, containerRef]);

    useEffect(() => {
        const container = containerRef?.current;
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
            isThrottled.current = false;
            hasPendingScroll.current = false;
        };
    }, [calculateActiveSection, debounceMs, containerRef]);

    if (debug) {
        return {
            activeId,
            registerRef,
            scrollToSection,
            debugInfo
        };
    }

    return {
        activeId,
        registerRef,
        scrollToSection
    };
}

export default useScrollSpy;
