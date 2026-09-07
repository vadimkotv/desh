import type { Prisma } from '../generated/prisma/client';

// USDC math helpers. Amounts cross three representations:
//   number (API/JSON, 6 dp) ↔ Prisma.Decimal (DB) ↔ bigint base units (chain).
export const USDC_DECIMALS = 6;
const SCALE = 10n ** BigInt(USDC_DECIMALS);

export const toBaseUnits = (usdc: number): bigint => BigInt(Math.round(usdc * 1e6));

export const fromBaseUnits = (units: bigint): number => Number(units) / Number(SCALE);

export const decimalToNumber = (d: Prisma.Decimal | number | string): number => Number(d);

export const bpsOf = (amount: number, bps: number): number => (amount * bps) / 10_000;

export const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;
