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
import { notifyAcademyAdmins } from '../services/notification.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { paramId } from '../utils/params';

const router = Router();

router.use(authenticate, resolveTenant, requireTenant, resolveCoach);

router.get(
  '/attributes',
  requireRoles(UserRole.ACADEMY_ADMIN, UserRole.COACH),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const attrs = await prisma.performanceAttribute.findMany({
      where: withTenant(academyId!, { isActive: true }),
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, attrs);
  })
);

router.post(
  '/attributes',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = z.object({ name: z.string(), description: z.string().optional(), sportId: z.string().uuid().optional() }).parse(req.body);
    const attr = await prisma.performanceAttribute.create({
      data: { ...body, academyId: academyId! },
    });
    sendSuccess(res, attr, 'Attribute created', 201);
  })
);

router.post(
  '/attribute-requests',
  coachOnly,
  asyncHandler(async (req, res) => {
    const { academyId, user } = req as AuthRequest;
    const body = z.object({ name: z.string(), description: z.string().optional(), sportId: z.string().uuid().optional() }).parse(req.body);

    const request = await prisma.performanceAttributeRequest.create({
      data: {
        academyId: academyId!,
        requestedBy: user!.userId,
        name: body.name,
        description: body.description,
        sportId: body.sportId,
      },
    });

    await notifyAcademyAdmins(
      academyId!,
      'ATTRIBUTE_REQUEST',
      'New Performance Attribute Request',
      `Coach requested attribute: ${body.name}`
    );

    sendSuccess(res, request, 'Request submitted', 201);
  })
);

router.get(
  '/attribute-requests',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const requests = await prisma.performanceAttributeRequest.findMany({
      where: withTenant(academyId!),
      include: { requester: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, requests);
  })
);

router.patch(
  '/attribute-requests/:id',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId, user } = req as AuthRequest;
    const body = z.object({
      status: z.enum(['APPROVED', 'REJECTED']),
      reviewNote: z.string().optional(),
    }).parse(req.body);

    const request = await prisma.performanceAttributeRequest.findUnique({
      where: { id: paramId(req) },
    });
    if (!request) throw new NotFoundError();
    assertTenantMatch(request.academyId, academyId);

    const updated = await prisma.$transaction(async (tx) => {
      const reqUpdated = await tx.performanceAttributeRequest.update({
        where: { id: paramId(req) },
        data: {
          status: body.status,
          reviewNote: body.reviewNote,
          reviewedBy: user!.userId,
          reviewedAt: new Date(),
        },
      });

      if (body.status === 'APPROVED') {
        await tx.performanceAttribute.create({
          data: {
            academyId: academyId!,
            name: request.name,
            description: request.description,
            sportId: request.sportId,
          },
        });
      }
      return reqUpdated;
    });

    sendSuccess(res, updated);
  })
);

router.post(
  '/scores',
  coachOnly,
  asyncHandler(async (req, res) => {
    const { academyId, coachId } = req as AuthRequest;
    const body = z.object({
      studentId: z.string().uuid(),
      attributeId: z.string().uuid(),
      score: z.number().int().min(1).max(10),
      notes: z.string().optional(),
    }).parse(req.body);

    const student = await prisma.student.findUnique({ where: { id: body.studentId } });
    if (!student) throw new NotFoundError();
    assertTenantMatch(student.academyId, academyId);

    const score = await prisma.performanceScore.create({
      data: {
        academyId: academyId!,
        studentId: body.studentId,
        attributeId: body.attributeId,
        coachId: coachId!,
        score: body.score,
        notes: body.notes,
      },
      include: { attribute: true },
    });
    sendSuccess(res, score, 'Score submitted', 201);
  })
);

router.get(
  '/scores/:studentId',
  requireRoles(UserRole.ACADEMY_ADMIN, UserRole.COACH),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const studentId = paramId(req, 'studentId');
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundError();
    assertTenantMatch(student.academyId, academyId);

    const scores = await prisma.performanceScore.findMany({
      where: { studentId, academyId: academyId! },
      include: {
        attribute: true,
        coach: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { scoredAt: 'desc' },
    });

    const radar = await prisma.performanceScore.groupBy({
      by: ['attributeId'],
      where: { studentId },
      _avg: { score: true },
    });

    const attrs = await prisma.performanceAttribute.findMany({
      where: { id: { in: radar.map((r) => r.attributeId) } },
    });

    const radarData = radar.map((r) => ({
      attribute: attrs.find((a) => a.id === r.attributeId)?.name,
      score: r._avg?.score ?? 0,
    }));

    sendSuccess(res, { scores, radarData });
  })
);

export default router;
