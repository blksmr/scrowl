# paradice 🎲

A ready-to-use React scroll spy hook with automatic overlay detection. Just copy the hook into your project and use it!

## Features

- 🎯 **Auto Overlay Detection** - Automatically detects sticky/fixed headers
- ⚡ **Buttery Smooth** - RAF + throttling for 60fps performance
- 🧠 **Hysteresis Scoring** - Smart algorithm prevents jittery switching
- 🪟 **Window & Container** - Works with both window scroll and custom containers
- 🐛 **Debug Mode** - Visual overlay showing scroll position and section scores
- 📘 **TypeScript Ready** - Full type definitions included
- 🎁 **Zero Dependencies** - Just React

## Quick Start

1. Copy `src/hooks/useScrollSpy.tsx` into your project
2. Use it in your components:

```tsx
import { useScrollSpy } from './hooks/useScrollSpy';

function MyComponent() {
  const { activeId, registerRef, scrollToSection } = useScrollSpy([
    'intro',
    'features',
    'api'
  ]);

  return (
    <>
      <nav>
        <button onClick={() => scrollToSection('intro')}>Intro</button>
        <button onClick={() => scrollToSection('features')}>Features</button>
      </nav>
      
      <section id="intro" ref={registerRef('intro')}>
        Intro content
      </section>
      
      <section id="features" ref={registerRef('features')}>
        Features content
      </section>
    </>
  );
}
```

## Development

```sh
git clone <YOUR_GIT_URL>
cd paradice
npm i
npm run dev
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run lint` - ESLint check
