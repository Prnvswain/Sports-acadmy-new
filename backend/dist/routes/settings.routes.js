"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant);
router.get('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const academy = await prisma_1.prisma.academy.findUniqueOrThrow({
        where: { id: academyId },
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
    (0, response_1.sendSuccess)(res, academy);
}));
router.patch('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const body = zod_1.z
        .object({
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        attendanceRadiusM: zod_1.z.number().int().positive().optional(),
        receiptPrefix: zod_1.z.string().optional(),
        receiptTemplate: zod_1.z.string().optional(),
        theme: zod_1.z.enum(['light', 'dark']).optional(),
        notificationPrefs: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).optional(),
        registrationFee: zod_1.z.number().min(0).optional(),
    })
        .parse(req.body);
    const academy = await prisma_1.prisma.academy.update({
        where: { id: academyId },
        data: body,
    });
    (0, response_1.sendSuccess)(res, academy, 'Settings updated');
}));
exports.default = router;
//# sourceMappingURL=settings.routes.js.map