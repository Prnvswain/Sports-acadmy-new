import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { withTenant } from '../utils/tenantQuery';
import { assertTenantMatch } from '../utils/tenantQuery';
import { NotFoundError } from '../utils/errors';
import { paramId } from '../utils/params';

const router = Router();
const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  monthlyFee: z.number().min(0),
  isActive: z.boolean().optional(),
});

router.use(authenticate, resolveTenant, requireTenant);
router.use(requireRoles(UserRole.ACADEMY_ADMIN));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const sports = await prisma.sport.findMany({
      where: withTenant(academyId!),
      include: { _count: { select: { students: true, batches: true } } },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, sports);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = schema.parse(req.body);
    const sport = await prisma.sport.create({
      data: { ...body, academyId: academyId! },
    });
    sendSuccess(res, sport, 'Sport created', 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const existing = await prisma.sport.findUnique({ where: { id: paramId(req) } });
    if (!existing) throw new NotFoundError();
    assertTenantMatch(existing.academyId, academyId);

    const body = schema.partial().parse(req.body);
    const sport = await prisma.sport.update({ where: { id: paramId(req) }, data: body });
    sendSuccess(res, sport);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const existing = await prisma.sport.findUnique({ where: { id: paramId(req) } });
    if (!existing) throw new NotFoundError();
    assertTenantMatch(existing.academyId, academyId);

    await prisma.sport.update({
      where: { id: paramId(req) },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Sport deactivated');
  })
);

export default router;
