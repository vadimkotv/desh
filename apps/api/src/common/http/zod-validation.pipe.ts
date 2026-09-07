import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

// Tiny bridge between zod (our contract language) and Nest's pipe system.
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new BadRequestException({ message, error: 'ValidationError' });
  }
}
