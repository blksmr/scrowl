import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { ScrollSpyDebugOverlay } from "@/hooks/ScrollSpyDebugOverlay";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { highlightElement } from "@speed-highlight/core";

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
    type: "ScrollSpyOptions",
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
  { label: "GitHub", href: "https://github.com/blksmr/scrollmark" },
  { label: "Copy Hook", href: "#getting-started" },
  { label: "Examples", href: "#" },
];

// Hook source code - loaded dynamically
let HOOK_SOURCE_CODE_CACHE: string | null = null;

const loadHookSource = async (): Promise<string> => {
  if (HOOK_SOURCE_CODE_CACHE) return HOOK_SOURCE_CODE_CACHE;
  
  try {
    const response = await fetch('/useScrollSpy.ts');
    const text = await response.text();
    HOOK_SOURCE_CODE_CACHE = text;
    return text;
  } catch {
    // Fallback message if fetch fails
    return `// useScrollSpy hook
// Unable to load source code
// Please visit the GitHub repo to get the complete source code
`;
  }
};

const Index = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hookSourceCode, setHookSourceCode] = useState<string>("");
  const [isLoadingHook, setIsLoadingHook] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  
  // Callback ref to highlight when element is mounted
  const codeRefCallback = (node: HTMLElement | null) => {
    if (node) {
      codeRef.current = node;
      // Highlight immediately when element is mounted
      if (hookSourceCode && isModalOpen) {
        setTimeout(() => {
          highlightElement(node, 'ts');
        }, 0);
      }
    }
  };
  
  const showDebug = debugMode && !isModalOpen;

  const scrollSpyResult = useScrollSpy(
    SECTIONS.map((s) => s.id),
    null,
    showDebug ? { debug: true } : {}
  );

  const { activeId, registerRef, scrollToSection } = scrollSpyResult;
  const debugInfo = showDebug ? scrollSpyResult.debugInfo : null;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

  // Highlight code when hookSourceCode changes or modal opens
  useLayoutEffect(() => {
    if (hookSourceCode && codeRef.current && isModalOpen) {
      // Use requestAnimationFrame to ensure DOM is ready
      const rafId = requestAnimationFrame(() => {
        if (codeRef.current) {
          highlightElement(codeRef.current, 'ts');
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [hookSourceCode, isModalOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Scroll Progress Indicator - Right Side - Horizontal lines stacked vertically */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(e) => handleNavClick(e, section.id)}
            className="group flex items-center gap-3"
            title={section.label}
          >
            <span 
              className={`text-[10px] transition-opacity duration-200 ${
                activeId === section.id 
                  ? "opacity-100 text-foreground" 
                  : "opacity-0 group-hover:opacity-100 text-gray-400"
              }`}
            >
              {section.label}
            </span>
            <div
              className={`h-[2px] rounded-full transition-all duration-300 ${
                activeId === section.id
                  ? "w-6 bg-primary"
                  : "w-4 bg-gray-300 group-hover:bg-gray-400 group-hover:w-6"
              }`}
            />
          </a>
        ))}
      </div>

      {/* Main Content */}
      <main className="max-w-[400px] mx-auto px-6 py-16">
        
        {/* Header */}
        <header className="mb-12">
          <div className="text-2xl mb-4">📍</div>
          <h1 className="text-foreground text-xl font-medium mb-2">
            scrollmark
          </h1>
          <p className="text-[#9d9d9d] text-sm">
            The scroll spy hook for React.
          </p>
        </header>

        {/* Sticky Navigation Pills */}
        <div className="sticky top-0 z-40 mb-6">
          <nav className="-mx-2 px-2 py-2 bg-background">
            <ul className="flex flex-wrap gap-2 text-sm">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => handleNavClick(e, section.id)}
                    className={`px-3 py-1 rounded-full transition-all duration-200 ${
                      activeId === section.id
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-gray-100 text-[#7c7c7c] hover:bg-gray-200"
                    }`}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {/* Gradient fade - absolute so it doesn't affect layout */}
          <div className="absolute left-0 right-0 top-full h-[50px] bg-gradient-to-b from-background to-transparent pointer-events-none" />
        </div>

        <div className="section-divider" />

        {/* Intro Section */}
        <section
          id="intro"
          ref={registerRef("intro")}
          className="mb-10"
        >
          <p className="text-[#7c7c7c] leading-relaxed">
            <span className="text-foreground font-medium">scrollmark</span> is a 
            ready-to-use React hook that tracks which section of your page is currently 
            visible. Just copy the hook into your project—no installation needed. Perfect 
            for documentation sites, landing pages, and anywhere you need a table of contents 
            that updates as you scroll.
          </p>
          <p className="text-[#9d9d9d] leading-relaxed mt-4 text-sm">
            Built with RAF + throttling for buttery-smooth 60fps performance. 
            Smart hysteresis prevents jittery section switching. Your users will thank you. ⚡
          </p>
        </section>

        <div className="section-divider" />

        {/* Features Section */}
        <section
          id="features"
          ref={registerRef("features")}
          className="mb-10"
        >
          <h2 className="text-foreground font-medium mb-6">
            Features
          </h2>
          
          <ul className="space-y-5">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <div className="flex items-center space-x-2">
                  {feature.title === "Debug Mode" ? (
                    <button
                      onClick={() => setDebugMode(!debugMode)}
                      className={`text-foreground link-hover inline-flex items-center gap-1 transition-colors ${
                        debugMode ? "text-[#7c3aed]" : ""
                      }`}
                    >
                      {feature.title}
                      {debugMode ? " ✓" : ""}
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <a 
                      href={feature.href}
                      className="text-foreground link-hover inline-flex items-center gap-1"
                    >
                      {feature.title}
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                  {feature.badge && (
                    <span className={`badge ${feature.title === "Debug Mode" && debugMode ? "bg-[#7c3aed] text-white" : ""}`}>
                      {feature.title === "Debug Mode" && debugMode ? "Active" : feature.badge}
                    </span>
                  )}
                </div>
                <p className="text-[#9d9d9d] text-sm mt-1">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="section-divider" />

        {/* Getting Started Section */}
        <section
          id="getting-started"
          ref={registerRef("getting-started")}
          className="mb-10"
        >
          <h2 className="text-foreground font-medium mb-6">
            Getting Started
          </h2>
          
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#7c7c7c] text-sm">
              Copy the hook into your project:
            </p>
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open);
              if (open) {
                setDebugMode(false);
              }
            }}>
              <DialogTrigger asChild>
                <button 
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-foreground rounded-full transition-colors inline-flex items-center gap-1.5"
                  onClick={async () => {
                    if (!hookSourceCode && !isLoadingHook) {
                      setIsLoadingHook(true);
                      const code = await loadHookSource();
                      setHookSourceCode(code);
                      setIsLoadingHook(false);
                    }
                  }}
                >
                  View hook
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl h-[90vh] gap-1 flex flex-col p-0">
                <DialogHeader className="space-y-0 px-6 pt-6 pb-4 border-b border-border flex-shrink-0 flex flex-row items-center justify-between">
                  <div>
                    <DialogTitle className="text-lg">useScrollSpy.ts</DialogTitle>
                    <DialogDescription className="text-sm text-[#7c7c7c]">
                      Copy this hook into your project's hooks folder
                    </DialogDescription>
                  </div>
                  {hookSourceCode && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(hookSourceCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-2.5 bg-background border border-border rounded-md hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 text-sm"
                      title="Copy code"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-[#059669]" />
                          <span className="text-xs text-[#059669]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-xs">Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </DialogHeader>
                <div className="flex-1 min-h-0 p-2 pt-0">
                  {isLoadingHook ? (
                    <div className="flex items-center justify-center h-full text-[#7c7c7c]">
                      Loading...
                    </div>
                  ) : hookSourceCode ? (
                    <div className="h-full overflow-y-auto">
                      <pre>
                        <code ref={codeRefCallback} className="shj-lang-ts block whitespace-pre font-mono text-sm" style={{ fontSize: '14px' }}>{hookSourceCode}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#7c7c7c]">
                      Click "View hook" to load the source code
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <pre className="code-block mb-6">
            <code>
              <span className="text-[#6b7280]"># Copy src/hooks/useScrollSpy.ts to your project</span>{"\n"}
              <span className="text-[#6b7280]"># That's it! No installation needed.</span>
            </code>
          </pre>
          
          <p className="text-[#7c7c7c] text-sm mb-4">
            Basic usage ↓
          </p>
          
          <pre className="code-block">
            <code>
              <span className="text-[#7c3aed]">import</span> {"{"} useScrollSpy {"}"} <span className="text-[#7c3aed]">from</span> <span className="text-[#059669]">'./hooks/useScrollSpy'</span>{"\n\n"}
              <span className="text-[#7c3aed]">function</span> <span className="text-[#2563eb]">TableOfContents</span>() {"{"}{"\n"}
              {"  "}<span className="text-[#7c3aed]">const</span> {"{"} activeId, registerRef, scrollToSection {"}"} = <span className="text-[#2563eb]">useScrollSpy</span>([{"\n"}
              {"    "}<span className="text-[#059669]">'intro'</span>,{"\n"}
              {"    "}<span className="text-[#059669]">'features'</span>,{"\n"}
              {"    "}<span className="text-[#059669]">'api'</span>{"\n"}
              {"  "}]){"\n\n"}
              {"  "}<span className="text-[#7c3aed]">return</span> ({"\n"}
              {"    "}<span className="text-[#6b7280]">{"<>"}</span>{"\n"}
              {"      "}<span className="text-[#2563eb]">{"<nav>"}</span>{"\n"}
              {"        "}<span className="text-[#2563eb]">{"<button"}</span> <span className="text-[#9ca3af]">onClick</span>={"{"}() {"=>"} scrollToSection(<span className="text-[#059669]">'intro'</span>){"}"}<span className="text-[#2563eb]">{">"}</span>Intro<span className="text-[#2563eb]">{"</button>"}</span>{"\n"}
              {"        "}<span className="text-[#2563eb]">{"<button"}</span> <span className="text-[#9ca3af]">onClick</span>={"{"}() {"=>"} scrollToSection(<span className="text-[#059669]">'features'</span>){"}"}<span className="text-[#2563eb]">{">"}</span>Features<span className="text-[#2563eb]">{"</button>"}</span>{"\n"}
              {"      "}<span className="text-[#2563eb]">{"</nav>"}</span>{"\n"}
              {"      "}{"\n"}
              {"      "}<span className="text-[#2563eb]">{"<section"}</span> <span className="text-[#9ca3af]">id</span>=<span className="text-[#059669]">"intro"</span> <span className="text-[#9ca3af]">ref</span>={"{"}registerRef(<span className="text-[#059669]">'intro'</span>){"}"}<span className="text-[#2563eb]">{">"}</span>{"\n"}
              {"        "}...{"\n"}
              {"      "}<span className="text-[#2563eb]">{"</section>"}</span>{"\n"}
              {"    "}<span className="text-[#6b7280]">{"</>"}</span>{"\n"}
              {"  "}){"\n"}
              {"}"}
            </code>
          </pre>
        </section>

        <div className="section-divider" />

        {/* API Section */}
        <section
          id="api"
          ref={registerRef("api")}
          className="mb-10"
        >
          <h2 className="text-foreground font-medium mb-6">
            API
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-foreground text-sm font-medium mb-3">Arguments</h3>
              <ul className="space-y-3">
                {API_ARGUMENTS.map((item) => (
                  <li key={item.name}>
                    <div className="flex items-baseline gap-2">
                      <code className="code-inline text-foreground">{item.name}</code>
                      <span className="text-[#9d9d9d] text-xs">{item.type}</span>
                    </div>
                    <p className="text-[#9d9d9d] text-sm mt-1">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="section-divider" />

            <div>
              <h3 className="text-foreground text-sm font-medium mb-3">Options</h3>
              <ul className="space-y-3">
                {API_OPTIONS.map((item) => (
                  <li key={item.name}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <code className="code-inline text-foreground">{item.name}</code>
                      <span className="text-[#9d9d9d] text-xs">{item.type}</span>
                      <span className="text-[#7c7c7c] text-xs">= {item.default}</span>
                    </div>
                    <p className="text-[#9d9d9d] text-sm mt-1">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="section-divider" />

            <div>
              <h3 className="text-foreground text-sm font-medium mb-3">Returns</h3>
              <ul className="space-y-3">
                {API_RETURNS.map((item) => (
                  <li key={item.name}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <code className="code-inline text-foreground">{item.name}</code>
                      <span className="text-[#9d9d9d] text-xs">{item.type}</span>
                    </div>
                    <p className="text-[#9d9d9d] text-sm mt-1">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* Footer Links */}
        <footer className="mb-10">
          <ul className="space-y-2">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a 
                  href={link.href}
                  className="text-[#7c7c7c] link-hover text-sm inline-flex items-center gap-1"
                  {...(link.label !== "Copy Hook" && { target: "_blank", rel: "noopener noreferrer" })}
                >
                  {link.label}
                  {link.label !== "Copy Hook" && <ArrowUpRight className="w-3 h-3" />}
                </a>
              </li>
            ))}
          </ul>
        </footer>

        <div className="section-divider" />

        {/* Copyright */}
        <div className="text-[#9d9d9d] text-xs">
          <p>© 2026 scrollmark</p>
          <p className="mt-1">
            Made with ☕ by{" "}
            <a href="https://x.com/blkasmir" className="link-hover">
              @blksmr
            </a>
          </p>
          <p className="mt-3 text-[#c0c0c0]">
            ᕙ(⇀‸↼‶)ᕗ
          </p>
        </div>
      </main>

      {showDebug && debugInfo && (
        <ScrollSpyDebugOverlay
          debugInfo={debugInfo}
          activeId={activeId}
        />
      )}
    </div>
  );
};

export default Index;
