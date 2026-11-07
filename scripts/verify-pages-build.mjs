import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = process.env.VITE_BASE_PATH || '/AI-PDF-STUDIO/';
const htmlPath = resolve('dist/index.html');
let html;
try {
  html = readFileSync(htmlPath, 'utf8');
} catch {
  console.error('Pages build artifact is missing: dist/index.html');
  process.exit(1);
}

if (html.includes('/src/main.tsx')) {
  console.error('Production HTML still references the uncompiled Vite source entry.');
  process.exit(1);
}

const assetPaths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => match[1])
  .filter(path => /\.(?:js|css)(?:$|\?)/.test(path));

if (!assetPaths.some(path => path.endsWith('.js'))) {
  console.error('No compiled JavaScript entry was found in dist/index.html.');
  process.exit(1);
}

const invalid = assetPaths.filter(path => !path.startsWith(base));
if (invalid.length) {
  console.error(`Assets do not use the configured base path ${base}: ${invalid.join(', ')}`);
  process.exit(1);
}

console.log(`Verified ${assetPaths.length} compiled asset references under ${base}.`);
