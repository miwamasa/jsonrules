import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourcePath = new URL('../src/browser/json-mini.js', import.meta.url);
const distDir = new URL('../dist/', import.meta.url);
const distPath = new URL('../dist/json-mini.min.js', import.meta.url);

const source = await readFile(sourcePath, 'utf8');
await mkdir(distDir, { recursive: true });
await writeFile(distPath, source, 'utf8');

console.log('Built dist/json-mini.min.js');
