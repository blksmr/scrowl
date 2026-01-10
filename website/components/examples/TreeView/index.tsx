"use client";

import { useDomet } from "domet";
import { useState } from "react";

type TreeItem = {
  id: string;
  title: string;
  children?: TreeItem[];
};

const DOCUMENTATION_TREE: TreeItem[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    children: [
      { id: "installation", title: "Installation" },
      { id: "quick-start", title: "Quick Start" },
      { id: "project-structure", title: "Project Structure" },
      { id: "typescript-setup", title: "TypeScript Setup" },
    ],
  },
  {
    id: "core-concepts",
    title: "Core Concepts",
    children: [
      { id: "scroll-tracking", title: "Scroll Tracking" },
      { id: "active-section", title: "Active Section Detection" },
      { id: "visibility-scoring", title: "Visibility Scoring" },
      { id: "hysteresis", title: "Hysteresis Algorithm" },
      { id: "trigger-line", title: "Trigger Line Mechanism" },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    children: [
      { id: "useDomet-hook", title: "useDomet Hook" },
      { id: "options", title: "Configuration Options" },
      { id: "return-values", title: "Return Values" },
      { id: "register-function", title: "register() Function" },
      { id: "link-function", title: "link() Function" },
      { id: "scrollTo-function", title: "scrollTo() Function" },
    ],
  },
  {
    id: "advanced-usage",
    title: "Advanced Usage",
    children: [
      { id: "custom-containers", title: "Custom Scroll Containers" },
      { id: "dynamic-sections", title: "Dynamic Sections" },
      { id: "css-selectors", title: "CSS Selector Mode" },
      { id: "callbacks", title: "Event Callbacks" },
      { id: "performance", title: "Performance Optimization" },
    ],
  },
  {
    id: "recipes",
    title: "Recipes",
    children: [
      { id: "table-of-contents", title: "Table of Contents" },
      { id: "progress-indicator", title: "Progress Indicator" },
      { id: "section-navigation", title: "Section Navigation" },
      { id: "reveal-animations", title: "Reveal Animations" },
      { id: "sticky-headers", title: "Sticky Headers" },
      { id: "parallax-effects", title: "Parallax Effects" },
    ],
  },
  {
    id: "integration",
    title: "Framework Integration",
    children: [
      { id: "nextjs", title: "Next.js" },
      { id: "remix", title: "Remix" },
      { id: "gatsby", title: "Gatsby" },
      { id: "astro", title: "Astro" },
      { id: "vite", title: "Vite" },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    children: [
      { id: "common-issues", title: "Common Issues" },
      { id: "debugging", title: "Debugging Tips" },
      { id: "ssr-issues", title: "SSR Issues" },
      { id: "hydration", title: "Hydration Errors" },
    ],
  },
  {
    id: "migration",
    title: "Migration Guide",
    children: [
      { id: "from-v0", title: "From v0.x" },
      { id: "from-intersection-observer", title: "From Intersection Observer" },
      { id: "from-other-libraries", title: "From Other Libraries" },
    ],
  },
];

function flattenTree(items: TreeItem[]): { id: string; title: string; depth: number; parentId?: string }[] {
  const result: { id: string; title: string; depth: number; parentId?: string }[] = [];

  function traverse(items: TreeItem[], depth: number, parentId?: string) {
    for (const item of items) {
      result.push({ id: item.id, title: item.title, depth, parentId });
      if (item.children) {
        traverse(item.children, depth + 1, item.id);
      }
    }
  }

  traverse(items, 0);
  return result;
}

const FLAT_SECTIONS = flattenTree(DOCUMENTATION_TREE);
const SECTION_IDS = FLAT_SECTIONS.map((s) => s.id);

const LOREM_PARAGRAPHS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt.",
];

function getRandomParagraphs(count: number, seed: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(LOREM_PARAGRAPHS[(seed + i) % LOREM_PARAGRAPHS.length]);
  }
  return result;
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
      <code>{code}</code>
    </pre>
  );
}

