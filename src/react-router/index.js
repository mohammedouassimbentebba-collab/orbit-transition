import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrbitTransition } from '../react/index.js';

export function RouterTransitionLink({
  to,
  replace = false,
  onNavigate,
  children,
  ...props
}) {
  const engine = useOrbitTransition();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(async (event) => {
    if (!engine || pending) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (props.target === '_blank' || props.download) return;

    event.preventDefault();
    setPending(true);
    try {
      await engine.navigate({
        source: event.currentTarget,
        href: String(to),
        onNavigate: async () => {
          navigate(to, { replace });
          await onNavigate?.(to, event.currentTarget);
        },
      });
    } finally {
      setPending(false);
    }
  }, [engine, pending, to, replace, navigate, onNavigate, props.target, props.download]);

  return React.createElement(
    Link,
    { ...props, to, onClick: handleClick, 'aria-busy': pending ? 'true' : undefined },
    children,
  );
}
