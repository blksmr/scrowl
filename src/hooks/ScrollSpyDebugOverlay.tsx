import { useEffect, useRef, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import type { DebugInfo } from './useScrollSpy';

export type ScrollSpyDebugOverlayProps = {
    debugInfo: DebugInfo;
    activeId: string | null;
    containerRef?: RefObject<HTMLElement> | null;
};

const COLORS = {
    bg: '#0c0c0c',
    border: '#2a2a2a',
    textPrimary: '#d4d4d4',
    textSecondary: '#666',
    active: '#4ade80'
};

export function ScrollSpyDebugOverlay({
    debugInfo,
    activeId,
    containerRef
}: ScrollSpyDebugOverlayProps): React.ReactPortal | null {
    const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
    const sectionRefsMap = useRef<Map<string, HTMLElement>>(new Map());

    useEffect(() => {
        const container = document.createElement('div');
        container.id = 'scrollspy-debug-root';
        document.body.appendChild(container);
        setPortalContainer(container);

        return () => {
            container.remove();
            setPortalContainer(null);
        };
    }, []);

    // Memoize section IDs to avoid unnecessary re-renders
    const sectionIdsString = useMemo(() => {
        return debugInfo.sections.map(s => s.id).sort().join(',');
    }, [debugInfo.sections]);
    
    useEffect(() => {
        // Only update refs when section IDs actually change
        const sections = debugInfo.sections;
        const currentIds = new Set(sectionRefsMap.current.keys());
        const newIds = new Set(sections.map(s => s.id));
        
        // Remove refs for sections that no longer exist
        currentIds.forEach(id => {
            if (!newIds.has(id)) {
                sectionRefsMap.current.delete(id);
            }
        });
        
        // Add/update refs for current sections
        sections.forEach((section) => {
            const el = document.getElementById(section.id);
            if (el) {
                sectionRefsMap.current.set(section.id, el);
            }
        });
    }, [sectionIdsString, debugInfo.sections]);

    useEffect(() => {
        // Copy refs to avoid stale closure issues
        const refsMap = sectionRefsMap.current;
        
        refsMap.forEach((el, id) => {
            const isActive = id === activeId;
            if (isActive) {
                el.style.outline = '1px solid #000';
                el.style.outlineOffset = '-1px';
            } else {
                el.style.outline = '1px dashed #000';
                el.style.outlineOffset = '-1px';
            }
        });

        return () => {
            refsMap.forEach((el) => {
                el.style.outline = '';
                el.style.outlineOffset = '';
            });
        };
    }, [activeId]);

    if (!portalContainer) {
        return null;
    }

    const container = containerRef?.current;
    const containerRect = container?.getBoundingClientRect();
    const triggerLineTop = containerRect
        ? containerRect.top + debugInfo.offsetEffective
        : debugInfo.offsetEffective;

    const content = (
        <>
            <div
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: '#000',
                    zIndex: 9998,
                    pointerEvents: 'none',
                    top: `${triggerLineTop}px`
                }}
            >
                <span
                    style={{
                        position: 'absolute',
                        left: '16px',
                        top: '-18px',
                        background: COLORS.bg,
                        color: COLORS.textSecondary,
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontFamily: 'ui-monospace, monospace',
                        border: `1px solid ${COLORS.border}`
                    }}
                >
                    {`offset: ${Math.round(debugInfo.offsetEffective)}px`}
                </span>
            </div>

            <div
                style={{
                    position: 'fixed',
                    top: '16px',
                    right: '16px',
                    width: '280px',
                    minHeight: '200px',
                    maxHeight: '450px',
                    overflowY: 'auto',
                    background: COLORS.bg,
                    color: COLORS.textPrimary,
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'ui-monospace, "SF Mono", monospace',
                    zIndex: 9999,
                    border: `1px solid ${COLORS.border}`
                }}
            >
                <div
                    style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        paddingBottom: '12px',
                        marginBottom: '12px'
                    }}
                >
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>
                        ◇ scrollmark debug
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '24px',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${COLORS.border}`
                    }}
                >
                    <div>
                        <div style={{ fontSize: '18px', color: COLORS.textPrimary, fontWeight: '500' }}>
                            {Math.round(debugInfo.scrollY)}
                        </div>
                        <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginTop: '2px' }}>
                            scroll
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', color: COLORS.textPrimary, fontWeight: '500' }}>
                            {Math.round(debugInfo.offsetEffective)}
                        </div>
                        <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginTop: '2px' }}>
                            offset
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {debugInfo.sections.map((section) => (
                        <div
                            key={section.id}
                            style={{
                                background: COLORS.bg,
                                border: `1px solid ${COLORS.border}`,
                                padding: '10px'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: '500',
                                        color: COLORS.textPrimary
                                    }}
                                >
                                    {section.id}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            color: section.isActive ? COLORS.active : COLORS.textSecondary
                                        }}
                                    >
                                        {section.isActive ? 'active' : 'idle'}
                                    </span>
                                    <span style={{ fontSize: '10px', color: COLORS.textSecondary }}>
                                        {section.score}
                                    </span>
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: '10px',
                                    color: COLORS.textSecondary,
                                    marginTop: '4px'
                                }}
                            >
                                {`Visibility: ${Math.round(section.visibilityRatio * 100)}%`}
                            </div>
                            <div
                                style={{
                                    fontSize: '10px',
                                    color: COLORS.textSecondary,
                                    marginTop: '2px'
                                }}
                            >
                                {`Height: ${Math.round(section.bounds.height)}px`}
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        borderTop: `1px solid ${COLORS.border}`,
                        paddingTop: '12px',
                        marginTop: '12px'
                    }}
                >
                    <div style={{ fontSize: '10px', color: COLORS.textSecondary }}>
                        └ Real-time scroll position tracking
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(content, portalContainer);
}

export default ScrollSpyDebugOverlay;
