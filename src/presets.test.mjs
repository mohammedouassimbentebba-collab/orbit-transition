import assert from 'node:assert/strict';
import { presets, resolvePreset } from './presets.js';
assert.equal(resolvePreset('snappy').duration, presets.snappy.duration);
assert.equal(resolvePreset({ preset: 'soft', duration: 1000 }).duration, 1000);
console.log('preset: ok');
