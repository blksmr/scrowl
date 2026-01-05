"use client";

import { OpenExternal } from "@/components/icons/OpenExternal";

type DemoProps = {
  src: string;
};

export function Demo({ src }: DemoProps) {
  const fullSrc = src.startsWith("/") ? src : `/${src}`;

  return (
    <div className="relative">
      <iframe
        src={fullSrc}
        className="relative block w-full aspect-[640/470] overflow-y-auto overflow-x-hidden border border-border rounded-lg isolate no-scrollbar"
        title="Example"
      />
      <a
        href={fullSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 p-1 bg-fd-background/80 backdrop-blur-sm border border-border rounded-md text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-background transition-colors"
        title="Ouvrir dans un nouvel onglet"
      >
        <OpenExternal />
      </a>
    </div>
  );
}
