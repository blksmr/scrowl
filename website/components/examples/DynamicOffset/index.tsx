"use client";

import { useDomet } from "domet";
import { useRef, useState, useEffect } from "react";

const SECTIONS = [
  { id: "hero", title: "Hero" },
  { id: "features", title: "Features" },
  { id: "pricing", title: "Pricing" },
  { id: "testimonials", title: "Testimonials" },
  { id: "contact", title: "Contact" },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);
const NAV_HEIGHT_EXPANDED = 80;
const NAV_HEIGHT_COLLAPSED = 48;

function snapToTarget(height: number): number {
  const midpoint = (NAV_HEIGHT_EXPANDED + NAV_HEIGHT_COLLAPSED) / 2;
  return height > midpoint ? NAV_HEIGHT_EXPANDED : NAV_HEIGHT_COLLAPSED;
}

export function DynamicOffset() {
  const navRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState(NAV_HEIGHT_EXPANDED);

  const { active, scroll, sections, register, scrollTo } = useDomet({
    ids: SECTION_IDS,
    tracking: { offset: navHeight },
  });

  const isCollapsed = scroll.y > 100;

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(([entry]) => {
      const snapped = snapToTarget(entry.contentRect.height);
      setNavHeight(snapped);
    });
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 transition-all duration-300"
        style={{ height: isCollapsed ? NAV_HEIGHT_COLLAPSED : NAV_HEIGHT_EXPANDED }}
      >
        <div className="h-full max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className={`font-bold transition-all duration-300 ${isCollapsed ? "text-lg" : "text-xl"}`}>
            Dynamic Nav
          </div>

          <div className="flex items-center gap-1">
            {SECTIONS.map(({ id, title }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id, { offset: navHeight })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active === id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {title}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-gray-400 w-20 text-right">
            offset: {navHeight}px
          </div>
        </div>

        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        )}
      </nav>

      <main style={{ paddingTop: NAV_HEIGHT_EXPANDED }}>
        {SECTIONS.map(({ id, title }, index) => {
          const sectionState = sections[id];
          const isActive = active === id;

          return (
            <section
              key={id}
              {...register(id)}
              className={`min-h-[80vh] p-8 border-b border-gray-100 transition-colors duration-300 ${
                isActive ? "bg-blue-50/30" : ""
              }`}
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className={`text-3xl font-bold transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-800"
                  }`}>
                    {title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm">
                    {sectionState?.inView && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        In View
                      </span>
                    )}
                    <span className="font-mono text-gray-400">
                      {Math.round((sectionState?.progress ?? 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {[...Array(4 + index)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-5/6" />
                      <div className="h-4 bg-gray-100 rounded w-4/6" />
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-2">Section Debug</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Visibility:</span>{" "}
                      <span className="font-mono">{Math.round((sectionState?.visibility ?? 0) * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Progress:</span>{" "}
                      <span className="font-mono">{Math.round((sectionState?.progress ?? 0) * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Active:</span>{" "}
                      <span className={`font-mono ${sectionState?.active ? "text-blue-600" : ""}`}>
                        {sectionState?.active ? "yes" : "no"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm">
        <div className="text-xs text-gray-500 mb-2">Tracking Info</div>
        <div className="space-y-1 font-mono text-xs">
          <div>scroll.y: <span className="text-blue-600">{Math.round(scroll.y)}px</span></div>
          <div>scroll.progress: <span className="text-blue-600">{(scroll.progress * 100).toFixed(1)}%</span></div>
          <div>scroll.trackingOffset: <span className="text-blue-600">{scroll.trackingOffset}px</span></div>
          <div>navHeight (state): <span className="text-green-600">{navHeight}px</span></div>
          <div>isCollapsed: <span className={isCollapsed ? "text-orange-600" : "text-gray-400"}>{String(isCollapsed)}</span></div>
        </div>
      </div>
    </div>
  );
}
