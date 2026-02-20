import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export const parseWithSchema = <T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): z.infer<T> => {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: parsed.error.flatten(),
    });
  }

  return parsed.data;
};
