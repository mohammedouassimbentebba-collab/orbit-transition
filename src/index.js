import { resolvePreset } from './presets.js';

export class OrbitTransition {
  constructor(options = {}) {
    const presetOptions = resolvePreset(options);
    this.options = {
      duration: 1240,
      color: '#000000',
      labelColor: '#ffffff',
      labelScale: 1.8,
      centerHold: 0.02,
      preset: 'cinematic',
      startOvershoot: 0.12,
      edgeFeather: 8,
      sweepRatio: 0.42,
      revealRatio: 0.16,
      returnRatio: 0.16,
      sameOriginOnly: true,
      reducedMotion: undefined,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      ...presetOptions,
    };

    this.running = false;
    this.overlay = null;
    this.labelBase = null;
    this.labelWhite = null;
    this.styleTag = null;
    this._unbindLinks = null;
    this._phaseListeners = new Set();
  }

  init() {
    if (this.overlay) return this;

    this.styleTag = document.createElement('style');
    this.styleTag.dataset.circularTransition = '';
    this.styleTag.textContent = `
      .ct-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        pointer-events: none;
        overflow: hidden;
        isolation: isolate;
      }
      .ct-orbit {
        position: absolute;
        width: var(--ct-diameter);
        height: var(--ct-diameter);
        left: 0;
        top: 50%;
        border-radius: 50%;
        background: var(--ct-color);
        transform: translate3d(var(--ct-x), -50%, 0) translateX(-50%);
        will-change: transform;
      }
      .ct-label {
        position: fixed;
        left: 0;
        top: 0;
        margin: 0;
        z-index: 3;
        pointer-events: none;
        transform-origin: center center;
        will-change: transform, opacity, -webkit-mask-image, mask-image, -webkit-mask-size, mask-size;
        white-space: nowrap;
      }
      .ct-label--base { z-index: 1; }
      .ct-label--white {
        z-index: 2;
        color: #fff !important;
        opacity: 1;
      }
      @media (prefers-reduced-motion: reduce) {
        .ct-orbit, .ct-label { animation: none !important; }
      }
    `;
    document.head.appendChild(this.styleTag);

    this.overlay = document.createElement('div');
    this.overlay.className = 'ct-overlay';
    this.overlay.style.setProperty('--ct-color', this.options.color);
    this.overlay.style.setProperty('--ct-label-color', this.options.labelColor || '#fff');
    this.overlay.innerHTML = '<div class="ct-orbit"></div>';
    document.body.appendChild(this.overlay);
    return this;
  }

  setOptions(next = {}) {
    this.options = { ...this.options, ...resolvePreset(next) };
    if (this.overlay) {
      this.overlay.style.setProperty('--ct-color', this.options.color);
      this.overlay.style.setProperty('--ct-label-color', this.options.labelColor || '#fff');
    }
    return this;
  }

  onPhase(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    this._phaseListeners.add(listener);
    return () => this._phaseListeners.delete(listener);
  }

