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
const subscription_service_1 = require("../services/subscription.service");
const auth_service_1 = require("../services/auth.service");
const tenantQuery_1 = require("../utils/tenantQuery");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
const createAcademySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2).regex(/^[a-z0-9-]+$/),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    adminFirstName: zod_1.z.string().min(1),
    adminLastName: zod_1.z.string().min(1),
    adminEmail: zod_1.z.string().email(),
    adminPassword: zod_1.z.string().min(8),
    subscriptionPlan: zod_1.z.enum(['FREE', 'PRO', 'PLUS']).default('FREE'),
});
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.requireRoles)(client_1.UserRole.SUPER_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, tenantQuery_1.getPagination)(Number(req.query.page), Number(req.query.limit));
    const search = req.query.search;
    const where = search
        ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
        : {};
    const [academies, total] = await Promise.all([
        prisma_1.prisma.academy.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { students: true, coaches: true } } },
        }),
        prisma_1.prisma.academy.count({ where }),
    ]);
    (0, response_1.sendPaginated)(res, academies, total, page, limit);
}));
router.post('/', (0, auth_1.requireRoles)(client_1.UserRole.SUPER_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const body = createAcademySchema.parse(req.body);
    const limits = (0, subscription_service_1.getPlanLimits)(body.subscriptionPlan);
    const existing = await prisma_1.prisma.academy.findUnique({ where: { slug: body.slug } });
    if (existing)
        throw new errors_1.NotFoundError('Slug already exists');
    const academy = await prisma_1.prisma.$transaction(async (tx) => {
        const ac = await tx.academy.create({
            data: {
                name: body.name,
                slug: body.slug,
                email: body.email,
                phone: body.phone,
                address: body.address,
                subscriptionPlan: body.subscriptionPlan,
                maxStudents: limits.maxStudents,
                maxCoaches: limits.maxCoaches,
                subscriptionStart: new Date(),
                subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
        });
        await tx.user.create({
            data: {
                email: body.adminEmail.toLowerCase(),
                passwordHash: await (0, auth_service_1.hashPassword)(body.adminPassword),
                firstName: body.adminFirstName,
                lastName: body.adminLastName,
                role: client_1.UserRole.ACADEMY_ADMIN,
                academyId: ac.id,
            },
        });
        return ac;
    });
    (0, response_1.sendSuccess)(res, academy, 'Academy created', 201);
}));
router.get('/:id', (0, auth_1.requireRoles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ACADEMY_ADMIN), tenant_1.resolveTenant, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user, academyId } = req;
    const id = user.role === client_1.UserRole.SUPER_ADMIN ? req.params.id : academyId;
    const academy = await prisma_1.prisma.academy.findUnique({
        where: { id },
        include: { _count: { select: { students: true, coaches: true, batches: true } } },
    });
    if (!academy)
        throw new errors_1.NotFoundError('Academy not found');
    (0, response_1.sendSuccess)(res, academy);
}));
router.patch('/:id/status', (0, auth_1.requireRoles)(client_1.UserRole.SUPER_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const status = zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).parse(req.body.status);
    const academy = await prisma_1.prisma.academy.update({
        where: { id: req.params.id },
        data: { status: status },
    });
    (0, response_1.sendSuccess)(res, academy, 'Academy status updated');
}));
router.patch('/:id/subscription', (0, auth_1.requireRoles)(client_1.UserRole.SUPER_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const body = zod_1.z
        .object({
        plan: zod_1.z.enum(['FREE', 'PRO', 'PLUS']),
        subscriptionEnd: zod_1.z.string().datetime().optional(),
    })
        .parse(req.body);
    const limits = (0, subscription_service_1.getPlanLimits)(body.plan);
    const academy = await prisma_1.prisma.academy.update({
        where: { id: req.params.id },
        data: {
            subscriptionPlan: body.plan,
            maxStudents: limits.maxStudents,
            maxCoaches: limits.maxCoaches,
            subscriptionStatus: 'ACTIVE',
            ...(body.subscriptionEnd && { subscriptionEnd: new Date(body.subscriptionEnd) }),
        },
    });
    (0, response_1.sendSuccess)(res, academy, 'Subscription updated');
}));
exports.default = router;
//# sourceMappingURL=academy.routes.js.map