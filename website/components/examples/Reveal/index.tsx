"use client";

import { useDomet } from "domet";

const SECTIONS = [
  { id: "hero", title: "Hero Section" },
  { id: "features", title: "Features" },
  { id: "testimonials", title: "Testimonials" },
  { id: "pricing", title: "Pricing" },
  { id: "cta", title: "Call to Action" },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function Reveal() {
  const { sections, register } = useDomet({
    ids: SECTION_IDS,
    tracking: { threshold: 0.3 },
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <main>
        {SECTIONS.map(({ id, title }) => {
          const sectionState = sections[id];
          const visibility = sectionState?.visibility ?? 0;
          const inView = sectionState?.inView ?? false;

          const opacity = Math.min(1, visibility * 2);
          const translateY = inView ? Math.max(0, (1 - visibility) * 40) : 40;
          const scale = 0.95 + visibility * 0.05;

          return (
            <section
              key={id}
              {...register(id)}
              className="flex min-h-screen items-center justify-center p-8"
            >
              <div
                className="w-full max-w-2xl rounded border border-dashed border-gray-300 bg-white p-12 transition-[opacity,transform] duration-500 ease-out"
                style={{
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                }}
              >
                <h2 className="mb-6 text-2xl font-medium text-gray-900">
                  {title}
                </h2>

                <div className="mb-8 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-4 rounded bg-gray-100 transition-[width] duration-300"
                      style={{
                        width: `${Math.min(100, visibility * 100 + 20 + i * 5)}%`,
                        transitionDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between rounded bg-gray-50 p-4 text-xs">
                  <div className="flex gap-6">
                    <div>
                      <span className="text-gray-400">Visibility: </span>
                      <span className="font-mono text-gray-700">
                        {Math.round(visibility * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">In View: </span>
                      <span className="font-mono text-gray-700">
                        {inView ? "yes" : "no"}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400">{id}</div>
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
