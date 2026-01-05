"use client";

import { Link2Icon } from "@radix-ui/react-icons"

type DemoProps = {
  src: string;
  caption?: string;
};

export function Demo({ src, caption = "" }: DemoProps) {
  const fullSrc = src.startsWith("/") ? src : `/${src}`;

  return (
    <div className="relative">
      <iframe
        src={fullSrc}
        className="relative block w-full aspect-[640/470] overflow-y-auto overflow-x-hidden border border-border rounded-lg isolate no-scrollbar"
        title={caption}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {caption && (
          <span className="px-2 bg-black/20 backdrop-blur-sm text-white rounded-full text-xs select-none">
            {caption}
          </span>
        )}
      <a
        href={fullSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 bg-fd-background/80 backdrop-blur-sm border border-border rounded-lg text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-background transition-colors"
        title="Ouvrir dans un nouvel onglet"
        >
        <Link2Icon />
      </a>
        </div>
    </div>
  );
}
