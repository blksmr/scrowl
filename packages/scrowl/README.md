# Scrowl

A React hook for scroll tracking with smooth 60fps performance and smart hysteresis.

## Installation

```bash
npm install Scrowl
```

## Usage

```tsx
import { useScrowl, ScrowlDebugOverlay } from 'Scrowl';

function MyComponent() {
  const sectionIds = ['intro', 'features', 'api'];
  const { activeId, registerRef, scrollToSection } = useScrowl(sectionIds);

  return (
    <>
      <section id="intro" ref={registerRef('intro')}>
        Intro content
      </section>
      <section id="features" ref={registerRef('features')}>
        Features content
      </section>
      <section id="api" ref={registerRef('api')}>
        API content
      </section>
    </>
  );
}
```

## Features

- Auto overlay detection
- Window and container scroll support
- Debug mode with visual overlay
- Hysteresis scoring to prevent jittery switching
- Smooth scroll behavior

## API

See the main project documentation for full API details.

