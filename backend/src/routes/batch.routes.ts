import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { resolveCoach } from '../middleware/coachContext';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { withTenant, assertTenantMatch } from '../utils/tenantQuery';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = Router();
const schema = z.object({
  sportId: z.string().uuid(),
  name: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.number().int().positive(),
  coachIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

router.use(authenticate, resolveTenant, requireTenant, resolveCoach);

router.get(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN, UserRole.COACH),
  asyncHandler(async (req, res) => {
    const { academyId, user, coachId } = req as AuthRequest;

    let where = withTenant(academyId!);
    if (user!.role === UserRole.COACH) {
      where = {
        ...where,
        coaches: { some: { coachId: coachId! } },
      } as typeof where;
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        sport: { select: { name: true } },
        coaches: { include: { coach: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, batches);
  })
);

router.post(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = schema.parse(req.body);

    const sport = await prisma.sport.findUnique({ where: { id: body.sportId } });
    if (!sport) throw new NotFoundError('Sport not found');
    assertTenantMatch(sport.academyId, academyId);

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.batch.create({
        data: {
          academyId: academyId!,
          sportId: body.sportId,
          name: body.name,
          startTime: body.startTime,
          endTime: body.endTime,
          capacity: body.capacity,
        },
      });

      if (body.coachIds?.length) {
        await tx.batchCoach.createMany({
          data: body.coachIds.map((coachId) => ({ batchId: b.id, coachId })),
        });
      }
      return b;
    });

    sendSuccess(res, batch, 'Batch created', 201);
  })
);

router.patch(
  '/:id',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const existing = await prisma.batch.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError();
    assertTenantMatch(existing.academyId, academyId);

    const body = schema.partial().parse(req.body);
    const { coachIds, ...data } = body;

    const batch = await prisma.$transaction(async (tx) => {
      const updated = await tx.batch.update({ where: { id: req.params.id }, data });
      if (coachIds) {
        await tx.batchCoach.deleteMany({ where: { batchId: req.params.id } });
        if (coachIds.length) {
          await tx.batchCoach.createMany({
            data: coachIds.map((coachId) => ({ batchId: req.params.id, coachId })),
          });
        }
      }
      return updated;
    });

    sendSuccess(res, batch);
  })
);

router.post(
  '/:id/assign-student',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const { studentId } = z.object({ studentId: z.string().uuid() }).parse(req.body);

    const [batch, student] = await Promise.all([
      prisma.batch.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { students: true } } },
      }),
      prisma.student.findUnique({ where: { id: studentId } }),
    ]);

    if (!batch || !student) throw new NotFoundError();
    assertTenantMatch(batch.academyId, academyId);
    assertTenantMatch(student.academyId, academyId);

    if (batch._count.students >= batch.capacity) {
      throw new ValidationError('Batch capacity exceeded');
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { batchId: batch.id, sportId: batch.sportId },
    });
    sendSuccess(res, updated, 'Student assigned to batch');
  })
);

export default router;
