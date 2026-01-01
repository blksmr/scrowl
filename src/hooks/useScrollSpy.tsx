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
            const topPx = parseFloat(topValue) || 0;
            
            // For fixed elements at the top
            if (position === 'fixed') {
                // Check if element is currently at/near the top
                if (rect.top <= 20 && rect.height > 0) {
                    maxHeight = Math.max(maxHeight, rect.bottom);
                }
                // Also check if element has top: 0 or similar (will be at top)
                else if (topPx <= 20 && rect.height > 0) {
                    maxHeight = Math.max(maxHeight, rect.height + topPx);
                }
            }
            
            // For sticky elements with top: 0 (or similar), always use their height
            // because they WILL be at top when user scrolls, regardless of current position
            if (position === 'sticky' && topPx <= 20) {
                // Use offsetHeight for more reliable height detection (includes padding)
                const elementHeight = (el as HTMLElement).offsetHeight || rect.height;
                if (elementHeight > 0) {
                    // For sticky, we use the height + top offset (where it will stick)
                    maxHeight = Math.max(maxHeight, elementHeight + topPx);
                }
            }
        }
    }
    
    // Fallback: check using elementsFromPoint (only if nothing found above)
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
                        if (rect.top <= 10 && rect.height > 0) {
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
        top: '16px',
        right: '16px',
        width: '260px',
        maxHeight: '420px',
        overflowY: 'auto' as const,
        background: 'linear-gradient(145deg, rgba(24, 24, 27, 0.98), rgba(17, 17, 20, 0.98))',
        backdropFilter: 'blur(12px)',
        color: '#e4e4e7',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '11px',
        fontFamily: '"SF Mono", "Fira Code", "JetBrains Mono", monospace',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
    },
    triggerLine: {
        position: 'fixed' as const,
        left: 0,
        right: 0,
        height: '1px',
        backgroundColor: '#a855f7',
        opacity: 0.6,
        zIndex: 9998,
        pointerEvents: 'none' as const
    },
    sectionActive: {
        outline: '2px solid rgba(168, 85, 247, 0.6)',
        outlineOffset: '-2px'
    },
    sectionInactive: {
        outline: '1px dashed rgba(168, 85, 247, 0.25)',
        outlineOffset: '-1px'
    },
    header: {
        fontWeight: '600' as const,
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '12px',
        letterSpacing: '0.02em'
    },
    stat: {
        display: 'flex' as const,
        justifyContent: 'space-between' as const,
        marginBottom: '6px',
        padding: '4px 0'
    },
    sectionItem: {
        padding: '10px',
        marginBottom: '6px',
        borderRadius: '8px',
        transition: 'all 0.15s ease'
    },
    activeSection: {
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.08))',
        border: '1px solid rgba(168, 85, 247, 0.4)'
    },
    inactiveSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
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
    // Initialize with immediate detection to avoid timing issues
    const [detectedOffset, setDetectedOffset] = useState<number>(() => {
        if (offset === 'auto' && typeof window !== 'undefined') {
            return detectTopOverlayHeight();
        }
        return 0;
    });

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
    const lastDebugUpdate = useRef<number>(0);
    const debugUpdateTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get effective offset (auto-detect or manual)
    const getEffectiveOffset = useCallback((): number => {
        if (offset === 'auto') {
            return detectedOffset || detectTopOverlayHeight();
        }
        return offset;
    }, [offset, detectedOffset]);

    // Detect overlay elements on mount and resize
    useLayoutEffect(() => {
        if (offset !== 'auto') return;

        const updateDetectedOffset = () => {
            const detected = detectTopOverlayHeight();
            setDetectedOffset(detected);
        };

        // Initial detection: useLayoutEffect runs after DOM layout, so detection is immediate
        updateDetectedOffset();
        
        // Re-detect on resize (debounced)
        let resizeTimeout: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateDetectedOffset, 100);
        };
        window.addEventListener('resize', handleResize);
        
        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', handleResize);
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

    // Throttled debug info update at 20fps (50ms interval)
    const throttledSetDebugInfo = useCallback((info: DebugInfo) => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastDebugUpdate.current;
        
        if (timeSinceLastUpdate >= 50) {
            // Update immediately if enough time has passed
            lastDebugUpdate.current = now;
            setDebugInfo(info);
        } else {
            // Schedule update for later
            if (debugUpdateTimeoutId.current) {
                clearTimeout(debugUpdateTimeoutId.current);
            }
            debugUpdateTimeoutId.current = setTimeout(() => {
                lastDebugUpdate.current = Date.now();
                setDebugInfo(info);
                debugUpdateTimeoutId.current = null;
            }, 50 - timeSinceLastUpdate);
        }
    }, []);

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
                throttledSetDebugInfo({
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
                throttledSetDebugInfo({
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
            throttledSetDebugInfo({
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
    }, [sectionIds, getEffectiveOffset, offsetRatio, getSectionBounds, isDebugEnabled, containerRef, throttledSetDebugInfo]);

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
            if (debugUpdateTimeoutId.current) {
                clearTimeout(debugUpdateTimeoutId.current);
                debugUpdateTimeoutId.current = null;
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
                        left: '16px',
                        top: '-24px',
                        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '500',
                        fontFamily: '"SF Mono", monospace',
                        boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)'
                    } }>
                        { `↓ ${Math.round(debugInfo.offsetEffective)}px` }
                    </span>
                </div>
                <div style={ DEBUG_STYLES.overlay }>
                    <div style={ DEBUG_STYLES.header }>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: '#a855f7',
                                boxShadow: '0 0 8px rgba(168, 85, 247, 0.5)'
                            }} />
                            { 'paradice' }
                            <span style={{ opacity: 0.5, fontWeight: 'normal' }}>debug</span>
                        </div>
                    </div>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '8px', 
                        marginBottom: '12px',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '8px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                                { Math.round(debugInfo.scrollY) }
                            </div>
                            <div style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                scroll
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#a855f7' }}>
                                { Math.round(debugInfo.offsetEffective) }
                            </div>
                            <div style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                offset
                            </div>
                        </div>
                    </div>

                    <div style={{ 
                        fontSize: '9px', 
                        opacity: 0.4, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em',
                        marginBottom: '8px',
                        marginTop: '4px'
                    }}>
                        Sections
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
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: '6px'
                                }}>
                                    <span style={{ 
                                        fontWeight: section.isActive ? '600' : '400',
                                        color: section.isActive ? '#fff' : '#a1a1aa'
                                    }}>
                                        { section.isActive && <span style={{ color: '#a855f7', marginRight: '4px' }}>●</span> }
                                        { section.id }
                                    </span>
                                    <span style={{ 
                                        fontSize: '10px',
                                        color: section.isActive ? '#a855f7' : '#71717a',
                                        fontWeight: '500'
                                    }}>
                                        { section.score }
                                    </span>
                                </div>
                                <div style={{ 
                                    height: '3px', 
                                    background: 'rgba(255,255,255,0.1)', 
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${Math.min(section.visibilityRatio * 100, 100)}%`,
                                        background: section.isActive 
                                            ? 'linear-gradient(90deg, #a855f7, #7c3aed)' 
                                            : 'rgba(255,255,255,0.2)',
                                        borderRadius: '2px',
                                        transition: 'width 50ms ease-out',
                                        willChange: 'width'
                                    }} />
                                </div>
                                <div style={{ 
                                    fontSize: '9px', 
                                    opacity: 0.5, 
                                    marginTop: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>{ `${Math.round(section.visibilityRatio * 100)}% visible` }</span>
                                    <span>{ `${Math.round(section.bounds.height)}px` }</span>
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
