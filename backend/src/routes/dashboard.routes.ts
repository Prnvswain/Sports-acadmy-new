import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { resolveCoach } from '../middleware/coachContext';
import { AuthRequest } from '../types';
import * as dashboardService from '../services/dashboard.service';
import { getSubscriptionStatus } from '../services/subscription.service';

const router = Router();

router.use(authenticate, resolveTenant, resolveCoach);

router.get(
  '/admin',
  requireRoles(UserRole.ACADEMY_ADMIN),
  requireTenant,
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const data = await dashboardService.getAdminDashboard(academyId!);
    sendSuccess(res, data);
  })
);

router.get(
  '/coach',
  requireRoles(UserRole.COACH),
  requireTenant,
  asyncHandler(async (req, res) => {
    const { academyId, coachId } = req as AuthRequest;
    const data = await dashboardService.getCoachDashboard(academyId!, coachId!);
    sendSuccess(res, data);
  })
);

router.get(
  '/super-admin',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (_req, res) => {
    const data = await dashboardService.getSuperAdminDashboard();
    sendSuccess(res, data);
  })
);

router.get(
  '/subscription',
  requireRoles(UserRole.ACADEMY_ADMIN),
  requireTenant,
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const status = await getSubscriptionStatus(academyId!);
    sendSuccess(res, status);
  })
);

export default router;
