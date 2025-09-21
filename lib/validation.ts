// lib/validation.ts
import { ZodSchema } from 'zod';

export class HttpError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const raw = (await req.json()) as unknown;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request body';
    throw new HttpError(message, 400);
  }
  return parsed.data;
}
