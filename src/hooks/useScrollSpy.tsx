// Misc
import {
    useRef,
    useState,
    useEffect,
    useCallback,
    useLayoutEffect
}                            from 'react';
import { createRoot }        from 'react-dom/client';
import type { RefObject }    from 'react';
import type { Root }         from 'react-dom/client';

const __DEV__ = import.meta.env.DEV;

type ScrollSpyOptions = {
    offset?: number | 'auto';
    offsetRatio?: number;
    debounceMs?: number;
    debug?: boolean;
};

/**
 * Detects fixed/sticky elements at the top of the viewport that could overlap content.
 * Returns the bottom edge of the lowest overlapping element.
 * Also considers sticky elements that would be at top when scrolled (top: 0).
 */
const detectTopOverlayHeight = (): number => {
    let maxHeight = 0;
    
    // Find all fixed/sticky elements in the DOM
    const allElements = document.querySelectorAll('*');
    
    for (const el of allElements) {
        if (el === document.documentElement || el === document.body) continue;
        
        const style = window.getComputedStyle(el);
        const position = style.position;
        
        if (position === 'fixed' || position === 'sticky') {
            const rect = el.getBoundingClientRect();
            const topValue = style.top;
            
            // For fixed elements at the top
            if (position === 'fixed' && rect.top <= 20 && rect.height > 0) {
                maxHeight = Math.max(maxHeight, rect.bottom);
            }
            
            // For sticky elements with top: 0 (or similar), use their height
            // because they WILL be at top when user scrolls
            if (position === 'sticky') {
                const topPx = parseFloat(topValue) || 0;
                // If sticky element would stick near the top
                if (topPx <= 20 && rect.height > 0) {
                    // Use the element's height as the offset it will create
                    maxHeight = Math.max(maxHeight, rect.height + topPx);
                }
            }
        }
    }
    
    // Fallback: check using elementsFromPoint
    if (maxHeight === 0) {
        const viewportWidth = window.innerWidth;
        const sampleX = [viewportWidth * 0.25, viewportWidth * 0.5, viewportWidth * 0.75];
        
        for (const x of sampleX) {
            for (let y = 0; y <= 150; y += 10) {
                const elements = document.elementsFromPoint(x, y);
                
                for (const el of elements) {
                    if (el === document.documentElement || el === document.body) continue;
                    
                    const style = window.getComputedStyle(el);
                    const position = style.position;
                    
                    if (position === 'fixed' || position === 'sticky') {
                        const rect = el.getBoundingClientRect();
                        if (rect.top <= 10) {
                            maxHeight = Math.max(maxHeight, rect.bottom);
                        }
                    }
                }
            }
        }
    }
    
    return maxHeight;
};

/**
 * Checks if a specific element is covered by any fixed/sticky element
 * Returns the height of the covering element(s) or 0 if not covered
 */
