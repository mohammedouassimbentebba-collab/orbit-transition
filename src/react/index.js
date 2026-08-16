import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createOrbitTransition } from '../index.js';

const OrbitTransitionContext = createContext(null);

export function OrbitTransitionProvider({ options, children }) {
  const engineRef = useRef(null);
  const [engine, setEngine] = useState(null);

  useEffect(() => {
    const instance = createOrbitTransition(options);
    engineRef.current = instance;
    setEngine(instance);
    return () => {
      instance.destroy();
      engineRef.current = null;
      setEngine(null);
    };
  }, []);

  const value = useMemo(() => ({ engine }), [engine]);
  return React.createElement(OrbitTransitionContext.Provider, { value }, children);
}

export function useOrbitTransition() {
  const ctx = useContext(OrbitTransitionContext);
  if (!ctx) throw new Error('useOrbitTransition must be used inside OrbitTransitionProvider');
  return ctx.engine;
}

export function TransitionLink({
  to,
  replace = false,
  onNavigate,
  children,
  className,
  style,
  target,
  rel,
  ...rest
}) {
  const engine = useOrbitTransition();
  const fallbackRef = useRef(null);
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(async (event) => {
    if (!engine || pending) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (target === '_blank' || rest.download) return;

    let url;
    try { url = new URL(to, window.location.href); }
    catch { return; }
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href && url.hash) return;

    event.preventDefault();
    setPending(true);
    try {
      await engine.navigate({
        source: event.currentTarget,
        href: url.href,
        onNavigate: async (href) => {
          const state = { ...(history.state || {}), circularTransition: true };
          if (replace) history.replaceState(state, '', href);
          else history.pushState(state, '', href);
          await onNavigate?.(url, event.currentTarget);
        },
      });
    } finally {
      setPending(false);
    }
  }, [engine, pending, to, target, rest.download, replace, onNavigate]);

  return React.createElement(
    'a',
    {
      ref: fallbackRef,
      href: to,
      onClick: handleClick,
      className,
      style,
      target,
      rel,
      'aria-busy': pending ? 'true' : undefined,
      ...rest,
    },
    children,
  );
}


/** @deprecated Use OrbitTransitionProvider instead. */
export const CircularTransitionProvider = OrbitTransitionProvider;

/** @deprecated Use useOrbitTransition instead. */
export const useCircularTransition = useOrbitTransition;
