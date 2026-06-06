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
const tenantQuery_1 = require("../utils/tenantQuery");
const auth_service_1 = require("../services/auth.service");
const subscription_service_1 = require("../services/subscription.service");
const errors_1 = require("../utils/errors");
const params_1 = require("../utils/params");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
});
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant);
router.get('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const { page, limit, skip } = (0, tenantQuery_1.getPagination)(Number(req.query.page), Number(req.query.limit));
    const where = (0, tenantQuery_1.withTenant)(academyId, { isActive: true });
    const [coaches, total] = await Promise.all([
        prisma_1.prisma.coach.findMany({
            where,
            skip,
            take: limit,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                batchAssignments: { include: { batch: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.coach.count({ where }),
    ]);
    (0, response_1.sendPaginated)(res, coaches, total, page, limit);
}));
router.post('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const body = createSchema.parse(req.body);
    await (0, subscription_service_1.checkCoachLimit)(academyId);
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing)
        throw new errors_1.NotFoundError('Email already registered');
    const coach = await prisma_1.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: body.email.toLowerCase(),
                passwordHash: await (0, auth_service_1.hashPassword)(body.password),
                firstName: body.firstName,
                lastName: body.lastName,
                role: client_1.UserRole.COACH,
                academyId: academyId,
            },
        });
        return tx.coach.create({
            data: { academyId: academyId, userId: user.id, phone: body.phone, address: body.address },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
    });
    (0, response_1.sendSuccess)(res, coach, 'Coach created', 201);
}));
router.get('/:id', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const coach = await prisma_1.prisma.coach.findUnique({
        where: { id: (0, params_1.paramId)(req) },
        include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            batchAssignments: { include: { batch: true } },
            coachAttendances: { take: 30, orderBy: { date: 'desc' } },
            performanceScores: { take: 20, orderBy: { scoredAt: 'desc' } },
        },
    });
    if (!coach)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(coach.academyId, academyId);
    (0, response_1.sendSuccess)(res, coach);
}));
router.patch('/:id', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const coach = await prisma_1.prisma.coach.findUnique({ where: { id: (0, params_1.paramId)(req) } });
    if (!coach)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(coach.academyId, academyId);
    const body = zod_1.z.object({ phone: zod_1.z.string().optional(), address: zod_1.z.string().optional(), isActive: zod_1.z.boolean().optional() }).parse(req.body);
    const updated = await prisma_1.prisma.coach.update({ where: { id: (0, params_1.paramId)(req) }, data: body });
    (0, response_1.sendSuccess)(res, updated);
}));
exports.default = router;
//# sourceMappingURL=coach.routes.js.map