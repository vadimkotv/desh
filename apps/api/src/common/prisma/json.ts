import type { Prisma } from '../../generated/prisma/client';

// Prisma's Json input type rejects structural TS types; our DTOs are plain JSON by
// construction (zod-validated), so this single cast is the only place we assert it.
export const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;
