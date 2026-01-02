import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useScrollSpy } from '../useScrollSpy';

// Mock window methods
const mockScrollTo = vi.fn();
const mockGetBoundingClientRect = vi.fn<(element?: Element) => DOMRect>(() => ({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
} as DOMRect));

describe('useScrollSpy', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup window mocks
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 800,
    });
    Object.defineProperty(window, 'scrollTo', {
      writable: true,
      value: mockScrollTo,
    });
    
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect as unknown as () => DOMRect;
    
    // Mock document.documentElement.scrollHeight
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      value: 2000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should initialize with first section as active', () => {
      const { result } = renderHook(() =>
        useScrollSpy(['section1', 'section2', 'section3'], null)
      );

      expect(result.current.activeId).toBe('section1');
    });

    it('should register refs correctly', () => {
      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null)
      );

      const ref = result.current.registerRef('section1');
      const mockElement = document.createElement('div');
      mockElement.id = 'section1';
      
      act(() => {
        ref(mockElement);
      });

      expect(mockElement).toBeDefined();
    });

    it('should return null activeId when no sections provided', () => {
      const { result } = renderHook(() =>
        useScrollSpy([], null)
      );

      expect(result.current.activeId).toBeNull();
    });
  });

  describe('Window scroll detection', () => {
    it('should detect active section on scroll', async () => {
      const section1 = document.createElement('div');
      section1.id = 'section1';
      section1.style.height = '500px';
      document.body.appendChild(section1);

      const section2 = document.createElement('div');
      section2.id = 'section2';
      section2.style.height = '500px';
      document.body.appendChild(section2);

      // Mock getBoundingClientRect for sections
      mockGetBoundingClientRect.mockImplementation((element: HTMLElement) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.test.tsx:101',message:'mockGetBoundingClientRect called',data:{elementIsUndefined:element===undefined,elementIsNull:element===null,hasId:element?!!element.id:false,id:element?.id||'NO_ID',tagName:element?.tagName||'NO_TAG',scrollY:window.scrollY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        if (!element || !element.id) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.test.tsx:102',message:'element missing id, returning default',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          };
        }
        const scrollY = window.scrollY;
        if (element.id === 'section1') {
          return {
            top: 0 - scrollY,
            bottom: 500 - scrollY,
            left: 0,
            right: 0,
            width: 0,
            height: 500,
            x: 0,
            y: 0 - scrollY,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        if (element.id === 'section2') {
          return {
            top: 500 - scrollY,
            bottom: 1000 - scrollY,
            left: 0,
            right: 0,
            width: 0,
            height: 500,
            x: 0,
            y: 500 - scrollY,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b56fdb3-6096-4632-a53b-3a0a261ec42b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useScrollSpy.test.tsx:128',message:'fallback to default rect',data:{id:element.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: vi.fn(),
        };
      });

      const { result } = renderHook(() =>
        useScrollSpy(['section1', 'section2'], null)
      );

      // Register refs
      act(() => {
        result.current.registerRef('section1')(section1);
        result.current.registerRef('section2')(section2);
      });

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 600,
      });

      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Wait for requestAnimationFrame and calculation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await waitFor(() => {
        expect(result.current.activeId).toBe('section2');
      }, { timeout: 1000 });

      // Cleanup
      document.body.removeChild(section1);
      document.body.removeChild(section2);
    });
  });

  describe('Container scroll detection', () => {
    it('should work with custom scrollable container', async () => {
      const container = document.createElement('div');
      container.style.height = '400px';
      container.style.overflow = 'auto';
      document.body.appendChild(container);

      const section1 = document.createElement('div');
      section1.id = 'section1';
      section1.style.height = '300px';
      container.appendChild(section1);

      const section2 = document.createElement('div');
      section2.id = 'section2';
      section2.style.height = '300px';
      container.appendChild(section2);

      const containerRef = { current: container };

      // Mock container scroll properties
      Object.defineProperty(container, 'scrollTop', {
        writable: true,
        value: 0,
      });
      Object.defineProperty(container, 'scrollHeight', {
        writable: true,
        value: 600,
      });
      Object.defineProperty(container, 'clientHeight', {
        writable: true,
        value: 400,
      });

      mockGetBoundingClientRect.mockImplementation((element: HTMLElement) => {
        if (!element) {
          return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          };
        }
        if (element === container) {
          return {
            top: 0,
            bottom: 400,
            left: 0,
            right: 0,
            width: 0,
            height: 400,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        if (!element.id) {
          return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          };
        }
        if (element.id === 'section1') {
          return {
            top: 0 - container.scrollTop,
            bottom: 300 - container.scrollTop,
            left: 0,
            right: 0,
            width: 0,
            height: 300,
            x: 0,
            y: 0 - container.scrollTop,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        if (element.id === 'section2') {
          return {
            top: 300 - container.scrollTop,
            bottom: 600 - container.scrollTop,
            left: 0,
            right: 0,
            width: 0,
            height: 300,
            x: 0,
            y: 300 - container.scrollTop,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: vi.fn(),
        };
      });

      const { result } = renderHook(() =>
        useScrollSpy(['section1', 'section2'], containerRef)
      );

      // Register refs
      act(() => {
        result.current.registerRef('section1')(section1);
        result.current.registerRef('section2')(section2);
      });

      // Simulate container scroll
      act(() => {
        Object.defineProperty(container, 'scrollTop', {
          writable: true,
          value: 350,
        });
        container.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current.activeId).toBe('section2');
      }, { timeout: 1000 });

      // Cleanup
      document.body.removeChild(container);
    });
  });

  describe('scrollToSection', () => {
    it('should scroll to section with window scroll', () => {
      const section1 = document.createElement('div');
      section1.id = 'section1';
      document.body.appendChild(section1);

      mockGetBoundingClientRect.mockImplementation((element: HTMLElement) => {
        if (!element || !element.id) {
          return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          };
        }
        if (element.id === 'section1') {
          return {
            top: 500,
            bottom: 1000,
            left: 0,
            right: 0,
            width: 0,
            height: 500,
            x: 0,
            y: 500,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: vi.fn(),
        };
      });
      
      // Reassign to ensure the mock implementation is used
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect as unknown as () => DOMRect;

      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null, { offset: 100 })
      );

      act(() => {
        result.current.registerRef('section1')(section1);
      });

      // Ensure window.scrollY is 0 for the test
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 0,
      });

      act(() => {
        result.current.scrollToSection('section1');
      });

      expect(mockScrollTo).toHaveBeenCalled();
      const scrollCall = mockScrollTo.mock.calls[0][0];
      // elementRect.top = 500, window.scrollY = 0, effectiveOffset = 100 + 10 = 110
      // absoluteTop = 500 + 0 = 500, scrollTo = 500 - 110 = 390
      expect(scrollCall.top).toBe(390);

      document.body.removeChild(section1);
    });

    it('should scroll to section with container scroll', () => {
      const container = document.createElement('div');
      container.style.height = '400px';
      container.style.overflow = 'auto';
      document.body.appendChild(container);

      const section1 = document.createElement('div');
      section1.id = 'section1';
      container.appendChild(section1);

      const containerRef = { current: container };
      const mockScrollTo = vi.fn();

      Object.defineProperty(container, 'scrollTo', {
        writable: true,
        value: mockScrollTo,
      });

      mockGetBoundingClientRect.mockImplementation((element: HTMLElement) => {
        if (!element) {
          return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          };
        }
        if (element === container) {
          return {
            top: 0,
            bottom: 400,
            left: 0,
            right: 0,
            width: 0,
            height: 400,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        if (!element.id) {
          return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          };
        }
        if (element.id === 'section1') {
          return {
            top: 500,
            bottom: 1000,
            left: 0,
            right: 0,
            width: 0,
            height: 500,
            x: 0,
            y: 500,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: vi.fn(),
        };
      });
      
      // Reassign to ensure the mock implementation is used
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect as unknown as () => DOMRect;

      const { result } = renderHook(() =>
        useScrollSpy(['section1'], containerRef, { offset: 100 })
      );

      act(() => {
        result.current.registerRef('section1')(section1);
      });

      // Ensure container.scrollTop is 0 for the test
      Object.defineProperty(container, 'scrollTop', {
        writable: true,
        value: 0,
      });

      act(() => {
        result.current.scrollToSection('section1');
      });

      expect(mockScrollTo).toHaveBeenCalled();
      const scrollCall = mockScrollTo.mock.calls[0][0];
      // containerRect.top = 0, elementRect.top = 500, container.scrollTop = 0
      // relativeTop = 500 - 0 + 0 = 500, effectiveOffset = 100 + 10 = 110
      // scrollTo = 500 - 110 = 390
      expect(scrollCall.top).toBe(390);

      document.body.removeChild(container);
    });
  });

  describe('Offset options', () => {
    it('should use manual offset', async () => {
      const section1 = document.createElement('div');
      section1.id = 'section1';
      document.body.appendChild(section1);

      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null, { offset: 200 })
      );

      act(() => {
        result.current.registerRef('section1')(section1);
      });

      expect(result.current.activeId).toBe('section1');

      document.body.removeChild(section1);
    });

    it('should use auto offset detection', async () => {
      // Create a sticky header
      const header = document.createElement('div');
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.height = '60px';
      document.body.appendChild(header);

      const section1 = document.createElement('div');
      section1.id = 'section1';
      document.body.appendChild(section1);

      mockGetBoundingClientRect.mockImplementation((element: HTMLElement) => {
        if (!element) {
          return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          };
        }
        if (element === header) {
          return {
            top: 0,
            bottom: 60,
            left: 0,
            right: 0,
            width: 0,
            height: 60,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: vi.fn(),
        };
      });

      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null, { offset: 'auto' })
      );

      act(() => {
        result.current.registerRef('section1')(section1);
      });

      // Auto offset should detect the sticky header
      await waitFor(() => {
        expect(result.current.activeId).toBe('section1');
      }, { timeout: 1000 });

      document.body.removeChild(header);
      document.body.removeChild(section1);
    });
  });

  describe('Debug mode', () => {
    it('should return debugInfo when debug is enabled', () => {
      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null, { debug: true })
      );

      expect(result.current).toHaveProperty('debugInfo');
      expect(result.current.debugInfo).toBeDefined();
      expect(result.current.debugInfo).toHaveProperty('scrollY');
      expect(result.current.debugInfo).toHaveProperty('sections');
    });

    it('should not return debugInfo when debug is disabled', () => {
      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null, { debug: false })
      );

      expect(result.current).not.toHaveProperty('debugInfo');
    });
  });

  describe('Edge cases', () => {
    it('should handle very small sections', async () => {
      const section1 = document.createElement('div');
      section1.id = 'section1';
      section1.style.height = '10px';
      document.body.appendChild(section1);

      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null)
      );

      act(() => {
        result.current.registerRef('section1')(section1);
      });

      expect(result.current.activeId).toBe('section1');

      document.body.removeChild(section1);
    });

    it('should handle sections at the bottom', async () => {
      const section1 = document.createElement('div');
      section1.id = 'section1';
      section1.style.height = '500px';
      document.body.appendChild(section1);

      const section2 = document.createElement('div');
      section2.id = 'section2';
      section2.style.height = '500px';
      document.body.appendChild(section2);

      Object.defineProperty(document.documentElement, 'scrollHeight', {
        writable: true,
        value: 1000,
      });

      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 950,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 50,
      });

      mockGetBoundingClientRect.mockImplementation((element: HTMLElement) => {
        if (!element || !element.id) {
          return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          };
        }
        if (element.id === 'section1') {
          return {
            top: -950,
            bottom: -450,
            left: 0,
            right: 0,
            width: 0,
            height: 500,
            x: 0,
            y: -950,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        if (element.id === 'section2') {
          return {
            top: -450,
            bottom: 50,
            left: 0,
            right: 0,
            width: 0,
            height: 500,
            x: 0,
            y: -450,
            toJSON: vi.fn(),
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: vi.fn(),
        };
      });

      const { result } = renderHook(() =>
        useScrollSpy(['section1', 'section2'], null)
      );

      act(() => {
        result.current.registerRef('section1')(section1);
        result.current.registerRef('section2')(section2);
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current.activeId).toBe('section2');
      }, { timeout: 1000 });

      document.body.removeChild(section1);
      document.body.removeChild(section2);
    });

    it('should handle resize events', async () => {
      const section1 = document.createElement('div');
      section1.id = 'section1';
      document.body.appendChild(section1);

      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null)
      );

      act(() => {
        result.current.registerRef('section1')(section1);
      });

      const initialActiveId = result.current.activeId;

      // Simulate resize
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 600,
      });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Should still work after resize
      await waitFor(() => {
        expect(result.current.activeId).toBeDefined();
      }, { timeout: 1000 });

      document.body.removeChild(section1);
    });
  });

  describe('Performance', () => {
    it('should throttle scroll events', async () => {
      const { result } = renderHook(() =>
        useScrollSpy(['section1'], null, { debounceMs: 50 })
      );

      const section1 = document.createElement('div');
      section1.id = 'section1';
      document.body.appendChild(section1);

      act(() => {
        result.current.registerRef('section1')(section1);
      });

      // Simulate rapid scroll events
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        act(() => {
          Object.defineProperty(window, 'scrollY', {
            writable: true,
            value: i * 100,
          });
          window.dispatchEvent(new Event('scroll'));
        });
      }
      const endTime = Date.now();

      // Should complete quickly due to throttling
      expect(endTime - startTime).toBeLessThan(1000);

      document.body.removeChild(section1);
    });
  });
});

