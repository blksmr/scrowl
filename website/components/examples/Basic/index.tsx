"use client";

import { useDomet } from "domet";
import Image from "next/image";
import { useNavProgress } from "./useNavProgress";

const SECTIONS = [
  {
    id: "desert",
    label: "Desert",
    caption: "desert_dunes_offroad_tracks_wide_sky_16x9.jpg",
    color: "#c6bdac",
  },
  {
    id: "mountains",
    label: "Mountains",
    caption: "mountain_peak_moody_clouds_dark_tones.jpg",
    color: "#9ba3ac",
  },
  {
    id: "forest",
    label: "Forest",
    caption: "dense_conifer_forest_pattern_aerial_view.jpg",
    color: "#7e8239",
  },
  {
    id: "coast",
    label: "Coast",
    caption: "ocean_waves_golden_hour_sunset_reflections.jpg",
    color: "#dba769",
  },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function Basic() {
  const { register, link, scroll, sections } = useDomet({
    ids: SECTION_IDS,
  });

  const { getIndicatorStyle } = useNavProgress(SECTION_IDS, scroll, sections);

  return (
    <div className="relative min-h-screen bg-white">
      <nav className="fixed right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-end gap-3">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            {...link(id)}
            aria-label={`Go to ${label}`}
            className="group flex items-center gap-3"
          >
            <span
              className="block h-0.5 rounded-full bg-black transition-opacity will-change-[opacity] ease-out group-hover:opacity-70"
              style={getIndicatorStyle(id)}
            />
          </button>
        ))}
      </nav>

      <main>
        {SECTIONS.map(({ id, label, caption, color }, index) => (
          <section
            key={id}
            {...register(id)}
            className="flex items-center justify-center p-12 relative flex-col gap-2 min-h-screen"
          >
            <div className="relative pointer-events-none select-none w-full max-w-[500px] overflow-hidden rounded-lg aspect-[3/2]">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: color }}
              >
                <Image
                  src={`/images/${id}.jpg`}
                  alt={label}
                  fill
                  sizes="(max-width: 500px) 100vw, 500px"
                  priority={index === 0}
                  onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
                  className="object-cover opacity-0 transition-opacity duration-500 ease-out"
                />
              </div>
            </div>
            <span className="text-black/30 text-[10px] font-mono">
              {caption}
            </span>
          </section>
        ))}
      </main>
    </div>
  );
}
