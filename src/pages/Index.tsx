import { useScrollSpy } from "@/hooks/useScrollSpy";
import { ArrowUpRight } from "lucide-react";

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
    title: "Zero Dependencies",
    description: "Just React. Nothing else to install or bundle.",
    badge: null,
    href: "#",
  },
];

const API_ITEMS = [
  {
    name: "useScrollSpy(sectionIds, containerRef?, options?)",
    description: "Main hook that tracks which section is currently in view.",
  },
  {
    name: "activeId",
    description: "The ID of the currently active section, or null.",
  },
  {
    name: "registerRef(id)",
    description: "Returns a ref callback to attach to each section element.",
  },
  {
    name: "scrollToSection(id)",
    description: "Programmatically scroll to a specific section.",
  },
];

const LINKS = [
  { label: "GitHub", href: "https://github.com" },
  { label: "npm", href: "https://npmjs.com" },
  { label: "Documentation", href: "#" },
  { label: "Examples", href: "#" },
  { label: "Changelog", href: "#" },
];

const Index = () => {
  // offset: 'auto' (default) automatically detects fixed/sticky elements at top
  const { activeId, registerRef, scrollToSection } = useScrollSpy(
    SECTIONS.map((s) => s.id)
  );

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

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
                  ? "w-8 bg-primary"
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
          <div className="text-2xl mb-4">🎲</div>
          <h1 className="text-foreground text-xl font-medium mb-2">
            Welcome to paradice
          </h1>
          <p className="text-[#9d9d9d] text-sm">
            Roll with the best scroll spy for React.
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
            <span className="text-foreground font-medium">paradice</span> is a 
            lightweight React hook that tracks which section of your page is currently 
            visible. Perfect for documentation sites, landing pages, and anywhere you 
            need a table of contents that updates as you scroll.
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
                  <a 
                    href={feature.href}
                    className="text-foreground link-hover inline-flex items-center gap-1"
                  >
                    {feature.title}
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  {feature.badge && (
                    <span className="badge">{feature.badge}</span>
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
          
          <p className="text-[#7c7c7c] text-sm mb-4">
            Install with your favorite package manager:
          </p>
          
          <pre className="code-block mb-6">
            <code>
              <span className="text-[#7c3aed]">npm</span> install paradice{"\n\n"}
              <span className="text-[#6b7280]"># or</span>{"\n"}
              <span className="text-[#7c3aed]">yarn</span> add paradice
            </code>
          </pre>
          
          <p className="text-[#7c7c7c] text-sm mb-4">
            Basic usage ↓
          </p>
          
          <pre className="code-block">
            <code>
              <span className="text-[#7c3aed]">import</span> {"{"} useScrollSpy {"}"} <span className="text-[#7c3aed]">from</span> <span className="text-[#059669]">'paradice'</span>{"\n\n"}
              <span className="text-[#7c3aed]">function</span> <span className="text-[#2563eb]">TableOfContents</span>() {"{"}{"\n"}
              {"  "}<span className="text-[#7c3aed]">const</span> {"{"} activeId, registerRef {"}"} = <span className="text-[#2563eb]">useScrollSpy</span>([{"\n"}
              {"    "}<span className="text-[#059669]">'intro'</span>,{"\n"}
              {"    "}<span className="text-[#059669]">'features'</span>,{"\n"}
              {"    "}<span className="text-[#059669]">'api'</span>{"\n"}
              {"  "}]){"\n\n"}
              {"  "}<span className="text-[#7c3aed]">return</span> ({"\n"}
              {"    "}<span className="text-[#6b7280]">{"<>"}</span>{"\n"}
              {"      "}<span className="text-[#2563eb]">{"<nav>"}</span>{"\n"}
              {"        "}{"{"}<span className="text-[#9ca3af]">sections</span>.<span className="text-[#2563eb]">map</span>(id {"=>"} ({"\n"}
              {"          "}<span className="text-[#2563eb]">{"<a"}</span>{"\n"}
              {"            "}<span className="text-[#9ca3af]">key</span>={"{"}<span className="text-[#9ca3af]">id</span>{"}"}{"\n"}
              {"            "}<span className="text-[#9ca3af]">className</span>={"{"}activeId === id ? <span className="text-[#059669]">'active'</span> : <span className="text-[#059669]">''</span>{"}"}{"\n"}
              {"          "}<span className="text-[#2563eb]">{">"}</span>{"\n"}
              {"            "}{"{"}<span className="text-[#9ca3af]">id</span>{"}"}{"\n"}
              {"          "}<span className="text-[#2563eb]">{"</a>"}</span>{"\n"}
              {"        "})){")}"}{"\n"}
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
          
          <ul className="space-y-4">
            {API_ITEMS.map((item) => (
              <li key={item.name}>
                <code className="code-inline text-foreground">
                  {item.name}
                </code>
                <p className="text-[#9d9d9d] text-sm mt-1">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
          
          <div className="mt-6 p-4 bg-gray-50 rounded text-sm text-[#7c7c7c]">
            <span className="text-foreground">Options:</span>
            <ul className="mt-2 space-y-1 text-[#9d9d9d]">
              <li>• <code className="code-inline">offset</code> — Trigger offset in pixels (default: 100)</li>
              <li>• <code className="code-inline">debounceMs</code> — Debounce delay (default: 10)</li>
            </ul>
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
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
        </footer>

        <div className="section-divider" />

        {/* Copyright */}
        <div className="text-[#9d9d9d] text-xs">
          <p>© 2026 paradice</p>
          <p className="mt-1">
            Made with ☕ by{" "}
            <a href="#" className="link-hover">
              @developer
            </a>
          </p>
          <p className="mt-3 text-[#c0c0c0]">
            ᕙ(⇀‸↼‶)ᕗ
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
