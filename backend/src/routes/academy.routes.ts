import { Router } from 'express';
import { z } from 'zod';
import { UserRole, SubscriptionPlan, AcademyStatus } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { getPlanLimits } from '../services/subscription.service';
import { hashPassword } from '../services/auth.service';
import { getPagination } from '../utils/tenantQuery';
import { NotFoundError } from '../utils/errors';

const router = Router();

const createAcademySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  adminFirstName: z.string().min(1),
  adminLastName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  subscriptionPlan: z.enum(['FREE', 'PRO', 'PLUS']).default('FREE'),
});

router.use(authenticate);

router.get(
  '/',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    const search = req.query.search as string | undefined;

    const where = search
      ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
      : {};

    const [academies, total] = await Promise.all([
      prisma.academy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { students: true, coaches: true } } },
      }),
      prisma.academy.count({ where }),
    ]);

    sendPaginated(res, academies, total, page, limit);
  })
);

router.post(
  '/',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const body = createAcademySchema.parse(req.body);
    const limits = getPlanLimits(body.subscriptionPlan as SubscriptionPlan);

    const existing = await prisma.academy.findUnique({ where: { slug: body.slug } });
    if (existing) throw new NotFoundError('Slug already exists');

    const academy = await prisma.$transaction(async (tx) => {
      const ac = await tx.academy.create({
        data: {
          name: body.name,
          slug: body.slug,
          email: body.email,
          phone: body.phone,
          address: body.address,
          subscriptionPlan: body.subscriptionPlan as SubscriptionPlan,
          maxStudents: limits.maxStudents,
          maxCoaches: limits.maxCoaches,
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.user.create({
        data: {
          email: body.adminEmail.toLowerCase(),
          passwordHash: await hashPassword(body.adminPassword),
          firstName: body.adminFirstName,
          lastName: body.adminLastName,
          role: UserRole.ACADEMY_ADMIN,
          academyId: ac.id,
        },
      });

      return ac;
    });

    sendSuccess(res, academy, 'Academy created', 201);
  })
);

router.get(
  '/:id',
  requireRoles(UserRole.SUPER_ADMIN, UserRole.ACADEMY_ADMIN),
  resolveTenant,
  asyncHandler(async (req, res) => {
    const { user, academyId } = req as AuthRequest;
    const id = user!.role === UserRole.SUPER_ADMIN ? req.params.id : academyId!;

    const academy = await prisma.academy.findUnique({
      where: { id },
      include: { _count: { select: { students: true, coaches: true, batches: true } } },
    });
    if (!academy) throw new NotFoundError('Academy not found');
    sendSuccess(res, academy);
  })
);

router.patch(
  '/:id/status',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const status = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).parse(req.body.status);
    const academy = await prisma.academy.update({
      where: { id: req.params.id },
      data: { status: status as AcademyStatus },
    });
    sendSuccess(res, academy, 'Academy status updated');
  })
);

router.patch(
  '/:id/subscription',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        plan: z.enum(['FREE', 'PRO', 'PLUS']),
        subscriptionEnd: z.string().datetime().optional(),
      })
      .parse(req.body);

    const limits = getPlanLimits(body.plan as SubscriptionPlan);
    const academy = await prisma.academy.update({
      where: { id: req.params.id },
      data: {
        subscriptionPlan: body.plan as SubscriptionPlan,
        maxStudents: limits.maxStudents,
        maxCoaches: limits.maxCoaches,
        subscriptionStatus: 'ACTIVE',
        ...(body.subscriptionEnd && { subscriptionEnd: new Date(body.subscriptionEnd) }),
      },
    });
    sendSuccess(res, academy, 'Subscription updated');
  })
);

export default router;