  #emitPhase(name, detail = {}) {
    for (const listener of this._phaseListeners) {
      try { listener({ name, ...detail }); } catch { /* listeners must not break transitions */ }
    }
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('circulartransition:phase', { detail: { name, ...detail } }));
    }
  }

  bindLinks({
    selector = 'a[href], [data-transition-href]',
    getHref = (el) => el.getAttribute('data-transition-href') || el.getAttribute('href'),
    onNavigate,
    replace = false,
    pushState = true,
  } = {}) {
    this.init();
    if (this._unbindLinks) this._unbindLinks();

    const handler = async (event) => {
      const source = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!(source instanceof HTMLElement)) return;
      const rawHref = getHref(source);
      if (!rawHref) return;
      if (event.defaultPrevented || event.button !== undefined && event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (source.hasAttribute('download') || source.target === '_blank') return;

      let url;
      try { url = new URL(rawHref, window.location.href); }
      catch { return; }
      if (this.options.sameOriginOnly && url.origin !== window.location.origin) return;
      if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) return;

      event.preventDefault();
      await this.navigate({
        source,
        href: url.href,
        onNavigate: async () => {
          if (pushState && typeof history !== 'undefined') {
            const state = { ...(history.state || {}), circularTransition: true };
            if (replace) history.replaceState(state, '', url.href);
            else history.pushState(state, '', url.href);
          }
          if (typeof onNavigate === 'function') return onNavigate(url, source);
          window.dispatchEvent(new CustomEvent('circulartransition:navigate', { detail: { url, source } }));
        },
      });
    };

    document.addEventListener('click', handler);
    this._unbindLinks = () => document.removeEventListener('click', handler);
    return this._unbindLinks;
  }

  destroy() {
    this._unbindLinks?.();
    this._unbindLinks = null;
    this._cleanup();
    this.overlay?.remove();
    this.overlay = null;
    this.styleTag?.remove();
    this.styleTag = null;
  }

  async navigate({ source, onNavigate, href } = {}) {
    if (this.running) return false;
    if (typeof document === 'undefined' || typeof window === 'undefined') throw new Error('CircularTransition requires a browser environment');
    if (!(source instanceof HTMLElement)) {
      throw new TypeError('source must be an HTMLElement');
    }

    this.init();
    this.running = true;
    this.#emitPhase('start', { source, href });

    const prefersReduced = Boolean(this.options.reducedMotion === true || (this.options.reducedMotion !== false && window.matchMedia('(prefers-reduced-motion: reduce)').matches));
    if (prefersReduced) {
      try {
        this.#emitPhase('reduced-motion', { source, href });
        if (typeof onNavigate === 'function') await onNavigate(href);
        else if (href) window.location.assign(href);
        return true;
      } finally {
        this.running = false;
      }
    }

    const duration = Math.max(840, Number(this.options.duration) || 1240);
    const scaleEnd = Math.max(1, Number(this.options.labelScale) || 1.8);
    const rect = source.getBoundingClientRect();
    const computed = getComputedStyle(source);

    this.#buildLabelPair(source, rect, computed);

    const orbit = this.overlay.querySelector('.ct-orbit');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const radius = Math.hypot(vw, vh) * 0.77;
    const diameter = radius * 2;
    orbit.style.setProperty('--ct-diameter', `${diameter}px`);

    const overshoot = Math.max(0, Number(this.options.startOvershoot) || 0.12);
    const startCx = -radius - vw * overshoot;
    const coverCx = vw / 2;
    const endCx = vw + radius + vw * overshoot;

    this.#setOrbitX(orbit, startCx);

    const previousScrollState = {
      htmlOverflow: document.documentElement.style.overflow,
      htmlCursor: document.documentElement.style.cursor,
      bodyOverflow: document.body.style.overflow,
    };
    document.documentElement.dataset.ctTransitioning = 'true';
    document.documentElement.style.cursor = 'wait';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const scaleDuration = duration * 0.24;
    const start = { x: rect.left, y: rect.top };
    const scaledW = rect.width * scaleEnd;
    const scaledH = rect.height * scaleEnd;
    const target = {
      x: (vw - scaledW) / 2,
      y: (vh - scaledH) / 2,
    };

    const updateLabels = (x, y, scale, cx, opacity = 1, forceWhite = false) => {
      this.#setLabelsTransform(x - rect.left, y - rect.top, scale);
      this.labelBase.style.opacity = String(opacity);
      this.labelWhite.style.opacity = String(opacity);
      this.#setLabelColorMode(cx, rect, { x, y, scale }, radius, forceWhite);
    };

    try {
      this.#emitPhase('label-move', { source, href });
      this.#emitPhase('sweep', { source, href });
      await this.#animate((raw) => {
        const p = this.#ease(raw);
        const x = start.x + (target.x - start.x) * p;
        const y = start.y + (target.y - start.y) * p;
        const scale = 1 + (scaleEnd - 1) * p;
        updateLabels(x, y, scale, startCx);
      }, scaleDuration);

      this.#emitPhase('center', { source, href });
      if (this.options.centerHold > 0) {
        await this.#sleep(duration * Number(this.options.centerHold));
      }

      const sweepRatio = Math.min(0.72, Math.max(0.2, Number(this.options.sweepRatio ?? 0.42) || 0.42));
      const revealRatio = Math.min(0.28, Math.max(0.08, Number(this.options.revealRatio ?? 0.16) || 0.16));
      const returnRatio = Math.min(0.28, Math.max(0.08, Number(this.options.returnRatio ?? 0.16) || 0.16));
      const sweepDuration = duration * sweepRatio;
      await this.#animate((raw) => {
        const p = this.#ease(raw);
        const cx = startCx + (endCx - startCx) * p;
        updateLabels(target.x, target.y, scaleEnd, cx);
        this.#setOrbitX(orbit, cx);
      }, sweepDuration);

      this.#setOrbitX(orbit, coverCx);
      updateLabels(target.x, target.y, scaleEnd, coverCx, 1, true);
      await new Promise(requestAnimationFrame);

      this.#emitPhase('covered', { source, href });
      if (typeof onNavigate === 'function') {
        await onNavigate(href);
      } else if (href) {
        window.location.assign(href);
        return true;
      }

      this.#emitPhase('reveal', { source, href });
      const revealDuration = duration * revealRatio;
      await this.#animate((raw) => {
        const p = this.#ease(raw);
        const cx = coverCx + (endCx - coverCx) * p;
        this.#setOrbitX(orbit, cx);
        const opacity = 1 - p;
        updateLabels(target.x, target.y, scaleEnd, cx, Math.max(0, opacity));
      }, revealDuration);

      this.#emitPhase('return', { source, href });
      const returnDuration = duration * returnRatio;
      await this.#animate((raw) => {
        const p = this.#ease(raw);
        const x = target.x + (start.x - target.x) * p;
        const y = target.y + (start.y - target.y) * p;
        const scale = scaleEnd + (1 - scaleEnd) * p;
        updateLabels(x, y, scale, endCx, Math.max(0, 1 - p), false);
      }, returnDuration);

      return true;
    } finally {
      restoreScroll();
      this.#cleanup(previousScrollState);
    }
  }

  #buildLabelPair(source, rect, computed) {
    const makeLabel = (extraClass) => {
      const node = source.cloneNode(true);
      node.className = `ct-label ${extraClass}`;
      node.removeAttribute('id');
      node.setAttribute('aria-hidden', 'true');
      node.style.font = computed.font;
      node.style.fontFamily = computed.fontFamily;
      node.style.fontSize = computed.fontSize;
      node.style.fontWeight = computed.fontWeight;
      node.style.fontStyle = computed.fontStyle;
      node.style.letterSpacing = computed.letterSpacing;
      node.style.lineHeight = computed.lineHeight;
      node.style.textTransform = computed.textTransform;
      node.style.width = `${rect.width}px`;
      node.style.height = `${rect.height}px`;
      node.style.left = `${rect.left}px`;
      node.style.top = `${rect.top}px`;
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      node.style.justifyContent = 'center';
      return node;
    };

    this.labelBase = makeLabel('ct-label--base');
    this.labelBase.style.color = computed.color;

    this.labelWhite = makeLabel('ct-label--white');
    this.labelWhite.style.color = this.options.labelColor || '#fff';

    this.overlay.append(this.labelBase, this.labelWhite);
  }

  #setLabelsTransform(tx, ty, scale) {
    const transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    this.labelBase.style.transform = transform;
    this.labelWhite.style.transform = transform;
  }

  #setLabelColorMode(cx, rect, transformState, radius, forceWhite = false) {
    const { x, y, scale } = transformState;
    const localCx = (cx - x) / Math.max(0.0001, scale);
    const localCy = ((window.innerHeight / 2) - y) / Math.max(0.0001, scale);
    const localRadius = radius / Math.max(0.0001, scale);
    const feather = Math.max(2, Number(this.options.edgeFeather) || 8);

    const outer = forceWhite ? localRadius + feather : Math.max(0, localRadius + feather);
    const inner = Math.max(0, localRadius - feather);
    const gradient = `radial-gradient(circle at ${localCx}px ${localCy}px, #fff ${inner}px, rgba(255,255,255,0) ${outer}px)`;
    this.labelWhite.style.webkitMaskImage = gradient;
    this.labelWhite.style.maskImage = gradient;
    this.labelWhite.style.webkitMaskRepeat = 'no-repeat';
    this.labelWhite.style.maskRepeat = 'no-repeat';
  }

  #setOrbitX(orbit, centerX) {
    orbit.style.setProperty('--ct-x', `${centerX}px`);
  }

  #ease(t) {
    const fn = this.options.easing;
    return typeof fn === 'function' ? fn(Math.max(0, Math.min(1, t))) : t;
  }

  #animate(step, duration) {
    return new Promise((resolve) => {
      const ms = Math.max(1, duration);
      const start = performance.now();
      const frame = (now) => {
        const p = Math.min(1, (now - start) / ms);
        step(p);
        if (p < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  #sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  #cleanup(previousScrollState = null) {
    this.labelBase?.remove();
    this.labelWhite?.remove();
    this.labelBase = null;
    this.labelWhite = null;
    this.running = false;
    document.documentElement.removeAttribute('data-ct-transitioning');
    document.documentElement.style.cursor = previousScrollState?.htmlCursor ?? '';
    document.documentElement.style.overflow = previousScrollState?.htmlOverflow ?? '';
    document.body.style.overflow = previousScrollState?.bodyOverflow ?? '';
  }
}

export function createOrbitTransition(options) {
  const engine = new CircularTransition(options);
  engine.init();
  return engine;
}

export { presets, resolvePreset } from './presets.js';


/** @deprecated Use OrbitTransition instead. */
export const CircularTransition = OrbitTransition;

/** @deprecated Use createOrbitTransition instead. */
export const createCircularTransition = createOrbitTransition;