const getElementCoverageHeight = (element: HTMLElement): number => {
    const rect = element.getBoundingClientRect();
    
    // Sample points along the top of the element
    const samplePoints = [
        { x: rect.left + 10, y: rect.top + 5 },
        { x: rect.left + rect.width / 2, y: rect.top + 5 },
        { x: rect.right - 10, y: rect.top + 5 }
    ];
    
    let maxCoverage = 0;
    
    for (const point of samplePoints) {
        if (point.x < 0 || point.y < 0) continue;
        
        const elementsAtPoint = document.elementsFromPoint(point.x, point.y);
        const elementIndex = elementsAtPoint.indexOf(element);
        
        // Get elements above this element in the stacking order
        if (elementIndex > 0) {
            for (let i = 0; i < elementIndex; i++) {
                const coveringEl = elementsAtPoint[i];
                const style = window.getComputedStyle(coveringEl);
                
                if (style.position === 'fixed' || style.position === 'sticky') {
                    const coveringRect = coveringEl.getBoundingClientRect();
                    // Calculate how much of the element top is covered
                    const coverage = coveringRect.bottom - rect.top;
                    if (coverage > 0) {
                        maxCoverage = Math.max(maxCoverage, coverage);
                    }
                }
            }
        }
    }
    
    return maxCoverage;
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

type UseScrollSpyReturn = {
    activeId: string | null;
    registerRef: (id: string) => (el: HTMLElement | null) => void;
    scrollToSection: (id: string) => void;
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
const HYSTERESIS_SCORE_MARGIN = 150;

const DEBUG_STYLES = __DEV__ ? {
    overlay: {
        position: 'fixed' as const,
        top: '10px',
        right: '10px',
        width: '300px',
        maxHeight: '400px',
        overflowY: 'auto' as const,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    },
    triggerLine: {
        position: 'fixed' as const,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: 'rgba(255, 0, 0, 0.8)',
        zIndex: 9998,
        pointerEvents: 'none' as const
    },
    sectionActive: {
        outline: '3px solid rgba(0, 255, 0, 0.8)',
        outlineOffset: '-3px'
    },
    sectionInactive: {
        outline: '2px dashed rgba(255, 165, 0, 0.6)',
        outlineOffset: '-2px'
    },
    header: {
        fontWeight: 'bold' as const,
        marginBottom: '8px',
        paddingBottom: '6px',
        borderBottom: '1px solid rgba(255,255,255,0.3)'
    },
    stat: {
        display: 'flex' as const,
        justifyContent: 'space-between' as const,
        marginBottom: '4px'
    },
    sectionItem: {
        padding: '6px',
        marginBottom: '4px',
        borderRadius: '4px'
    },
    activeSection: {
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        border: '1px solid rgba(0, 255, 0, 0.5)'
    },
    inactiveSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    }
} : null;

export const useScrollSpy = (
    sectionIds: string[],
    containerRef: RefObject<HTMLElement> | null = null,
    { offset = 'auto', offsetRatio = 0.08, debounceMs = 10, debug = false }: ScrollSpyOptions = {}
): UseScrollSpyReturn => {

    const isDebugEnabled = __DEV__ && debug;

    // States
    const [activeId, setActiveId] = useState<string | null>(sectionIds[0] || null);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const [detectedOffset, setDetectedOffset] = useState<number>(0);

    // Refs
    const refs = useRef<Record<string, HTMLElement | null>>({});
    const activeIdRef = useRef<string | null>(sectionIds[0] || null);
    const lastScrollY = useRef<number>(0);
    const lastActiveScore = useRef<number>(0);
    const rafId = useRef<number | null>(null);
    const isThrottled = useRef<boolean>(false);
    const throttleTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasPendingScroll = useRef<boolean>(false);
    const debugContainerRef = useRef<HTMLDivElement | null>(null);
    const debugRootRef = useRef<Root | null>(null);

    // Get effective offset (auto-detect or manual)
    const getEffectiveOffset = useCallback((): number => {
        if (offset === 'auto') {
            return detectedOffset || detectTopOverlayHeight();
        }
        return offset;
    }, [offset, detectedOffset]);

    // Detect overlay elements on mount and resize
    useEffect(() => {
        if (offset !== 'auto') return;

        const updateDetectedOffset = () => {
            const detected = detectTopOverlayHeight();
            setDetectedOffset(detected);
        };

        // Initial detection after a short delay for DOM to settle
        const timeoutId = setTimeout(updateDetectedOffset, 100);
        
        // Re-detect on resize
        window.addEventListener('resize', updateDetectedOffset);
        
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateDetectedOffset);
        };
    }, [offset]);

    // Callbacks
    const registerRef = useCallback((id: string) => (el: HTMLElement | null) => {
        if (el) {
            refs.current[id] = el;
        } else {
            delete refs.current[id];
        }
    }, []);

    const scrollToSection = useCallback((id: string): void => {
        const element = refs.current[id];
        if (element) {
            const container = containerRef?.current;
            const elementRect = element.getBoundingClientRect();
            
            // Get the offset - either auto-detected or manual
            const effectiveOffset = offset === 'auto' 
                ? detectTopOverlayHeight() + 10 // Add small padding
                : offset;
            
            if (container) {
                // Container-based scrolling
                const containerRect = container.getBoundingClientRect();
                const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
                container.scrollTo({
                    top: relativeTop - effectiveOffset,
                    behavior: 'smooth'
                });
            } else {
                // Window-based scrolling
                const absoluteTop = elementRect.top + window.scrollY;
                window.scrollTo({
                    top: absoluteTop - effectiveOffset,
                    behavior: 'smooth'
                });
            }
            
            activeIdRef.current = id;
            setActiveId(id);
        }
    }, [containerRef, offset]);

    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    const getSectionBounds = useCallback((): SectionBounds[] => {
        const container = containerRef?.current;
        
        // Use window-based scrolling when no container is provided
        const scrollTop = container ? container.scrollTop : window.scrollY;
        const containerTop = container ? container.getBoundingClientRect().top : 0;

        return sectionIds
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
    }, [sectionIds, containerRef]);

    const calculateActiveSection = useCallback(() => {
        const container = containerRef?.current;
        
        // Use window-based values when no container is provided
        const currentActiveId = activeIdRef.current;
        const scrollY = container ? container.scrollTop : window.scrollY;
        const viewportHeight = container ? container.clientHeight : window.innerHeight;
        const scrollHeight = container ? container.scrollHeight : document.documentElement.scrollHeight;
        const scrollDirection = scrollY > lastScrollY.current ? 'down' : 'up';
        lastScrollY.current = scrollY;

        const sections = getSectionBounds();
        if (sections.length === 0) return;

        // Get base offset - either auto-detected or manual
        const baseOffset = getEffectiveOffset();
        const effectiveOffset = Math.max(baseOffset, viewportHeight * offsetRatio);
        const triggerLine = scrollY + effectiveOffset;
        const viewportTop = scrollY;
        const viewportBottom = scrollY + viewportHeight;

        const buildDebugSections = (activeIdParam: string): DebugInfo['sections'] => sections.map((section) => {
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

        const isAtBottom = scrollY + viewportHeight >= scrollHeight - 5;
        if (isAtBottom && sectionIds.length > 0) {
            const lastId = sectionIds[sectionIds.length - 1];
            activeIdRef.current = lastId;
            setActiveId((prev) => (prev !== lastId ? lastId : prev));
            if (isDebugEnabled) {
                setDebugInfo({
                    scrollY,
                    triggerLine,
                    viewportHeight,
                    offsetBase: baseOffset,
                    offsetEffective: effectiveOffset,
                    sections: buildDebugSections(lastId)
                });
            }
            return;
        }

        const isAtTop = scrollY <= 5;
        if (isAtTop && sectionIds.length > 0) {
            const firstId = sectionIds[0];
            activeIdRef.current = firstId;
            setActiveId((prev) => (prev !== firstId ? firstId : prev));
            if (isDebugEnabled) {
                setDebugInfo({
                    scrollY,
                    triggerLine,
                    viewportHeight,
                    offsetBase: baseOffset,
                    offsetEffective: effectiveOffset,
                    sections: buildDebugSections(firstId)
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
                score += 1000 + (visibilityRatio * 500);
            } else if (isInViewport) {
                score += visibleInViewportRatio * 800;
            }

            const sectionIndex = sectionIds.indexOf(section.id);
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

            const shouldSwitch = !currentScore
                || !currentScore.isInViewport
                || bestCandidate.score > currentScore.score + HYSTERESIS_SCORE_MARGIN
                || bestCandidate.id === currentActiveId;

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

        if (isDebugEnabled) {
            setDebugInfo({
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
        }
    }, [sectionIds, getEffectiveOffset, offsetRatio, getSectionBounds, isDebugEnabled, containerRef]);

    // Effects
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

        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
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

    useEffect(() => {
        if (!isDebugEnabled || !DEBUG_STYLES) return;

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
                    el.style.outline = '';
                    el.style.outlineOffset = '';
                }
            });
        };
    }, [isDebugEnabled, activeId]);

    useLayoutEffect(() => {
        if (!isDebugEnabled) return;

        const container = document.createElement('div');
        container.id = 'scrollspy-debug-root';
        document.body.appendChild(container);
        debugContainerRef.current = container;

        const root = createRoot(container);
        debugRootRef.current = root;

        return () => {
            root.unmount();
            container.remove();
            debugContainerRef.current = null;
            debugRootRef.current = null;
        };
    }, [isDebugEnabled]);

    useEffect(() => {
        if (!isDebugEnabled || !debugRootRef.current || !DEBUG_STYLES) return;

        const container = containerRef?.current;
        const containerRect = container?.getBoundingClientRect();
        const triggerLineTop = containerRect && debugInfo
            ? containerRect.top + debugInfo.offsetEffective
            : debugInfo?.offsetEffective || 0;

        const content = debugInfo ? (
            <>
                <div style={ { ...DEBUG_STYLES.triggerLine, top: `${triggerLineTop}px` } }>
                    <span style={ {
                        position: 'absolute',
                        left: '10px',
                        top: '-18px',
                        backgroundColor: 'rgba(255, 0, 0, 0.9)',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px'
                    } }>
                        { `Trigger Line (${Math.round(debugInfo.offsetEffective)}px)` }
                    </span>
                </div>
                <div style={ DEBUG_STYLES.overlay }>
                    <div style={ DEBUG_STYLES.header }>
                        { '🔍 ScrollSpy Debug' }
                    </div>
                    <div style={ DEBUG_STYLES.stat }>
                        <span>{ 'Scroll Y:' }</span>
                        <span>{ `${Math.round(debugInfo.scrollY)}px` }</span>
                    </div>
                    <div style={ DEBUG_STYLES.stat }>
                        <span>{ 'Trigger Line:' }</span>
                        <span>{ `${Math.round(debugInfo.triggerLine)}px` }</span>
                    </div>
                    <div style={ DEBUG_STYLES.stat }>
                        <span>{ 'Viewport Height:' }</span>
                        <span>{ `${debugInfo.viewportHeight}px` }</span>
                    </div>
                    <div style={ DEBUG_STYLES.stat }>
                        <span>{ 'Offset (base):' }</span>
                        <span>{ `${debugInfo.offsetBase}px` }</span>
                    </div>
                    <div style={ DEBUG_STYLES.stat }>
                        <span>{ 'Offset (effective):' }</span>
                        <span style={ { color: debugInfo.offsetEffective > debugInfo.offsetBase ? '#0ff' : '#fff' } }>
                            { `${Math.round(debugInfo.offsetEffective)}px` }
                        </span>
                    </div>
                    <div style={ { ...DEBUG_STYLES.stat, marginTop: '8px', marginBottom: '8px' } }>
                        <span>{ 'Active:' }</span>
                        <span style={ { color: '#0f0' } }>
                            { activeId ? activeId.slice(0, 8) + '...' : 'none' }
                        </span>
                    </div>
                    <div style={ { fontWeight: 'bold', marginBottom: '6px' } }>
                        { 'Sections:' }
                    </div>
                    {
                        debugInfo.sections.map((section) => (
                            <div
                                key={ section.id }
                                style={ {
                                    ...DEBUG_STYLES.sectionItem,
                                    ...(section.isActive
                                        ? DEBUG_STYLES.activeSection
                                        : DEBUG_STYLES.inactiveSection)
                                } }
                            >
                                <div style={ { fontWeight: section.isActive ? 'bold' : 'normal' } }>
                                    { section.isActive ? '✓ ' : '  ' }
                                    { section.id.slice(0, 12) }
                                    { section.id.length > 12 ? '...' : '' }
                                </div>
                                <div style={ { fontSize: '10px', opacity: 0.8, marginLeft: '16px' } }>
                                    { `Score: ${section.score} | Vis: ${Math.round(section.visibilityRatio * 100)}%` }
                                </div>
                                <div style={ { fontSize: '10px', opacity: 0.6, marginLeft: '16px' } }>
                                    { `Top: ${Math.round(section.bounds.top)}px | H: ${Math.round(section.bounds.height)}px` }
                                </div>
                            </div>
                        ))
                    }
                </div>
            </>
        ) : null;

        debugRootRef.current.render(content);
    }, [isDebugEnabled, debugInfo, activeId, containerRef]);

    // Return
    return {
        activeId,
        registerRef,
        scrollToSection
    };
};

export default useScrollSpy;
