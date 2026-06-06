import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { paramId } from '../utils/params';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { user } = req as AuthRequest;
    const notifications = await prisma.notification.findMany({
      where: { userId: user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    sendSuccess(res, notifications);
  })
);

router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const { user } = req as AuthRequest;
    const count = await prisma.notification.count({
      where: { userId: user!.userId, isRead: false },
    });
    sendSuccess(res, { count });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const { user } = req as AuthRequest;
    const notification = await prisma.notification.updateMany({
      where: { id: paramId(req), userId: user!.userId },
      data: { isRead: true },
    });
    sendSuccess(res, { updated: notification.count });
  })
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    const { user } = req as AuthRequest;
    const result = await prisma.notification.updateMany({
      where: { userId: user!.userId, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, { updated: result.count }, 'All notifications marked as read');
  })
);

export default router;
