# Scrowl

A lightweight, ready-to-use React hook for scroll spying with automatic overlay detection.

## Technologies

- Vite
- TypeScript
- React
- Tailwind CSS

## Usage

Simply copy the `src/hooks/useScrowl.ts` file into your project. That's it! No installation needed.

```tsx
import { useScrowl } from './hooks/useScrowl';

function TableOfContents() {
  const { activeId, registerRef } = useScrowl([
    'intro',
    'features',
    'api'
  ]);

  return (
    <>
      <nav>
        {/* Navigation links */}
      </nav>
      <section id="intro" ref={registerRef('intro')}>
        {/* Intro content */}
      </section>
      {/* Other sections */}
    </>
  );
}
```

## Testing

Run tests with:

```bash
npm test
```

Run tests with UI:

```bash
npm run test:ui
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint check
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
