// Copies the `abi` array of compiled contracts from Foundry's `out/` into `abi/*.abi.json`
// so apps/api and apps/web can import a stable, dependency-free ABI.
// Usage: forge build && node scripts/export-abi.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTRACTS = ['RoundEscrow'];

function exportAbi(name) {
  const artifact = join(root, 'out', `${name}.sol`, `${name}.json`);
  const { abi } = JSON.parse(readFileSync(artifact, 'utf8'));
  const target = join(root, 'abi', `${name}.abi.json`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(abi, null, 2)}\n`);
  return { name, target, entries: abi.length };
}

for (const { name, target, entries } of CONTRACTS.map(exportAbi)) {
  console.log(`${name}: ${entries} ABI entries -> ${target}`);
}
