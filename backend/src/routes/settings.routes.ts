import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(authenticate, resolveTenant, requireTenant);

router.get(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const academy = await prisma.academy.findUniqueOrThrow({
      where: { id: academyId! },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        attendanceRadiusM: true,
        receiptPrefix: true,
        receiptTemplate: true,
        theme: true,
        notificationPrefs: true,
        registrationFee: true,
      },
    });
    sendSuccess(res, academy);
  })
);

router.patch(
  '/',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = z
      .object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        logoUrl: z.string().optional(),
        attendanceRadiusM: z.number().int().positive().optional(),
        receiptPrefix: z.string().optional(),
        receiptTemplate: z.string().optional(),
        theme: z.enum(['light', 'dark']).optional(),
        notificationPrefs: z.record(z.string(), z.boolean()).optional(),
        registrationFee: z.number().min(0).optional(),
      })
      .parse(req.body);

    const academy = await prisma.academy.update({
      where: { id: academyId! },
      data: body,
    });
    sendSuccess(res, academy, 'Settings updated');
  })
);

export default router;
