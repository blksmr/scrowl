import { useState, useRef, useEffect } from "react";
import { useScrowl, ScrowlDebugOverlay } from "scrowl";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHighlighter } from "shiki";
import { CodeBlock } from "@/components/CodeBlock";

const SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "features", label: "Features" },
  { id: "getting-started", label: "Getting Started" },
  { id: "api", label: "API" },
];

const FEATURES = [
  {
    title: "Auto Overlay Detection",
    description: "Automatically detects sticky/fixed headers and adjusts scroll offset. No manual config needed.",
    badge: "New",
    href: "#",
  },
  {
    title: "Buttery Smooth",
    description: "RAF + throttling for 60fps performance. No jank, no polling, just smooth.",
    badge: null,
    href: "#",
  },
  {
    title: "Hysteresis Scoring",
    description: "Smart algorithm prevents jittery switching between sections while scrolling.",
    badge: null,
    href: "#",
  },
  {
    title: "Window & Container",
    description: "Works with both window scroll and custom scrollable containers.",
    badge: null,
    href: "#",
  },
  {
    title: "Debug Mode",
    description: "Visual overlay showing scroll position, trigger line, and section scores.",
    badge: "Dev",
    href: "#",
  },
  {
    title: "TypeScript Ready",
    description: "Full type definitions included. Autocomplete everything.",
    badge: null,
    href: "#",
  },
  {
    title: "Copy & Use",
    description: "No installation, no bundling. Just copy the hook file into your project and use it.",
    badge: null,
    href: "#",
  },
];

const API_ARGUMENTS = [
  {
    name: "sectionIds",
    type: "string[]",
    description: "Array of section IDs to track.",
  },
  {
    name: "containerRef",
    type: "RefObject<HTMLElement> | null",
    description: "Optional scrollable container. Defaults to window.",
  },
  {
    name: "options",
    type: "ScrowlOptions",
    description: "Configuration options (see below).",
  },
];

const API_OPTIONS = [
  {
    name: "offset",
    type: "number | 'auto'",
    default: "'auto'",
    description: "Trigger offset from top. 'auto' detects sticky/fixed headers.",
  },
  {
    name: "offsetRatio",
    type: "number",
    default: "0.08",
    description: "Viewport ratio for trigger line calculation.",
  },
  {
    name: "debounceMs",
    type: "number",
    default: "10",
    description: "Throttle delay in milliseconds.",
  },
  {
    name: "debug",
    type: "boolean",
    default: "false",
    description: "Enables debug mode with debugInfo in return value.",
  },
];

const API_RETURNS = [
  {
    name: "activeId",
    type: "string | null",
    description: "The ID of the currently active section.",
  },
  {
    name: "registerRef(id)",
    type: "(el: HTMLElement | null) => void",
    description: "Ref callback to attach to each section element.",
  },
  {
    name: "scrollToSection(id)",
    type: "(id: string) => void",
    description: "Programmatically scroll to a specific section.",
  },
  {
    name: "debugInfo",
    type: "DebugInfo",
    description: "Debug data (only when debug: true).",
  },
];

const LINKS = [
  { label: "GitHub", href: "https://github.com/blksmr/scrowl" },
  { label: "Copy Hook", href: "#getting-started" },
  { label: "Examples", href: "#" },
];

const INSTALL_CODE = `npm install scrowl`;

const USAGE_CODE = `import { useScrowl } from 'scrowl'

function TableOfContents() {
  const { activeId, registerRef, scrollToSection } = useScrowl([
    'intro',
    'features',
    'api'
  ])

  return (
    <>
      <nav>
        <button onClick={() => scrollToSection('intro')}>Intro</button>
        <button onClick={() => scrollToSection('features')}>Features</button>
      </nav>

      <section id="intro" ref={registerRef('intro')}>
        ...
      </section>
    </>
  )
}`;

let HOOK_SOURCE_CODE_CACHE: string | null = null;
let OVERLAY_SOURCE_CODE_CACHE: string | null = null;

const loadHookSource = async (): Promise<string> => {
  if (HOOK_SOURCE_CODE_CACHE) return HOOK_SOURCE_CODE_CACHE;

  try {
    const response = await fetch('/useScrowl.ts');
    const text = await response.text();
    HOOK_SOURCE_CODE_CACHE = text;
    return text;
  } catch {
    return `// useScrowl hook - Unable to load source code`;
  }
};

