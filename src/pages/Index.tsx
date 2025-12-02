import { useScrollSpy } from "@/hooks/useScrollSpy";
import { ScrollProgress } from "@/components/ScrollProgress";
import { NavigationItem } from "@/components/NavigationItem";
import { ContentSection } from "@/components/ContentSection";
import { Card } from "@/components/ui/card";
import { Code } from "lucide-react";

const SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "observer", label: "IntersectionObserver" },
  { id: "implementation", label: "Implémentation" },
  { id: "usage", label: "Utilisation" },
  { id: "alternatives", label: "Alternatives" },
  { id: "conclusion", label: "Conclusion" },
];

const Index = () => {
  const { activeId, registerRef } = useScrollSpy(SECTIONS.map((s) => s.id));

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <ScrollProgress />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-1 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
                <Code className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Scroll Spy React</h1>
                <p className="text-xs text-muted-foreground">IntersectionObserver Demo</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container px-6 py-8">
          <div className="flex gap-8 lg:gap-12">
            {/* Sticky Navigation */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <Card className="p-2 bg-card border-border">
                  <nav>
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Table des matières
                    </p>
                    <ul className="space-y-1">
                      {SECTIONS.map((section) => (
                        <NavigationItem
                          key={section.id}
                          id={section.id}
                          label={section.label}
                          isActive={activeId === section.id}
                          onClick={scrollToSection}
                        />
                      ))}
                    </ul>
                  </nav>
                </Card>
              </div>
            </aside>

            {/* Content */}
            <main className="flex-1 max-w-4xl">
              <ContentSection
                id="introduction"
                title="Introduction"
                registerRef={registerRef}
              >
                <p className="text-lg leading-relaxed mb-4">
                  Le <strong>scroll spy</strong> est une technique permettant de suivre automatiquement
                  la section visible à l'écran et de mettre à jour la navigation en conséquence.
                </p>
                <p className="leading-relaxed mb-4">
                  Cette démonstration présente une implémentation robuste utilisant l'API
                  <code className="px-2 py-1 bg-muted rounded text-sm mx-1">IntersectionObserver</code>
                  native du navigateur, parfaitement adaptée aux contenus de hauteur variable.
                </p>
                <div className="bg-muted/50 border-l-4 border-primary p-4 rounded-r-lg my-6">
                  <p className="text-sm font-medium">
                    💡 <strong>Avantage principal</strong> : Gestion automatique des hauteurs variables
                    sans calculs manuels de positions.
                  </p>
                </div>
              </ContentSection>

              <ContentSection
                id="observer"
                title="IntersectionObserver"
                registerRef={registerRef}
              >
                <p className="leading-relaxed mb-4">
                  <code className="px-2 py-1 bg-muted rounded text-sm">IntersectionObserver</code> est
                  une API native qui permet d'observer les changements d'intersection entre un élément
                  cible et son conteneur parent ou le viewport.
                </p>
                <h3 className="text-xl font-semibold mt-6 mb-3">Paramètres clés</h3>
                <ul className="space-y-3 list-none">
                  <li className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      1
                    </span>
                    <div>
                      <strong>rootMargin</strong> : Définit une zone tampon autour de l'élément observé.
                      Exemple : <code className="px-2 py-1 bg-muted rounded text-sm">"0px 0px -50% 0px"</code>
                      crée une ligne horizontale à mi-hauteur du viewport.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      2
                    </span>
                    <div>
                      <strong>threshold</strong> : Tableau de valeurs entre 0 et 1 indiquant les pourcentages
                      de visibilité qui déclenchent le callback. Plus il y a de valeurs, plus la détection est fine.
                    </div>
                  </li>
                </ul>
              </ContentSection>

              <ContentSection
                id="implementation"
                title="Implémentation"
                registerRef={registerRef}
              >
                <p className="leading-relaxed mb-4">
                  Le hook <code className="px-2 py-1 bg-muted rounded text-sm">useScrollSpy</code>
                  encapsule toute la logique de l'IntersectionObserver dans une abstraction réutilisable.
                </p>
                <div className="bg-card border border-border rounded-lg p-6 my-6">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Fonctionnement
                  </h4>
                  <ol className="space-y-3 list-decimal list-inside text-sm">
                    <li>Création d'un IntersectionObserver pour surveiller toutes les sections</li>
                    <li>Détection de la section avec le plus grand ratio de visibilité</li>
                    <li>Mise à jour du state React avec l'ID de la section active</li>
                    <li>Nettoyage automatique lors du démontage du composant</li>
                  </ol>
                </div>
                <p className="leading-relaxed">
                  Cette approche garantit des performances optimales car l'observer est géré de manière
                  native par le navigateur, sans polling JavaScript coûteux.
                </p>
              </ContentSection>

              <ContentSection
                id="usage"
                title="Utilisation"
                registerRef={registerRef}
              >
                <p className="leading-relaxed mb-4">
                  L'utilisation du hook est simple et déclarative. Il suffit de fournir un tableau d'IDs
                  de sections et d'utiliser la fonction <code className="px-2 py-1 bg-muted rounded text-sm">registerRef</code>
                  pour attacher les références.
                </p>
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-6 my-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-primary">✨</span>
                    Caractéristiques
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Hauteurs de sections variables gérées automatiquement</li>
                    <li>✓ Scroll fluide vers les sections au clic</li>
                    <li>✓ Mise en surbrillance de la section active avec animations</li>
                    <li>✓ Navigation sticky qui reste visible au scroll</li>
                    <li>✓ Barre de progression en haut de page</li>
                  </ul>
                </div>
                <p className="leading-relaxed text-sm text-muted-foreground">
                  Cette page que vous lisez actuellement utilise ce système ! Observez comment
                  la navigation à gauche se met à jour automatiquement pendant que vous scrollez.
                </p>
              </ContentSection>

              <ContentSection
                id="alternatives"
                title="Alternatives"
                registerRef={registerRef}
              >
                <h3 className="text-xl font-semibold mb-4">Autres approches possibles</h3>
                <div className="space-y-4">
                  <Card className="p-5 border-border hover:border-primary/50 transition-colors">
                    <h4 className="font-semibold mb-2">react-intersection-observer</h4>
                    <p className="text-sm text-muted-foreground">
                      Bibliothèque légère qui encapsule IntersectionObserver dans un hook React simple.
                      Idéale si vous préférez une abstraction prête à l'emploi.
                    </p>
                  </Card>
                  <Card className="p-5 border-border hover:border-primary/50 transition-colors">
                    <h4 className="font-semibold mb-2">GSAP ScrollTrigger</h4>
                    <p className="text-sm text-muted-foreground">
                      Solution puissante pour des animations complexes liées au scroll. Parfait si vous
                      avez déjà GSAP dans votre projet et besoin d'effets avancés.
                    </p>
                  </Card>
                  <Card className="p-5 border-border hover:border-primary/50 transition-colors">
                    <h4 className="font-semibold mb-2">Scroll listeners traditionnels</h4>
                    <p className="text-sm text-muted-foreground">
                      Approche manuelle avec <code className="px-1.5 py-0.5 bg-muted rounded text-xs">window.addEventListener('scroll')</code>.
                      Moins performant et nécessite des calculs manuels de positions.
                    </p>
                  </Card>
                </div>
              </ContentSection>

              <ContentSection
                id="conclusion"
                title="Conclusion"
                registerRef={registerRef}
              >
                <p className="text-lg leading-relaxed mb-4">
                  L'approche IntersectionObserver offre le meilleur compromis entre performance,
                  fiabilité et simplicité d'implémentation.
                </p>
                <div className="bg-gradient-hero text-white rounded-lg p-6 my-6">
                  <h4 className="font-bold text-lg mb-3">Recommandation</h4>
                  <p className="text-sm leading-relaxed opacity-95">
                    Pour la plupart des cas d'usage, un hook custom basé sur IntersectionObserver
                    est la solution idéale. Elle fonctionne parfaitement avec des hauteurs variables,
                    offre d'excellentes performances et ne nécessite aucune dépendance externe.
                  </p>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  Cette implémentation est production-ready et peut être facilement adaptée à vos
                  besoins spécifiques en ajustant les paramètres <code className="px-2 py-1 bg-muted rounded text-sm">rootMargin</code>
                  et <code className="px-2 py-1 bg-muted rounded text-sm">threshold</code>.
                </p>
                <div className="mt-8 pt-8 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Scrollez vers le haut pour tester la navigation ! 🚀
                  </p>
                </div>
              </ContentSection>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
