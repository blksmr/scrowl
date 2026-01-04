"use client";

type IframeProps = {
  src: string;
};

export function Iframe({ src }: IframeProps) {
  return (
    <iframe
      src={src}
      className="relative block w-full aspect-[640/470] overflow-y-auto overflow-x-hidden border border-border rounded-lg isolate no-scrollbar"
      title="Example"
    />
  );
}
