# @scrollmark/scroll-spy

A ready-to-use React scroll spy hook with automatic overlay detection.

## Installation

This package is part of the scrollmark monorepo. To use it in your project:

```bash
npm install @scrollmark/scroll-spy
```

## Usage

```tsx
import { useScrollSpy, ScrollSpyDebugOverlay } from '@scrollmark/scroll-spy';

function MyComponent() {
  const sectionIds = ['intro', 'features', 'api'];
  const { activeId, registerRef, scrollToSection } = useScrollSpy(sectionIds);

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

