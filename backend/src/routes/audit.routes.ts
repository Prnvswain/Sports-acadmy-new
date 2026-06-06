import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { withTenant, getPagination } from '../utils/tenantQuery';

const router = Router();

router.use(authenticate, resolveTenant, requireTenant);
router.use(requireRoles(UserRole.ACADEMY_ADMIN, UserRole.SUPER_ADMIN));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const { page, limit, skip } = getPagination(Number(req.query.page), Number(req.query.limit));

    const where = withTenant(academyId!);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendPaginated(res, logs, total, page, limit);
  })
);

export default router;
