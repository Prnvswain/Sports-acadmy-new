import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { withTenant, assertTenantMatch, getPagination } from '../utils/tenantQuery';
import { hashPassword } from '../services/auth.service';
import { checkCoachLimit } from '../services/subscription.service';
import { NotFoundError } from '../utils/errors';
import { paramId } from '../utils/params';

const router = Router();

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  address: z.string().optional(),
});

router.use(authenticate, resolveTenant, requireTenant);

router.get(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const { page, limit, skip } = getPagination(Number(req.query.page), Number(req.query.limit));

    const where = withTenant(academyId!, { isActive: true });
    const [coaches, total] = await Promise.all([
      prisma.coach.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          batchAssignments: { include: { batch: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coach.count({ where }),
    ]);
    sendPaginated(res, coaches, total, page, limit);
  })
);

router.post(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = createSchema.parse(req.body);
    await checkCoachLimit(academyId!);

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) throw new NotFoundError('Email already registered');

    const coach = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email.toLowerCase(),
          passwordHash: await hashPassword(body.password),
          firstName: body.firstName,
          lastName: body.lastName,
          role: UserRole.COACH,
          academyId: academyId!,
        },
      });
      return tx.coach.create({
        data: { academyId: academyId!, userId: user.id, phone: body.phone, address: body.address },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      });
    });

    sendSuccess(res, coach, 'Coach created', 201);
  })
);

router.get(
  '/:id',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const coach = await prisma.coach.findUnique({
      where: { id: paramId(req) },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        batchAssignments: { include: { batch: true } },
        coachAttendances: { take: 30, orderBy: { date: 'desc' } },
        performanceScores: { take: 20, orderBy: { scoredAt: 'desc' } },
      },
    });
    if (!coach) throw new NotFoundError();
    assertTenantMatch(coach.academyId, academyId);
    sendSuccess(res, coach);
  })
);

router.patch(
  '/:id',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const coach = await prisma.coach.findUnique({ where: { id: paramId(req) } });
    if (!coach) throw new NotFoundError();
    assertTenantMatch(coach.academyId, academyId);

    const body = z.object({ phone: z.string().optional(), address: z.string().optional(), isActive: z.boolean().optional() }).parse(req.body);
    const updated = await prisma.coach.update({ where: { id: paramId(req) }, data: body });
    sendSuccess(res, updated);
  })
);

export default router;
