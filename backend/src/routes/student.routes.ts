import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { resolveCoach } from '../middleware/coachContext';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { withTenant, assertTenantMatch, getPagination } from '../utils/tenantQuery';
import { checkStudentLimit } from '../services/subscription.service';
import { previewFee } from '../utils/feeCalculator';
import { NotFoundError } from '../utils/errors';

const router = Router();

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.string().email().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  sportId: z.string().uuid().optional().nullable(),
  membershipPlanId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  registrationFee: z.number().min(0).optional(),
  additionalCharges: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
});

router.use(authenticate, resolveTenant, requireTenant, resolveCoach);

router.get(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN, UserRole.COACH),
  asyncHandler(async (req, res) => {
    const { academyId, user, coachId } = req as AuthRequest;
    const { page, limit, skip } = getPagination(Number(req.query.page), Number(req.query.limit));
    const includeDeleted = req.query.includeDeleted === 'true';

    let where: Record<string, unknown> = withTenant(academyId!, {
      ...(includeDeleted ? {} : { deletedAt: null }),
    });

    if (user!.role === UserRole.COACH) {
      const assignments = await prisma.batchCoach.findMany({
        where: { coachId: coachId! },
        select: { batchId: true },
      });
      where = { ...where, batchId: { in: assignments.map((a) => a.batchId) } };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          sport: { select: { name: true, monthlyFee: true } },
          batch: { select: { name: true } },
          membershipPlan: { select: { name: true, multiplier: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);
    sendPaginated(res, students, total, page, limit);
  })
);

router.post(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = createSchema.parse(req.body);
    await checkStudentLimit(academyId!);

    const student = await prisma.student.create({
      data: {
        academyId: academyId!,
        ...body,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      },
      include: { sport: true, membershipPlan: true },
    });

    sendSuccess(res, student, 'Student created', 201);
  })
);

router.get(
  '/:id',
  requireRoles(UserRole.ACADEMY_ADMIN, UserRole.COACH),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        sport: true,
        batch: true,
        membershipPlan: true,
        feePayments: { orderBy: { createdAt: 'desc' }, take: 20 },
        studentAttendances: { orderBy: { date: 'desc' }, take: 30 },
        performanceScores: {
          include: { attribute: true },
          orderBy: { scoredAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!student) throw new NotFoundError();
    assertTenantMatch(student.academyId, academyId);
    sendSuccess(res, student);
  })
);

router.patch(
  '/:id',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError();
    assertTenantMatch(existing.academyId, academyId);

    const body = createSchema.partial().parse(req.body);
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...body,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      },
    });
    sendSuccess(res, student);
  })
);

router.delete(
  '/:id',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError();
    assertTenantMatch(existing.academyId, academyId);

    await prisma.student.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isActive: false },
    });
    sendSuccess(res, null, 'Student soft deleted');
  })
);

router.post(
  '/:id/restore',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError();
    assertTenantMatch(existing.academyId, academyId);
    await checkStudentLimit(academyId!);

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: { deletedAt: null, isActive: true },
    });
    sendSuccess(res, student, 'Student restored');
  })
);

router.post(
  '/fee-preview',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        sportId: z.string().uuid(),
        membershipPlanId: z.string().uuid(),
        registrationFee: z.number().min(0).default(0),
        additionalCharges: z.number().min(0).default(0),
        discount: z.number().min(0).default(0),
      })
      .parse(req.body);

    const [sport, plan] = await Promise.all([
      prisma.sport.findUniqueOrThrow({ where: { id: body.sportId } }),
      prisma.membershipPlan.findUniqueOrThrow({ where: { id: body.membershipPlanId } }),
    ]);

    const preview = previewFee(
      Number(sport.monthlyFee),
      Number(plan.multiplier),
      body.registrationFee,
      body.additionalCharges,
      body.discount
    );
    sendSuccess(res, preview);
  })
);

export default router;
