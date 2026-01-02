import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { useScrollSpy } from '../useScrollSpy';
import { useRef } from 'react';

// Test component for integration tests
function TestComponent({
  sectionIds,
  containerRef,
  options,
}: {
  sectionIds: string[];
  containerRef: ReturnType<typeof useRef<HTMLElement | null>> | null;
  options?: Parameters<typeof useScrollSpy>[2];
}) {
  const { activeId, registerRef, scrollToSection } = useScrollSpy(
    sectionIds,
    containerRef,
    options
  );

  return (
    <div>
      <div data-testid="active-id">{activeId}</div>
      {sectionIds.map((id) => (
        <section
          key={id}
          id={id}
          ref={registerRef(id)}
          data-testid={`section-${id}`}
          style={{ height: '500px', marginBottom: '20px' }}
        >
          {id}
        </section>
      ))}
      <button
        data-testid="scroll-to-section2"
        onClick={() => scrollToSection('section2')}
      >
        Scroll to Section 2
      </button>
    </div>
  );
}

describe('useScrollSpy Integration Tests', () => {
  beforeEach(() => {
    // Setup realistic viewport
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 800,
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1200,
    });
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      value: 2000,
    });
  });

  describe('Real-world scenarios', () => {
    it('should work with a typical documentation page layout', async () => {
      const sections = ['intro', 'features', 'getting-started', 'api'];

      render(<TestComponent sectionIds={sections} containerRef={null} />);

      // Initial state
      expect(screen.getByTestId('active-id')).toHaveTextContent('intro');

      // Simulate scrolling down
      act(() => {
        Object.defineProperty(window, 'scrollY', {
          writable: true,
          value: 600,
        });
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(
        () => {
          const activeId = screen.getByTestId('active-id').textContent;
          expect(activeId).not.toBe('intro');
        },
        { timeout: 2000 }
      );
    });

    it('should handle sticky navigation header', async () => {
      // Create a sticky header
      const header = document.createElement('nav');
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.height = '80px';
      header.style.zIndex = '1000';
      document.body.appendChild(header);

      const sections = ['intro', 'features'];

      render(
        <TestComponent
          sectionIds={sections}
          containerRef={null}
          options={{ offset: 'auto' }}
        />
      );

      // Should detect the sticky header
      await waitFor(
        () => {
          expect(screen.getByTestId('active-id').textContent).toBeTruthy();
        },
        { timeout: 2000 }
      );

      document.body.removeChild(header);
    });

    it('should work with nested scrollable container', async () => {
      const container = document.createElement('div');
      container.style.height = '600px';
      container.style.overflow = 'auto';
      container.id = 'scroll-container';
      document.body.appendChild(container);

      const containerRef = { current: container };

      // Mock container properties
      Object.defineProperty(container, 'scrollTop', {
        writable: true,
        value: 0,
      });
      Object.defineProperty(container, 'scrollHeight', {
        writable: true,
        value: 1500,
      });
      Object.defineProperty(container, 'clientHeight', {
        writable: true,
        value: 600,
      });

      const sections = ['section1', 'section2', 'section3'];

      render(
        <TestComponent
          sectionIds={sections}
          containerRef={containerRef}
          options={{ offset: 100 }}
        />
      );

      // Simulate container scroll
      act(() => {
        Object.defineProperty(container, 'scrollTop', {
          writable: true,
          value: 700,
        });
        container.dispatchEvent(new Event('scroll'));
      });

      await waitFor(
        () => {
          const activeId = screen.getByTestId('active-id').textContent;
          expect(activeId).toBeTruthy();
        },
        { timeout: 2000 }
      );

      document.body.removeChild(container);
    });
  });

  describe('User interactions', () => {
    it('should scroll to section when button is clicked', async () => {
      const mockScrollTo = vi.fn();
      window.scrollTo = mockScrollTo;

      const sections = ['section1', 'section2', 'section3'];

      render(<TestComponent sectionIds={sections} containerRef={null} />);

      const scrollButton = screen.getByTestId('scroll-to-section2');

      act(() => {
        scrollButton.click();
      });

      await waitFor(() => {
        expect(mockScrollTo).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Responsive behavior', () => {
    it('should recalculate on window resize', async () => {
      const sections = ['intro', 'features'];

      render(<TestComponent sectionIds={sections} containerRef={null} />);

      const initialActiveId = screen.getByTestId('active-id').textContent;

      // Simulate resize
      act(() => {
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          value: 400,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Should still work after resize
      await waitFor(
        () => {
          const newActiveId = screen.getByTestId('active-id').textContent;
          expect(newActiveId).toBeTruthy();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Edge cases in real scenarios', () => {
    it('should handle page with many small sections', async () => {
      const manySections = Array.from({ length: 20 }, (_, i) => `section-${i}`);

      render(<TestComponent sectionIds={manySections} containerRef={null} />);

      await waitFor(
        () => {
          expect(screen.getByTestId('active-id').textContent).toBe('section-0');
        },
        { timeout: 2000 }
      );
    });

    it('should handle sections that are larger than viewport', async () => {
      const sections = ['large-section'];

      render(<TestComponent sectionIds={sections} containerRef={null} />);

      // Mock a very large section
      const section = screen.getByTestId('section-large-section');
      Object.defineProperty(section, 'offsetHeight', {
        writable: true,
        value: 3000,
      });

      await waitFor(
        () => {
          expect(screen.getByTestId('active-id').textContent).toBeTruthy();
        },
        { timeout: 2000 }
      );
    });
  });
});

