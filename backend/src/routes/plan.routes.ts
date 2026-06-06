import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { withTenant, assertTenantMatch } from '../utils/tenantQuery';
import { NotFoundError } from '../utils/errors';
import { paramId } from '../utils/params';

const router = Router();
const schema = z.object({
  name: z.string().min(1),
  duration: z.number().int().positive(),
  multiplier: z.number().positive(),
  isCustom: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

router.use(authenticate, resolveTenant, requireTenant);

router.get(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN, UserRole.COACH),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const plans = await prisma.membershipPlan.findMany({
      where: withTenant(academyId!),
      orderBy: { duration: 'asc' },
    });
    sendSuccess(res, plans);
  })
);

router.post(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = schema.parse(req.body);
    const plan = await prisma.membershipPlan.create({
      data: { ...body, academyId: academyId! },
    });
    sendSuccess(res, plan, 'Plan created', 201);
  })
);

router.patch(
  '/:id',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const existing = await prisma.membershipPlan.findUnique({ where: { id: paramId(req) } });
    if (!existing) throw new NotFoundError();
    assertTenantMatch(existing.academyId, academyId);

    const plan = await prisma.membershipPlan.update({
      where: { id: paramId(req) },
      data: schema.partial().parse(req.body),
    });
    sendSuccess(res, plan);
  })
);

export default router;
