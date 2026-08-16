import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const requiredExports = ['.', './react', './react-router', './next'];
for (const key of requiredExports) {
  if (!pkg.exports[key]) throw new Error(`Missing export: ${key}`);
}

if (pkg.version !== '1.1.0') throw new Error(`Unexpected version: ${pkg.version}`);

const core = await import(path.join(root, 'src/index.js'));
if (typeof core.OrbitTransition !== 'function') throw new Error('OrbitTransition export missing');
if (typeof core.createOrbitTransition !== 'function') throw new Error('createOrbitTransition export missing');

for (const name of ['cinematic', 'snappy', 'soft']) {
  if (!core.presets[name]) throw new Error(`Missing preset: ${name}`);
  if (typeof core.presets[name].duration !== 'number') throw new Error(`${name} duration missing`);
}

const methods = ['init', 'setOptions', 'onPhase', 'bindLinks', 'destroy', 'navigate'];
for (const method of methods) {
  if (typeof core.OrbitTransition.prototype[method] !== 'function') {
    throw new Error(`Missing public method: ${method}`);
  }
}

console.log('api-contract: ok');


const expectedFiles = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'src/index.js',
  'src/presets.js',
  'src/react/index.js',
  'src/react-router/index.js',
  'src/next/index.js'
];
for (const rel of expectedFiles) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing package file: ${rel}`);
}

if (pkg.sideEffects !== false) throw new Error('sideEffects must be false');
if (!pkg.peerDependenciesMeta?.react?.optional) throw new Error('React peer must be optional');
if (!pkg.peerDependenciesMeta?.next?.optional) throw new Error('Next peer must be optional');

console.log('package-integrity: ok');


const coreModule = await import(path.join(root, 'src/index.js'));
if (typeof coreModule.CircularTransition !== 'function') throw new Error('CircularTransition compatibility alias missing');
if (typeof coreModule.createCircularTransition !== 'function') throw new Error('createCircularTransition compatibility alias missing');
