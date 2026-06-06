import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  academyId: string | null;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  academyId?: string | null;
  coachId?: string;
}

export interface TenantContext {
  academyId: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}
