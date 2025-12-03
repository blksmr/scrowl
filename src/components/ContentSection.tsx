import { ReactNode } from "react";

interface ContentSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  registerRef: (id: string) => (el: HTMLElement | null) => void;
  isActive?: boolean;
}

export function ContentSection({ id, title, children, registerRef, isActive }: ContentSectionProps) {
  return (
    <section
      id={id}
      data-scrollspy-id={id}
      ref={registerRef(id)}
      className={`relative min-h-[400px] py-12 border-b border-border last:border-b-0 scroll-mt-4 transition-all duration-300 ${
        isActive ? "ring-2 ring-debug-content ring-offset-2 ring-offset-background" : ""
      }`}
    >
      {/* Debug Label: Section ID + Active State */}
      <div className={`absolute -top-3 right-0 z-50 flex items-center gap-1 px-2 py-0.5 text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-lg transition-colors ${
        isActive ? "bg-debug-active" : "bg-debug-content/60"
      }`}>
        <span>Section: {id}</span>
        {isActive && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px]">
            ACTIVE
          </span>
        )}
      </div>
      <h2 className="text-3xl font-bold mb-6 text-foreground">{title}</h2>
      <div className="prose prose-slate max-w-none text-foreground/80">{children}</div>
    </section>
  );
}
