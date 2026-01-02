# Lexique du Scrowl

## Terminologie

### **Menu** (Navigation)
- **Localisation** : Colonne de gauche
- **Composant** : `NavigationItem.tsx`
- **Structure** : `<ul>` contenant des `<li>` 
- **Rôle** : Liste des liens d'ancrage vers les sections de contenu
- **Comportement** : Sticky, suit le scroll, highlight l'item actif

### **Content** (Contenu)
- **Localisation** : Colonne de droite
- **Composant** : `ContentSection.tsx`
- **Structure** : `<section>` avec `id` et `data-scrollspy-id`
- **Rôle** : Bloc de contenu scrollable, hauteur variable
- **Comportement** : Observé par IntersectionObserver pour déterminer la section active

---

## Architecture des composants

```
Index.tsx (Page principale)
├── ScrollProgress        → Barre de progression horizontale (top)
├── Menu (ul)
│   └── NavigationItem[]  → Items de navigation (gauche)
└── Content (div)
    └── ContentSection[]  → Sections de contenu (droite)
```

## Hook principal

### **useScrowl**
- **Fichier** : `packages/Scrowl/src/useScrowl.ts`
- **Package** : `Scrowl`
- **Input** : Liste des `sectionIds` (IDs du Content)
- **Output** : 
  - `activeId` : ID de la section Content actuellement visible
  - `registerRef` : Fonction pour attacher les refs aux sections Content

---

## Mapping Menu ↔ Content

| Menu Item | Content Section |
|-----------|-----------------|
| `NavigationItem` avec `id="intro"` | `ContentSection` avec `id="intro"` |
| `NavigationItem` avec `id="part-1"` | `ContentSection` avec `id="part-1"` |
| ... | ... |

Le lien se fait via l'attribut `id` partagé entre Menu et Content.
