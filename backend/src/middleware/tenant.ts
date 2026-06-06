import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../types';
import { ForbiddenError, TenantViolationError, NotFoundError } from '../utils/errors';
import { prisma } from '../lib/prisma';

/**
 * Multi-Tenancy Security Layer
 *
 * Strategy:
 * 1. JWT carries academyId for tenant users (null for SUPER_ADMIN)
 * 2. Middleware injects req.academyId — the ONLY tenant identifier used downstream
 * 3. SUPER_ADMIN must explicitly pass ?academyId or x-academy-id header for tenant ops
 * 4. All tenant-scoped services MUST use tenantWhere() helper — never trust client body academyId
 * 5. Cross-tenant resource access blocked at middleware + service + unique constraints
 */
export const resolveTenant = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) throw new ForbiddenError();

  if (req.user.role === UserRole.SUPER_ADMIN) {
    const headerAcademy = req.headers['x-academy-id'] as string | undefined;
    const queryAcademy = req.query.academyId as string | undefined;
    req.academyId = headerAcademy || queryAcademy || null;
    return next();
  }

  if (!req.user.academyId) {
    throw new ForbiddenError('No academy associated with this account');
  }

  const academy = await prisma.academy.findUnique({
    where: { id: req.user.academyId },
    select: { id: true, status: true, subscriptionStatus: true },
  });

  if (!academy) throw new NotFoundError('Academy not found');
  if (academy.status !== 'ACTIVE') {
    throw new ForbiddenError('Academy is inactive or suspended');
  }

  req.academyId = req.user.academyId;
  next();
};

export const requireTenant = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!req.academyId) {
    throw new ForbiddenError('Academy context required for this operation');
  }
  next();
};

export const enforceTenantOwnership = (resourceAcademyId: string | null, reqAcademyId: string | null | undefined) => {
  if (!reqAcademyId) {
    throw new TenantViolationError();
  }
  if (resourceAcademyId !== reqAcademyId) {
    throw new TenantViolationError('Resource belongs to a different academy');
  }
};

export const tenantWhere = (academyId: string) => ({ academyId });