function SectionContent({ id, depth }: { id: string; depth: number }) {
  const seed = id.charCodeAt(0) + id.length;
  const paragraphCount = depth === 0 ? 2 : 3 + (seed % 3);
  const paragraphs = getRandomParagraphs(paragraphCount, seed);
  const showCode = seed % 3 === 0;

  const codeExamples: Record<string, string> = {
    installation: `npm install domet
# or
yarn add domet
# or
pnpm add domet`,
    "quick-start": `import { useDomet } from 'domet';

function App() {
  const { active, register, link } = useDomet({
    ids: ['intro', 'features', 'docs'],
  });

  return (
    <div>
      <nav>
        <button {...link('intro')}>Intro</button>
        <button {...link('features')}>Features</button>
        <button {...link('docs')}>Docs</button>
      </nav>
      <section {...register('intro')}>Introduction</section>
      <section {...register('features')}>Features</section>
      <section {...register('docs')}>Documentation</section>
    </div>
  );
}`,
    "useDomet-hook": `const {
  active,     // Current active section ID
  index,      // Index of active section
  progress,   // Overall scroll progress (0-1)
  direction,  // 'up' | 'down' | null
  scroll,     // Detailed scroll state
  sections,   // Per-section state
  ids,        // Array of section IDs
  scrollTo,   // Navigate to section
  register,   // Register section element
  link,       // Create navigation button props
} = useDomet(options);`,
    options: `useDomet({
  ids: ['section-1', 'section-2'],
  // or
  selector: '[data-section]',

  container: containerRef,    // Custom scroll container
  triggerOffset: 100,         // Trigger line offset (px or %)
  threshold: 0.6,             // Visibility threshold
  hysteresis: 150,            // Score margin to resist switching
  behavior: 'smooth',         // Scroll behavior
  throttle: 10,               // Update throttle (ms)

  onActive: (id, prevId) => {},
  onEnter: (id) => {},
  onLeave: (id) => {},
  onScrollStart: () => {},
  onScrollEnd: () => {},
});`,
    "custom-containers": `const containerRef = useRef<HTMLDivElement>(null);

const { active, register, link } = useDomet({
  ids: ['s1', 's2', 's3'],
  container: containerRef,
});

return (
  <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
    <section {...register('s1')}>Section 1</section>
    <section {...register('s2')}>Section 2</section>
    <section {...register('s3')}>Section 3</section>
  </div>
);`,
    callbacks: `useDomet({
  ids: sectionIds,
  onActive: (id, prevId) => {
    console.log(\`Active changed: \${prevId} → \${id}\`);
    analytics.track('section_view', { section: id });
  },
  onEnter: (id) => {
    console.log(\`Section entered: \${id}\`);
  },
  onLeave: (id) => {
    console.log(\`Section left: \${id}\`);
  },
  onScrollStart: () => {
    console.log('Scroll started');
  },
  onScrollEnd: () => {
    console.log('Scroll ended');
  },
});`,
    "table-of-contents": `function TableOfContents() {
  const { active, link, sections } = useDomet({
    ids: ['intro', 'features', 'api', 'examples'],
  });

  return (
    <nav className="toc">
      {['intro', 'features', 'api', 'examples'].map((id) => (
        <a
          key={id}
          {...link(id)}
          className={active === id ? 'active' : ''}
          style={{ opacity: 0.5 + (sections[id]?.visibility ?? 0) * 0.5 }}
        >
          {id}
        </a>
      ))}
    </nav>
  );
}`,
    "progress-indicator": `function ProgressIndicator() {
  const { progress, direction, scroll } = useDomet({
    ids: sectionIds,
  });

  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: \`\${progress * 100}%\` }}
      />
      <span>{direction === 'down' ? '↓' : direction === 'up' ? '↑' : '—'}</span>
      <span>{Math.round(progress * 100)}%</span>
    </div>
  );
}`,
    nextjs: `// app/layout.tsx
'use client';

import { useDomet } from 'domet';

export default function Layout({ children }) {
  const { active, register, link } = useDomet({
    ids: ['hero', 'features', 'pricing', 'faq'],
  });

  return (
    <html>
      <body>
        <nav className="fixed top-0">
          <button {...link('hero')}>Home</button>
          <button {...link('features')}>Features</button>
          <button {...link('pricing')}>Pricing</button>
          <button {...link('faq')}>FAQ</button>
        </nav>
        {children}
      </body>
    </html>
  );
}`,
    "css-selectors": `// Instead of passing IDs manually:
const { active, sections } = useDomet({
  selector: '[data-section]',
});

// All elements with data-section will be tracked
<section data-section id="intro">...</section>
<section data-section id="features">...</section>
<section data-section id="pricing">...</section>`,
  };

  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-zinc-600 leading-relaxed">
          {p}
        </p>
      ))}
      {(showCode || codeExamples[id]) && (
        <div className="mt-6">
          <CodeBlock
            code={
              codeExamples[id] ||
              `// Example code for ${id}\nconst example = () => {\n  // Implementation details...\n};`
            }
          />
        </div>
      )}
      {depth === 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> This section contains {DOCUMENTATION_TREE.find((t) => t.id === id)?.children?.length || 0} subsections.
            Scroll down to explore each topic in detail.
          </p>
        </div>
      )}
    </div>
  );
}

