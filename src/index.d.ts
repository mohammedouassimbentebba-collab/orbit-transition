export type PresetName = 'cinematic' | 'snappy' | 'soft';

export type TransitionPhase =
  | 'idle'
  | 'start'
  | 'label-move'
  | 'center'
  | 'sweep'
  | 'covered'
  | 'reveal'
  | 'return';

export interface PhaseEvent {
  name: TransitionPhase;
  url?: string;
  source?: HTMLElement;
}

export interface OrbitTransitionOptions {
  duration?: number;
  color?: string;
  labelColor?: string;
  labelScale?: number;
  centerHold?: number;
  preset?: PresetName;
  startOvershoot?: number;
  edgeFeather?: number;
  sweepRatio?: number;
  revealRatio?: number;
  returnRatio?: number;
  sameOriginOnly?: boolean;
  reducedMotion?: boolean;
  easing?: (t: number) => number;
}

export interface NavigateOptions {
  source?: Element | HTMLElement | null;
  href: string;
  onNavigate?: (href: string) => void | Promise<void>;
}

export interface BindLinksOptions {
  onNavigate?: (url: URL) => void | Promise<void>;
  container?: HTMLElement | Document;
}

export class OrbitTransition {
  constructor(options?: Partial<OrbitTransitionOptions>);
  options: OrbitTransitionOptions;
  running: boolean;
  init(): this;
  setOptions(next?: Partial<OrbitTransitionOptions>): this;
  onPhase(listener: (event: PhaseEvent) => void): () => void;
  bindLinks(options?: BindLinksOptions): () => void;
  navigate(options: NavigateOptions): Promise<void>;
  destroy(): void;
}

export function createOrbitTransition(options?: Partial<OrbitTransitionOptions>): OrbitTransition;

export const presets: Record<PresetName, OrbitTransitionOptions>;
export function resolvePreset(options?: Partial<OrbitTransitionOptions> | PresetName): OrbitTransitionOptions;

/** @deprecated Use OrbitTransition instead. */
export const CircularTransition: typeof OrbitTransition;

/** @deprecated Use createOrbitTransition instead. */
export const createCircularTransition: typeof createOrbitTransition;
