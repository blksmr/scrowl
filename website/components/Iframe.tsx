"use client";

import { OpenExternal } from "@/components/icons/OpenExternal";

type IframeProps = {
  src: string;
};

export function Iframe({ src }: IframeProps) {
  return (
    <div className="relative">
      <iframe
        src={src}
        className="relative block w-full aspect-[640/470] overflow-y-auto overflow-x-hidden border border-border rounded-lg isolate no-scrollbar"
        title="Example"
      />
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 p-1 bg-fd-background/80 backdrop-blur-sm border border-border rounded-full text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-background transition-colors"
        title="Ouvrir dans un nouvel onglet"
      >
        <OpenExternal width="16" height="16" />
      </a>
    </div>
  );
}
