import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { resolveCoach, coachOnly } from '../middleware/coachContext';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { withTenant, assertTenantMatch } from '../utils/tenantQuery';
import { isWithinRadius } from '../utils/geo';
import { ValidationError, ForbiddenError, NotFoundError } from '../utils/errors';

const router = Router();

router.use(authenticate, resolveTenant, requireTenant, resolveCoach);

// Coach self attendance
router.post(
  '/coach/check-in',
  coachOnly,
  asyncHandler(async (req, res) => {
    const { academyId, coachId, user } = req as AuthRequest;
    const body = z
      .object({
        latitude: z.number(),
        longitude: z.number(),
        academyLatitude: z.number(),
        academyLongitude: z.number(),
        status: z.enum(['PRESENT', 'LATE']).default('PRESENT'),
      })
      .parse(req.body);

    const academy = await prisma.academy.findUniqueOrThrow({ where: { id: academyId! } });

    if (
      !isWithinRadius(
        body.latitude,
        body.longitude,
        body.academyLatitude,
        body.academyLongitude,
        academy.attendanceRadiusM
      )
    ) {
      throw new ValidationError('You are outside the allowed attendance radius');
    }

    const today = new Date(new Date().toISOString().slice(0, 10));
    const existing = await prisma.coachAttendance.findUnique({
      where: { coachId_date: { coachId: coachId!, date: today } },
    });
    if (existing) throw new ValidationError('Attendance already marked for today');

    const record = await prisma.coachAttendance.create({
      data: {
        academyId: academyId!,
        coachId: coachId!,
        date: today,
        status: body.status,
        checkInAt: new Date(),
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });
    sendSuccess(res, record, 'Coach attendance marked', 201);
  })
);

router.get(
  '/coach',
  requireRoles(UserRole.ACADEMY_ADMIN, UserRole.COACH),
  asyncHandler(async (req, res) => {
    const { academyId, user, coachId } = req as AuthRequest;
    const where = withTenant(academyId!, {
      ...(user!.role === UserRole.COACH && { coachId: coachId! }),
      ...(req.query.coachId && user!.role === UserRole.ACADEMY_ADMIN && { coachId: req.query.coachId as string }),
    });

    const records = await prisma.coachAttendance.findMany({
      where,
      include: { coach: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { date: 'desc' },
      take: 100,
    });
    sendSuccess(res, records);
  })
);

// Student attendance
router.post(
  '/student',
  coachOnly,
  asyncHandler(async (req, res) => {
    const { academyId, coachId, user } = req as AuthRequest;
    const body = z
      .object({
        batchId: z.string().uuid(),
        date: z.string(),
        records: z.array(
          z.object({
            studentId: z.string().uuid(),
            status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE']),
            notes: z.string().optional(),
          })
        ),
      })
      .parse(req.body);

    const assignment = await prisma.batchCoach.findFirst({
      where: { batchId: body.batchId, coachId: coachId! },
    });
    if (!assignment) throw new ForbiddenError('Not assigned to this batch');

    const batch = await prisma.batch.findUniqueOrThrow({ where: { id: body.batchId } });
    assertTenantMatch(batch.academyId, academyId);

    const date = new Date(body.date);
    const created = [];

    for (const rec of body.records) {
      const student = await prisma.student.findUnique({ where: { id: rec.studentId } });
      if (!student || student.batchId !== body.batchId) continue;

      const existing = await prisma.studentAttendance.findUnique({
        where: {
          studentId_batchId_date: {
            studentId: rec.studentId,
            batchId: body.batchId,
            date,
          },
        },
      });

      if (existing?.isLocked) continue;

      const record = await prisma.studentAttendance.upsert({
        where: {
          studentId_batchId_date: {
            studentId: rec.studentId,
            batchId: body.batchId,
            date,
          },
        },
        create: {
          academyId: academyId!,
          studentId: rec.studentId,
          batchId: body.batchId,
          date,
          status: rec.status,
          markedBy: user!.userId,
          isLocked: true,
          notes: rec.notes,
        },
        update: {},
      });
      created.push(record);
    }

    sendSuccess(res, created, 'Student attendance submitted', 201);
  })
);

router.get(
  '/student',
  requireRoles(UserRole.ACADEMY_ADMIN, UserRole.COACH),
  asyncHandler(async (req, res) => {
    const { academyId, coachId, user } = req as AuthRequest;
    let batchFilter: string[] | undefined;

    if (user!.role === UserRole.COACH) {
      const assignments = await prisma.batchCoach.findMany({
        where: { coachId: coachId! },
        select: { batchId: true },
      });
      batchFilter = assignments.map((a) => a.batchId);
    }

    const records = await prisma.studentAttendance.findMany({
      where: withTenant(academyId!, {
        ...(batchFilter && { batchId: { in: batchFilter } }),
        ...(req.query.batchId && { batchId: req.query.batchId as string }),
        ...(req.query.studentId && { studentId: req.query.studentId as string }),
      }),
      include: {
        student: { select: { firstName: true, lastName: true } },
        batch: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });
    sendSuccess(res, records);
  })
);

export default router;
