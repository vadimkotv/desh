// Fails CI if any source file exceeds the 100-line budget.
// Complements the ESLint rule so the constraint also covers .sol / .prisma files.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const LIMIT = 100;
const EXT = new Set(['.ts', '.tsx', '.sol', '.mjs']);
const SKIP = new Set(['node_modules', 'dist', '.next', 'generated', 'out', 'cache', '.git']);
const isVendoredLib = (dir, name) => name === 'lib' && dir.includes('contracts');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || isVendoredLib(dir, name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXT.has(extname(name))) yield path;
  }
}

const offenders = [];
for (const file of walk(process.cwd())) {
  const lines = readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.trim().startsWith('//')).length;
  if (lines > LIMIT) offenders.push(`${file} (${lines})`);
}

if (offenders.length) {
  console.error(`Files over ${LIMIT} lines:\n${offenders.join('\n')}`);
  process.exit(1);
}
console.log('All source files are within the 100-line budget.');