type TreeNodeProps = {
  item: { id: string; title: string; depth: number; parentId?: string };
  isActive: boolean;
  isParentActive: boolean;
  visibility: number;
  onNavigate: (id: string) => void;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
  hasChildren: boolean;
};

function TreeNode({
  item,
  isActive,
  isParentActive,
  visibility,
  onNavigate,
  expandedGroups,
  onToggleGroup,
  hasChildren,
}: TreeNodeProps) {
  const isExpanded = expandedGroups.has(item.id);
  const showNode = item.depth === 0 || (item.parentId && expandedGroups.has(item.parentId));

  if (!showNode) return null;

  return (
    <div
      className="relative"
      style={{ paddingLeft: item.depth > 0 ? 16 : 0 }}
    >
      {item.depth > 0 && (
        <div className="absolute left-2 top-0 bottom-0 w-px bg-zinc-200" />
      )}
      <button
        onClick={() => {
          if (hasChildren && item.depth === 0) {
            onToggleGroup(item.id);
          }
          onNavigate(item.id);
        }}
        className={`
          group flex items-center gap-2 w-full px-3 py-2 text-left text-sm rounded-lg transition-all
          ${isActive ? "bg-indigo-100 text-indigo-900 font-medium" : ""}
          ${isParentActive && !isActive ? "bg-indigo-50 text-indigo-700" : ""}
          ${!isActive && !isParentActive ? "text-zinc-600 hover:bg-zinc-100" : ""}
        `}
      >
        {hasChildren && item.depth === 0 && (
          <span
            className={`text-xs text-zinc-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          >
            ▶
          </span>
        )}
        {item.depth > 0 && (
          <span className="w-2 h-2 rounded-full bg-zinc-300 group-hover:bg-zinc-400 transition-colors" />
        )}
        <span className="flex-1">{item.title}</span>
        {visibility > 0 && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-indigo-500 transition-opacity"
            style={{ opacity: visibility }}
          />
        )}
      </button>
    </div>
  );
}

export function TreeView() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(DOCUMENTATION_TREE.map((t) => t.id))
  );

  const { active, progress, direction, register, scrollTo, sections } = useDomet({
    ids: SECTION_IDS,
    triggerOffset: "10%",
    hysteresis: 100,
  });

  const handleToggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNavigate = (id: string) => {
    const item = FLAT_SECTIONS.find((s) => s.id === id);
    if (item?.parentId && !expandedGroups.has(item.parentId)) {
      setExpandedGroups((prev) => new Set([...prev, item.parentId!]));
    }
    scrollTo(id, { position: "center" });
  };

  const activeItem = FLAT_SECTIONS.find((s) => s.id === active);
  const activeParentId = activeItem?.parentId;

  const childrenMap = new Map<string, boolean>();
  for (const section of FLAT_SECTIONS) {
    if (section.depth === 0) {
      childrenMap.set(
        section.id,
        FLAT_SECTIONS.some((s) => s.parentId === section.id)
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="fixed left-0 top-0 h-screen w-72 border-r border-zinc-200 bg-zinc-50 flex flex-col">
        <div className="p-4 border-b border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <span className="font-semibold text-zinc-900">Domet Docs</span>
          </div>
          <div className="text-xs text-zinc-500">v1.0.0</div>
        </div>

        <div className="p-3 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-zinc-500 font-mono w-12 text-right">
              {Math.round(progress * 100)}%
            </span>
            <span className="text-zinc-400">
              {direction === "down" ? "↓" : direction === "up" ? "↑" : "·"}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {FLAT_SECTIONS.map((item) => (
            <TreeNode
              key={item.id}
              item={item}
              isActive={active === item.id}
              isParentActive={activeParentId === item.id}
              visibility={sections[item.id]?.visibility ?? 0}
              onNavigate={handleNavigate}
              expandedGroups={expandedGroups}
              onToggleGroup={handleToggleGroup}
              hasChildren={childrenMap.get(item.id) || false}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-200 bg-white text-xs text-zinc-500">
          <div className="flex justify-between">
            <span>Active:</span>
            <span className="font-mono text-indigo-600">{active || "none"}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Sections:</span>
            <span className="font-mono">{SECTION_IDS.length}</span>
          </div>
        </div>
      </aside>

      <main className="ml-72 flex-1">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <header className="mb-12 pb-8 border-b border-zinc-200">
            <h1 className="text-4xl font-bold text-zinc-900 mb-4">
              Domet Documentation
            </h1>
            <p className="text-xl text-zinc-600">
              A comprehensive guide to using the Domet scroll-spy hook library.
              Scroll through this documentation to see useDomet in action with a tree navigation.
            </p>
          </header>

          {FLAT_SECTIONS.map((item) => {
            const HeadingTag = item.depth === 0 ? "h2" : "h3";
            const headingSize = item.depth === 0 ? "text-2xl" : "text-xl";
            const sectionState = sections[item.id];

            return (
              <section
                key={item.id}
                {...register(item.id)}
                className={`
                  mb-12 scroll-mt-8
                  ${item.depth === 0 ? "pt-8 border-t border-zinc-200" : "pl-4 border-l-2 border-zinc-100"}
                `}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <HeadingTag
                    className={`${headingSize} font-semibold text-zinc-900`}
                  >
                    {item.depth === 0 && (
                      <span className="text-indigo-500 mr-2">
                        {String(DOCUMENTATION_TREE.findIndex((t) => t.id === item.id) + 1).padStart(2, "0")}.
                      </span>
                    )}
                    {item.title}
                  </HeadingTag>
                  {sectionState && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono shrink-0">
                      <span>vis: {Math.round(sectionState.visibility * 100)}%</span>
                      <span className={sectionState.active ? "text-indigo-600" : ""}>
                        {sectionState.active ? "●" : "○"}
                      </span>
                    </div>
                  )}
                </div>
                <SectionContent id={item.id} depth={item.depth} />
              </section>
            );
          })}

          <footer className="mt-16 pt-8 border-t border-zinc-200 text-center text-zinc-500 text-sm">
            <p>End of documentation. You&apos;ve scrolled through {SECTION_IDS.length} sections!</p>
            <button
              onClick={() => scrollTo(SECTION_IDS[0], { position: "top" })}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to top
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}
