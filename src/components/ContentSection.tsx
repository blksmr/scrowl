import { ReactNode } from "react";

interface ContentSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  registerRef: (id: string) => (el: HTMLElement | null) => void;
}

export function ContentSection({ id, title, children, registerRef }: ContentSectionProps) {
  return (
    <section
      id={id}
      data-scrollspy-id={id}
      ref={registerRef(id)}
      className="min-h-[400px] py-12 border-b border-border last:border-b-0 scroll-mt-4"
    >
      <h2 className="text-3xl font-bold mb-6 text-foreground">{title}</h2>
      <div className="prose prose-slate max-w-none text-foreground/80">{children}</div>
    </section>
  );
}
