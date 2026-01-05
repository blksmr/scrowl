# domet ・ /ˈdɔ.met/

domet is a lightweight React hook built for scroll-driven interfaces. Use it for classic scroll-spy, but also for progress indicators, lazy section loading, or any UI that needs reliable section awareness.

Lightweight under the hood: a tight scroll loop and hysteresis for stable, flicker-free section tracking.

For the source code, check out the [GitHub](https://github.com/blksmr/domet).

## Installation Requires React 18 or higher

```bash
npm install domet
```

## Quick Start

```tsx
import { useDomet } from 'domet'

const sections = ['intro', 'features', 'api']

function Page() {
  const { activeId, sectionProps, navProps } = useDomet(sections)

  return (
    <>
      <nav>
        {sections.map(id => (
          <button key={id} {...navProps(id)}>
            {id}
          </button>
        ))}
      </nav>

      <section {...sectionProps('intro')}>...</section>
      <section {...sectionProps('features')}>...</section>
      <section {...sectionProps('api')}>...</section>
    </>
  )
}
```

## API Reference

### Arguments

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sectionIds` | `string[]` | — | Array of section IDs to track |
| `containerRef` | `RefObject<HTMLElement> \| null` | `null` | Scrollable container (defaults to window) |
| `options` | `DometOptions` | `{}` | Configuration options |

### Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `offset` | `number` | `0` | Trigger offset from top in pixels |
| `offsetRatio` | `number` | `0.08` | Viewport ratio for trigger line calculation |
| `debounceMs` | `number` | `10` | Throttle delay in milliseconds |
| `visibilityThreshold` | `number` | `0.6` | Minimum visibility ratio (0-1) for section to get priority |
| `hysteresisMargin` | `number` | `150` | Score margin to prevent rapid section switching |
| `behavior` | `'smooth' \| 'instant' \| 'auto'` | `'auto'` | Scroll behavior. 'auto' respects prefers-reduced-motion |

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onActiveChange` | `(id: string \| null, prevId: string \| null) => void` | Called when active section changes |
| `onSectionEnter` | `(id: string) => void` | Called when a section enters the viewport |
| `onSectionLeave` | `(id: string) => void` | Called when a section leaves the viewport |
| `onScrollStart` | `() => void` | Called when scrolling starts |
| `onScrollEnd` | `() => void` | Called when scrolling stops |

### Return Value

| Prop | Type | Description |
|------|------|-------------|
| `activeId` | `string \| null` | ID of the currently active section |
| `activeIndex` | `number` | Index of the active section in sectionIds (-1 if none) |
| `scroll` | `ScrollState` | Global scroll state |
| `sections` | `Record<string, SectionState>` | Per-section state indexed by ID |
| `sectionProps` | `(id: string) => SectionProps` | Props to spread on section elements |
| `navProps` | `(id: string) => NavProps` | Props to spread on nav items |
| `registerRef` | `(id: string) => (el: HTMLElement \| null) => void` | Manual ref registration |
| `scrollToSection` | `(id: string) => void` | Programmatically scroll to a section |

## Types

### ScrollState

Global scroll information updated on every scroll event.

```ts
type ScrollState = {
  y: number                        // Current scroll position in pixels
  progress: number                 // Overall scroll progress (0-1)
  direction: 'up' | 'down' | null  // Scroll direction
  velocity: number                 // Scroll speed
  isScrolling: boolean             // True while actively scrolling
  maxScroll: number                // Maximum scroll value
  viewportHeight: number           // Viewport height in pixels
  offset: number                   // Effective trigger offset
}
```

### SectionState

Per-section state available for each tracked section.

```ts
type SectionState = {
  bounds: SectionBounds  // Position and dimensions
  visibility: number     // Visibility ratio (0-1)
  progress: number       // Section scroll progress (0-1)
  isInViewport: boolean  // True if any part is visible
  isActive: boolean      // True if this is the active section
}

type SectionBounds = {
  top: number
  bottom: number
  height: number
}
```

## Examples

### With Callbacks

```tsx
const { activeId } = useDomet(sections, null, {
  onActiveChange: (id, prevId) => {
    console.log(`Changed from ${prevId} to ${id}`)
  },
  onSectionEnter: (id) => {
    console.log(`Entered: ${id}`)
  },
})
```

### Using Scroll State

```tsx
const { scroll, sections } = useDomet(sectionIds)

// Global progress bar
<div style={{ width: `${scroll.progress * 100}%` }} />

// Per-section animations
{sectionIds.map(id => (
  <div style={{ opacity: sections[id]?.visibility }} />
))}
```

### Custom Container

```tsx
const containerRef = useRef<HTMLDivElement>(null)
const { activeId } = useDomet(sections, containerRef)

return (
  <div ref={containerRef} style={{ overflow: 'auto', height: '100vh' }}>
    {/* sections */}
  </div>
)
```

### Fine-tuning Behavior

```tsx
useDomet(sections, null, {
  visibilityThreshold: 0.8,  // Require 80% visibility
  hysteresisMargin: 200,     // More resistance to switching
})
```

## Why domet?

This library was born from a real need at work. I wanted a scroll-spy solution that was powerful and completely headless, but above all, extremely lightweight. No bloated dependencies, no opinionated styling, just a hook that does one thing well.

The name **domet** comes from Bosnian/Serbian/Croatian and means "reach" or "range" — the distance something can cover. Pronounced `/ˈdɔ.met/`: stress on the first syllable, open "o", and a hard "t" at the end.

## Support

For issues or feature requests, open an issue on [GitHub](https://github.com/blksmr/domet).

For LLMs, the full documentation is available at [/llms.txt](/llms.txt).

You can also reach out to me on [Twitter](https://x.com/blkasmir).
