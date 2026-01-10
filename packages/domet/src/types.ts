import type { RefObject } from "react";

export type ScrollContainer = RefObject<HTMLElement | null>;

export type Offset = number | `${number}%`;

export type SectionBounds = {
  top: number;
  bottom: number;
  height: number;
};

export type ScrollState = {
  y: number;
  progress: number;
  direction: "up" | "down" | null;
  velocity: number;
  scrolling: boolean;
  maxScroll: number;
  viewportHeight: number;
  triggerOffset: number;
  triggerLine: number;
};

export type SectionState = {
  bounds: SectionBounds;
  visibility: number;
  progress: number;
  inView: boolean;
  active: boolean;
  rect: DOMRect | null;
};

export type ScrollBehavior = "smooth" | "instant" | "auto";

export type ScrollToPosition = "top" | "center" | "bottom";

export type ScrollTarget =
  | string
  | { id: string }
  | { top: number };

export type ScrollToOptions = {
  offset?: Offset;
  behavior?: ScrollBehavior;
  position?: ScrollToPosition;
  lockActive?: boolean;
};

export type DometOptions = {
  ids: string[];
  selector?: never;
  container?: ScrollContainer;
  triggerOffset?: Offset;
  throttle?: number;
  threshold?: number;
  hysteresis?: number;
  behavior?: ScrollBehavior;
  scrollTo?: ScrollToOptions;
  onActive?: (id: string | null, prevId: string | null) => void;
  onEnter?: (id: string) => void;
  onLeave?: (id: string) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
} | {
  ids?: never;
  selector: string;
  container?: ScrollContainer;
  triggerOffset?: Offset;
  throttle?: number;
  threshold?: number;
  hysteresis?: number;
  behavior?: ScrollBehavior;
  scrollTo?: ScrollToOptions;
  onActive?: (id: string | null, prevId: string | null) => void;
  onEnter?: (id: string) => void;
  onLeave?: (id: string) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
};

export type RegisterProps = {
  id: string;
  ref: (el: HTMLElement | null) => void;
  "data-domet": string;
};

export type LinkProps = {
  onClick: () => void;
  "aria-current": "page" | undefined;
  "data-active": boolean;
};

export type UseDometReturn = {
  active: string | null;
  index: number;
  progress: number;
  direction: "up" | "down" | null;
  scroll: ScrollState;
  sections: Record<string, SectionState>;
  ids: string[];
  scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
  register: (id: string) => RegisterProps;
  link: (id: string, options?: ScrollToOptions) => LinkProps;
};

export type ResolvedSection = {
  id: string;
  element: HTMLElement;
};

export type InternalSectionBounds = SectionBounds & { id: string };

export type SectionScore = {
  id: string;
  score: number;
  visibilityRatio: number;
  inView: boolean;
  bounds: InternalSectionBounds;
  progress: number;
  rect: DOMRect | null;
};
