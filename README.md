# Orbit Transition

A framework-neutral circular page transition for modern websites.

The engine turns the element that triggered navigation into part of the transition:
the source label moves toward the viewport center, scales up, a giant circular wipe
travels left-to-right, the label becomes white where the wipe reaches it, the new
page is revealed behind the circle, and the label returns to its original position.

## Status

`1.1.0` — stable API.

The core API is intentionally small and framework-neutral. Framework adapters stay
thin so the animation engine can be used without React.

## Install

Once published to npm:

```bash
npm install orbit-transition
```

For source use, install the repository dependencies and import the local package.

## Vanilla

```js
import { createOrbitTransition } from 'orbit-transition';

const transition = createOrbitTransition({
  preset: 'cinematic',
  color: '#000000',
  labelScale: 1.8,
});

transition.bindLinks({
  onNavigate: async (url) => {
    // Swap your view or let your router handle it.
    render(url);
  },
});
```

## React

```jsx
import {
  OrbitTransitionProvider,
  TransitionLink,
} from 'orbit-transition/react';

export default function Nav() {
  return (
    <OrbitTransitionProvider preset="cinematic">
      <TransitionLink to="/about">ABOUT</TransitionLink>
    </OrbitTransitionProvider>
  );
}
```

## React Router

```jsx
import { RouterTransitionLink } from 'orbit-transition/react-router';

<RouterTransitionLink to="/projects">PROJECTS</RouterTransitionLink>
```

## Next.js App Router

```jsx
'use client';

import { NextTransitionLink } from 'orbit-transition/next';

<NextTransitionLink href="/work">WORK</NextTransitionLink>
```

## Presets

```js
import { presets } from 'orbit-transition';

presets.cinematic
presets.snappy
presets.soft
```

## Customization

```js
transition.setOptions({
  duration: 980,
  color: '#0b0b0b',
  labelScale: 1.6,
  edgeFeather: 10,
  easing: (t) => 1 - Math.pow(1 - t, 5),
});
```

Core timing controls:

- `duration`
- `centerHold`
- `sweepRatio`
- `revealRatio`
- `returnRatio`

Visual controls:

- `color`
- `labelColor`
- `labelScale`
- `startOvershoot`
- `edgeFeather`

Behavior:

- `sameOriginOnly`
- `reducedMotion`

## Lifecycle events

```js
const unsubscribe = transition.onPhase(({ name }) => {
  // start
  // label-move
  // center
  // sweep
  // covered
  // reveal
  // return
});
```

The same lifecycle is also emitted as the browser event
`circulartransition:phase`.

## Accessibility

The engine respects `prefers-reduced-motion`. Set `reducedMotion: true` to force
the accessible route behavior, or `false` to opt out of automatic detection.

During a transition the document receives `aria-busy="true"` through the framework
adapters where supported, and repeated navigation is ignored while the engine is busy.

## Architecture

```text
src/
  index.js
  presets.js
  react/
  react-router/
  next/
demo/
test/
```

The core engine is framework-neutral. Adapters are thin wrappers around it.

## Development

```bash
npm test
npm run check
```

## License

MIT


## Browser guidance

The engine uses standard DOM APIs, CSS transforms, `requestAnimationFrame`, and
`prefers-reduced-motion`. Run the included showcase in the browsers you support
before shipping, especially when combining it with a custom router or complex
layout system.


## Naming

`1.1.0` is the Orbit Transition identity release.

New projects should use `OrbitTransition` and `createOrbitTransition`.

For projects already using the `1.0.x` API, `CircularTransition` and
`createCircularTransition` remain available as deprecated compatibility aliases.
