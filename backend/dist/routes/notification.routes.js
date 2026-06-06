"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const params_1 = require("../utils/params");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user } = req;
    const notifications = await prisma_1.prisma.notification.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    (0, response_1.sendSuccess)(res, notifications);
}));
router.get('/unread-count', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user } = req;
    const count = await prisma_1.prisma.notification.count({
        where: { userId: user.userId, isRead: false },
    });
    (0, response_1.sendSuccess)(res, { count });
}));
router.patch('/:id/read', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user } = req;
    const notification = await prisma_1.prisma.notification.updateMany({
        where: { id: (0, params_1.paramId)(req), userId: user.userId },
        data: { isRead: true },
    });
    (0, response_1.sendSuccess)(res, { updated: notification.count });
}));
router.patch('/read-all', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user } = req;
    const result = await prisma_1.prisma.notification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true },
    });
    (0, response_1.sendSuccess)(res, { updated: result.count }, 'All notifications marked as read');
}));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map