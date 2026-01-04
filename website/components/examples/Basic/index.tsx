"use client";

import { useScrowl } from "scrowl";
import { useNavProgress } from "./useNavProgress";

const SECTIONS = [
  { id: "desert", label: "Desert", caption: "desert_dunes_offroad_tracks_wide_sky_16x9.jpg", color: "#c6bdac" },
  { id: "mountains", label: "Mountains", caption: "mountain_peak_moody_clouds_dark_tones.jpg", color: "#9ba3ac" },
  { id: "forest", label: "Forest", caption: "dense_conifer_forest_pattern_aerial_view.jpg", color: "#7e8239" },
  { id: "coast", label: "Coast", caption: "ocean_waves_golden_hour_sunset_reflections.jpg", color: "#dba769" },
] as const;

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function Basic() {
  const { sectionProps, navProps, debugInfo } = useScrowl(SECTION_IDS, null, {
    offset: 0,
    debug: true,
  });

  const { getIndicatorStyle } = useNavProgress(SECTION_IDS, debugInfo);

  return (
    <div className="relative min-h-screen bg-white">
      <nav className="fixed right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-end gap-3">
        {SECTIONS.map(({ id }) => (
          <button
            key={id}
            {...navProps(id)}
            className="group flex items-center gap-3"
          >
            <span
              className="block h-0.5 rounded-full bg-black transition-[width,opacity] duration-100 ease-out group-hover:opacity-70"
              style={getIndicatorStyle(id)}
            />
          </button>
        ))}
      </nav>

      <main>
        {SECTIONS.map(({ id, label, caption, color }) => (
          <section
            key={id}
            {...sectionProps(id)}
            className="flex items-center justify-center p-12 relative flex-col gap-2"
            style={{ minHeight: "100vh" }}
          >
            <div
              className="relative pointer-events-none select-none w-full max-w-[430px] overflow-hidden rounded-lg aspect-[3/2]"
            >
              <div className="absolute inset-0" style={{ backgroundColor: color }}>
                <img src={`/images/${id}.jpg`} alt={label} className="absolute w-full h-full left-0 right-0 top-0 bottom-0 inset-0 object-cover" />
              </div>
            </div>
            <span className="text-black/30 text-[10px] font-mono">{caption}</span>
          </section>
        ))}
      </main>
    </div>
  );
}
