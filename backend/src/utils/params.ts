import { Request } from 'express';
import { ValidationError } from './errors';

export function paramId(req: Request, key = 'id'): string {
  const value = req.params[key];
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && value[0]) return value[0];
  throw new ValidationError(`Invalid route parameter: ${key}`);
}