const loadOverlaySource = async (): Promise<string> => {
  if (OVERLAY_SOURCE_CODE_CACHE) return OVERLAY_SOURCE_CODE_CACHE;

  try {
    const response = await fetch('/ScrowlDebugOverlay.tsx');
    const text = await response.text();
    OVERLAY_SOURCE_CODE_CACHE = text;
    return text;
  } catch {
    return `// ScrowlDebugOverlay - Unable to load source code`;
  }
};

const Demo = () => {
  const demoSectionIds = ['section-1', 'section-2', 'section-3', 'section-4'];
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeId, registerRef, scrollToSection } = useScrowl(demoSectionIds, containerRef);

  return (
    <div className="demo">
      <div className="flex h-full gap-6">
        {/* Menu à gauche */}
        <aside className="flex-shrink-0 w-48">
          <nav className="flex flex-col gap-2">
            {demoSectionIds.map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`px-4 py-2 rounded text-sm text-left transition-colors ${
                  activeId === id
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {id.replace('section-', 'Section ')}
                {activeId === id && ' ✓'}
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenu scrollable à droite */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto"
        >
          <section
            id="section-1"
            ref={registerRef('section-1')}
            className="py-12 px-6 bg-blue-50 rounded mb-4"
          >
            <h3 className="text-lg font-medium mb-2">Section 1</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scroll pour voir la section active changer dans le menu.
            </p>
            <p className="text-sm mb-4">
              Cette section est relativement courte pour démontrer que chaque section peut avoir une hauteur différente.
            </p>
            <p className="text-sm">
              Le hook scrowl fonctionne avec des sections de toutes tailles.
            </p>
          </section>
          <section
            id="section-2"
            ref={registerRef('section-2')}
            className="py-12 px-6 bg-green-50 rounded mb-4"
          >
            <h3 className="text-lg font-medium mb-2">Section 2</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Section active : <strong>{activeId || 'aucune'}</strong>
            </p>
            <p className="text-sm mb-4">
              Cette section est beaucoup plus longue que la première. Elle contient plus de contenu pour montrer comment scrowl gère les sections avec des hauteurs variables.
            </p>
            <div className="space-y-3 mb-4">
              <p className="text-sm">• Point 1 : Détection automatique de la section visible</p>
              <p className="text-sm">• Point 2 : Mise à jour en temps réel du menu</p>
              <p className="text-sm">• Point 3 : Support des hauteurs variables</p>
              <p className="text-sm">• Point 4 : Performance optimisée avec RAF</p>
              <p className="text-sm">• Point 5 : Hysteresis pour éviter les changements brusques</p>
            </div>
            <p className="text-sm mb-4">
              Même avec beaucoup de contenu, le hook scrowl reste performant et réactif. Vous pouvez scroller ou cliquer sur les boutons du menu pour naviguer.
            </p>
            <p className="text-sm">
              Chaque section peut avoir sa propre hauteur, et scrowl s'adapte automatiquement.
            </p>
          </section>
          <section
            id="section-3"
            ref={registerRef('section-3')}
            className="py-12 px-6 bg-purple-50 rounded mb-4"
          >
            <h3 className="text-lg font-medium mb-2">Section 3</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cliquez sur les boutons du menu à gauche pour faire défiler vers chaque section.
            </p>
            <p className="text-sm mb-4">
              Cette section a une hauteur moyenne, entre la première (courte) et la deuxième (longue).
            </p>
            <p className="text-sm mb-4">
              Le hook scrowl détecte automatiquement quelle section est visible et met à jour le menu en conséquence, peu importe la taille de chaque section.
            </p>
            <p className="text-sm">
              C'est parfait pour créer des interfaces avec des sections de contenu de longueurs différentes.
            </p>
          </section>
          <section
            id="section-4"
            ref={registerRef('section-4')}
            className="py-12 px-6 bg-orange-50 rounded"
          >
            <h3 className="text-lg font-medium mb-2">Section 4</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Une quatrième section pour montrer que le système fonctionne avec plusieurs sections.
            </p>
            <p className="text-sm">
              Cette section est également de taille variable et s'intègre parfaitement dans le système de scroll spy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hookSourceCode, setHookSourceCode] = useState<string>("");
  const [overlaySourceCode, setOverlaySourceCode] = useState<string>("");
  const [hookHighlightedHtml, setHookHighlightedHtml] = useState<string>("");
  const [overlayHighlightedHtml, setOverlayHighlightedHtml] = useState<string>("");
  const [isLoadingHook, setIsLoadingHook] = useState(false);
  const [isLoadingOverlay, setIsLoadingOverlay] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("hook");
  const highlighterRef = useRef<Awaited<ReturnType<typeof getHighlighter>> | null>(null);
  
  // Initialize Shiki highlighter
  useEffect(() => {
    getHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['typescript', 'tsx'],
    }).then((highlighter) => {
      highlighterRef.current = highlighter;
    });
  }, []);

  // Highlight hook source code
  useEffect(() => {
    if (hookSourceCode && highlighterRef.current) {
      const html = highlighterRef.current.codeToHtml(hookSourceCode, {
        lang: 'typescript',
        theme: 'github-light',
      });
      setHookHighlightedHtml(html);
    }
  }, [hookSourceCode]);

  // Highlight overlay source code
  useEffect(() => {
    if (overlaySourceCode && highlighterRef.current) {
      const html = highlighterRef.current.codeToHtml(overlaySourceCode, {
        lang: 'typescript',
        theme: 'github-light',
      });
      setOverlayHighlightedHtml(html);
    }
  }, [overlaySourceCode]);
  
  const showDebug = debugMode && !isModalOpen;

  const scrowlResult = useScrowl(
    SECTIONS.map((s) => s.id),
    null,
    showDebug ? { debug: true } : {}
  );

  const { activeId, registerRef, scrollToSection } = scrowlResult;
  const debugInfo = showDebug ? scrowlResult.debugInfo : null;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

  return (
    <>
      {/* Main Content */}
      <main className="md:max-w-[640px] w-[80%] mx-auto py-32">
        
        {/* Header */}
        <header className="flex w-full justify-between mb-6">
            <h1 className="flex items-center gap-2">
            <svg className="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="currentColor"> <path fill-rule="evenodd" clip-rule="evenodd" d="M32 3.05146V1.61505L30.6529 2.11363C28.3786 2.95537 26.7423 2.6537 25.0236 2.33685C24.4073 2.22325 23.7805 2.10769 23.1099 2.04218C21.8555 1.91965 20.5467 2.02757 19.1716 2.87236C18.1157 3.52106 17.0812 4.5677 16 6.14217C14.9188 4.5677 13.8843 3.52106 12.8284 2.87236C11.4533 2.02758 10.1445 1.91966 8.89011 2.04219C8.2195 2.10769 7.59268 2.22325 6.97644 2.33686C5.25773 2.65371 3.62137 2.95537 1.3471 2.11364L0 1.61506V3.05146C0 4.66069 0.207013 5.94095 0.872154 6.93982C1.3879 7.71433 2.11183 8.22022 2.9714 8.60743C2.5799 10.2826 2 13.4068 2 16.8572C2 24.8844 8.37144 30 16 30C23.6286 30 30 24.8844 30 16.8572C30 13.3957 29.4203 10.2796 29.0288 8.60733C29.8883 8.22013 30.6121 7.71426 31.1278 6.93982C31.793 5.94095 32 4.66069 32 3.05146ZM16 18C17.1734 18 18.2337 18.448 19 19.1707L16 22L13 19.1707C13.7691 18.448 14.8266 18 16 18ZM10.5 17C12.433 17 14 15.433 14 13.5C14 11.567 12.433 10 10.5 10C8.567 10 7 11.567 7 13.5C7 15.433 8.567 17 10.5 17ZM25 13.5C25 15.433 23.433 17 21.5 17C19.567 17 18 15.433 18 13.5C18 11.567 19.567 10 21.5 10C23.433 10 25 11.567 25 13.5Z" fill="currentColor"></path> <path d="M10.5 15C11.3284 15 12 14.3284 12 13.5C12 12.6716 11.3284 12 10.5 12C9.67157 12 9 12.6716 9 13.5C9 14.3284 9.67157 15 10.5 15Z" fill="currentColor"></path> <path d="M21.5 15C22.3284 15 23 14.3284 23 13.5C23 12.6716 22.3284 12 21.5 12C20.6716 12 20 12.6716 20 13.5C20 14.3284 20.6716 15 21.5 15Z" fill="currentColor"></path> </g></svg> 
              Scrowl</h1>
        </header>

        <Demo />


        {/* Intro Section */}
        <section
          id="intro"
          ref={registerRef("intro")}
          className="mb-12"
        >
          <p className=" leading-relaxed mb-4">
            Scrowl is a simple scroll spy hook for React.
          </p>
          <p className=" leading-relaxed mb-4">
            Scrowl simplifies scroll tracking in React by removing the complexity that many developers face when setting up scroll spy functionality. By eliminating boilerplate code, it streamlines both implementation and maintenance workflows.
          </p>
          <p className=" leading-relaxed">
            Built with RAF + throttling for buttery-smooth 60fps performance and smart hysteresis to prevent jittery section switching, Scrowl ensures your scroll tracking is both performant and reliable by default.
          </p>
          <p className="text-sm mt-4 leading-relaxed">
            For the source code, check out the{" "}
            <a href="https://github.com/blksmr/scrowl" className="link-hover" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>
        </section>

        {/* Features Section */}
        <section
          id="features"
          ref={registerRef("features")}
          className="mb-12"
        >
          <h2 className="text-foreground  font-medium mb-6">
            Features
          </h2>
          
          <ul className="space-y-6">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <div className="flex items-start gap-2 mb-1">
                  {feature.title === "Debug Mode" ? (
                    <button
                      onClick={() => setDebugMode(!debugMode)}
                      className="text-foreground font-medium hover:underline inline-flex items-center gap-1 transition-colors"
                    >
                      {feature.title}
                      {debugMode ? " ✓" : ""}
                    </button>
                  ) : (
                    <h3 className="text-foreground font-medium">
                      {feature.title}
                    </h3>
                  )}
                  {feature.badge && (
                    <span className="badge">
                      {feature.title === "Debug Mode" && debugMode ? "Active" : feature.badge}
                    </span>
                  )}
                </div>
                <p className=" leading-relaxed">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Getting Started Section */}
        <section
          id="getting-started"
          ref={registerRef("getting-started")}
          className="mb-12"
        >
          <h2 className="text-foreground  font-medium mb-6">
            Getting Started
          </h2>
          
          <h3 className="text-foreground font-medium mb-4">
            Installation
          </h3>
        
          
          <CodeBlock code={INSTALL_CODE} lang="bash" className="mb-6" />
          
          <h3 className="text-foreground font-medium mb-4">
            Usage
          </h3>
          
          <p className=" leading-relaxed mb-4">
            It can be used anywhere in your application as follows.
          </p>
          
          <CodeBlock code={USAGE_CODE} lang="tsx" />
        </section>

        <div className="section-divider" />

        {/* API Section */}
        <section
          id="api"
          ref={registerRef("api")}
          className="mb-12"
        >
          <h2 className="text-foreground  font-medium mb-6">
            API
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-foreground font-medium mb-4">Arguments</h3>
              <ul className="space-y-4">
                {API_ARGUMENTS.map((item) => (
                  <li key={item.name}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <code className="code-inline text-foreground">{item.name}</code>
                      <span className="text-sm">{item.type}</span>
                    </div>
                    <p className=" leading-relaxed">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-medium mb-4">Options</h3>
              <ul className="space-y-4">
                {API_OPTIONS.map((item) => (
                  <li key={item.name}>
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <code className="code-inline text-foreground">{item.name}</code>
                      <span className="text-sm">{item.type}</span>
                      <span className="text-sm">= {item.default}</span>
                    </div>
                    <p className=" leading-relaxed">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-medium mb-4">Returns</h3>
              <ul className="space-y-4">
                {API_RETURNS.map((item) => (
                  <li key={item.name}>
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <code className="code-inline text-foreground">{item.name}</code>
                      <span className="text-sm">{item.type}</span>
                    </div>
                    <p className=" leading-relaxed">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
          <p className=" leading-relaxed mb-4">
            For any issues or feature requests, please open an issue on{" "}
            <a href="https://github.com" className="link-hover" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>
          <p className="text-sm">
            You can also reach out to me on{" "}
            <a href="https://x.com/blkasmir" className="link-hover" target="_blank" rel="noopener noreferrer">
              Twitter
            </a>
            .
          </p>
        </footer>
      </main>

      {showDebug && debugInfo && (
        <ScrowlDebugOverlay
          debugInfo={debugInfo}
          activeId={activeId}
        />
      )}

      {/* Bottom Navigation Overlay */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pointer-events-none">
        <nav className="p-2 px-1.5 bg-background border rounded-full shadow-sm pointer-events-auto" style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
          <ul className="flex gap-1 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(e) => handleNavClick(e, section.id)}
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                    activeId === section.id
                      ? "bg-foreground text-background"
                      : "hover:bg-muted"
                  }`}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Index;
