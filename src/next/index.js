'use client';

import React, { useCallback, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrbitTransition } from '../react/index.js';

export function NextTransitionLink({
  href,
  replace = false,
  onNavigate,
  children,
  ...props
}) {
  const engine = useOrbitTransition();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(async (event) => {
    if (!engine || pending) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (props.target === '_blank' || props.download) return;

    const url = new URL(String(href), window.location.href);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    setPending(true);
    try {
      await engine.navigate({
        source: event.currentTarget,
        href: url.href,
        onNavigate: async () => {
          if (replace) router.replace(String(href));
          else router.push(String(href));
          await onNavigate?.(url, event.currentTarget);
        },
      });
    } finally {
      setPending(false);
    }
  }, [engine, pending, href, replace, router, onNavigate, props.target, props.download]);

  return React.createElement(
    NextLink,
    { ...props, href, onClick: handleClick, 'aria-busy': pending ? 'true' : undefined },
    children,
  );
}
