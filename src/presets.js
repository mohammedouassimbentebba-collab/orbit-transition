export const presets = Object.freeze({
  cinematic: Object.freeze({
    duration: 1180,
    labelScale: 1.8,
    centerHold: 0.015,
    startOvershoot: 0.12,
    edgeFeather: 8,
    easing: (t) => 1 - Math.pow(1 - t, 4),
  }),
  snappy: Object.freeze({
    duration: 920,
    labelScale: 1.55,
    centerHold: 0,
    startOvershoot: 0.08,
    edgeFeather: 6,
    easing: (t) => 1 - Math.pow(1 - t, 5),
  }),
  soft: Object.freeze({
    duration: 1380,
    labelScale: 1.65,
    centerHold: 0.025,
    startOvershoot: 0.1,
    edgeFeather: 14,
    easing: (t) => 0.5 - Math.cos(Math.PI * t) / 2,
  }),
});

export function resolvePreset(nameOrOptions) {
  if (typeof nameOrOptions === 'string') return { ...(presets[nameOrOptions] || presets.cinematic) };
  if (nameOrOptions?.preset) return { ...(presets[nameOrOptions.preset] || presets.cinematic), ...nameOrOptions };
  return { ...(nameOrOptions || {}) };
}
