import { Router } from 'express';
import { z } from 'zod';
import { UserRole, SubscriptionPlan } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import { getSubscriptionStatus, upgradePlan } from '../services/subscription.service';
import { notifyAcademyAdmins } from '../services/notification.service';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(authenticate, resolveTenant, requireTenant);

router.get(
  '/status',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const status = await getSubscriptionStatus(academyId!);
    sendSuccess(res, status);
  })
);

router.post(
  '/upgrade-request',
  requireRoles(UserRole.ACADEMY_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId, user } = req as AuthRequest;
    const { plan } = z.object({ plan: z.enum(['FREE', 'PRO', 'PLUS']) }).parse(req.body);

    await prisma.subscriptionHistory.create({
      data: {
        academyId: academyId!,
        plan: plan as SubscriptionPlan,
        status: 'ACTIVE',
        startDate: new Date(),
        notes: `Upgrade requested by admin ${user!.userId}`,
      },
    });

    const superAdmins = await prisma.user.findMany({
      where: { role: UserRole.SUPER_ADMIN, isActive: true },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: superAdmins.map((a) => ({
        userId: a.id,
        type: 'GENERAL' as const,
        title: 'Subscription Upgrade Request',
        message: `Academy ${academyId} requested upgrade to ${plan}`,
        metadata: { academyId, plan },
      })),
    });

    sendSuccess(res, null, 'Upgrade request submitted. Super admin will review.');
  })
);

router.post(
  '/upgrade',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = z
      .object({
        targetAcademyId: z.string().uuid(),
        plan: z.enum(['FREE', 'PRO', 'PLUS']),
        subscriptionEnd: z.string().datetime().optional(),
      })
      .parse(req.body);

    const academy = await upgradePlan(body.targetAcademyId, body.plan as SubscriptionPlan);

    if (body.subscriptionEnd) {
      await prisma.academy.update({
        where: { id: body.targetAcademyId },
        data: { subscriptionEnd: new Date(body.subscriptionEnd) },
      });
    }

    await notifyAcademyAdmins(
      body.targetAcademyId,
      'SUBSCRIPTION_EXPIRY',
      'Subscription Upgraded',
      `Your plan has been upgraded to ${body.plan}`
    );

    sendSuccess(res, academy, 'Subscription upgraded');
  })
);

export default router;
