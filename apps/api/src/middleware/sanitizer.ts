import { type Request, type Response, type NextFunction } from 'express';

const SAFE_PROMPT_REGEX = /[`<>]|<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|option)[^>]*>/gi;

export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction): void {
  function sanitize(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.replace(SAFE_PROMPT_REGEX, '').trim();
    }

    if (Array.isArray(value)) {
      return value.map(sanitize);
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitize(entry)]),
      );
    }

    return value;
  }

  req.body = sanitize(req.body);
  next();
}
