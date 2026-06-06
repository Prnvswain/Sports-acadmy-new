"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const coachContext_1 = require("../middleware/coachContext");
const prisma_1 = require("../lib/prisma");
const tenantQuery_1 = require("../utils/tenantQuery");
const subscription_service_1 = require("../services/subscription.service");
const feeCalculator_1 = require("../utils/feeCalculator");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    dateOfBirth: zod_1.z.string().optional().nullable(),
    gender: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    guardianName: zod_1.z.string().optional().nullable(),
    guardianPhone: zod_1.z.string().optional().nullable(),
    guardianEmail: zod_1.z.string().email().optional().nullable(),
    guardianRelation: zod_1.z.string().optional().nullable(),
    sportId: zod_1.z.string().uuid().optional().nullable(),
    membershipPlanId: zod_1.z.string().uuid().optional().nullable(),
    batchId: zod_1.z.string().uuid().optional().nullable(),
    registrationFee: zod_1.z.number().min(0).optional(),
    additionalCharges: zod_1.z.number().min(0).optional(),
    discount: zod_1.z.number().min(0).optional(),
});
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant, coachContext_1.resolveCoach);
router.get('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN, client_1.UserRole.COACH), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, user, coachId } = req;
    const { page, limit, skip } = (0, tenantQuery_1.getPagination)(Number(req.query.page), Number(req.query.limit));
    const includeDeleted = req.query.includeDeleted === 'true';
    let where = (0, tenantQuery_1.withTenant)(academyId, {
        ...(includeDeleted ? {} : { deletedAt: null }),
    });
    if (user.role === client_1.UserRole.COACH) {
        const assignments = await prisma_1.prisma.batchCoach.findMany({
            where: { coachId: coachId },
            select: { batchId: true },
        });
        where = { ...where, batchId: { in: assignments.map((a) => a.batchId) } };
    }
    const [students, total] = await Promise.all([
        prisma_1.prisma.student.findMany({
            where,
            skip,
            take: limit,
            include: {
                sport: { select: { name: true, monthlyFee: true } },
                batch: { select: { name: true } },
                membershipPlan: { select: { name: true, multiplier: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.student.count({ where }),
    ]);
    (0, response_1.sendPaginated)(res, students, total, page, limit);
}));
router.post('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const body = createSchema.parse(req.body);
    await (0, subscription_service_1.checkStudentLimit)(academyId);
    const student = await prisma_1.prisma.student.create({
        data: {
            academyId: academyId,
            ...body,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        },
        include: { sport: true, membershipPlan: true },
    });
    (0, response_1.sendSuccess)(res, student, 'Student created', 201);
}));
router.get('/:id', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN, client_1.UserRole.COACH), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const student = await prisma_1.prisma.student.findUnique({
        where: { id: req.params.id },
        include: {
            sport: true,
            batch: true,
            membershipPlan: true,
            feePayments: { orderBy: { createdAt: 'desc' }, take: 20 },
            studentAttendances: { orderBy: { date: 'desc' }, take: 30 },
            performanceScores: {
                include: { attribute: true },
                orderBy: { scoredAt: 'desc' },
                take: 50,
            },
        },
    });
    if (!student)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(student.academyId, academyId);
    (0, response_1.sendSuccess)(res, student);
}));
router.patch('/:id', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const existing = await prisma_1.prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(existing.academyId, academyId);
    const body = createSchema.partial().parse(req.body);
    const student = await prisma_1.prisma.student.update({
        where: { id: req.params.id },
        data: {
            ...body,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        },
    });
    (0, response_1.sendSuccess)(res, student);
}));
router.delete('/:id', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const existing = await prisma_1.prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(existing.academyId, academyId);
    await prisma_1.prisma.student.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), isActive: false },
    });
    (0, response_1.sendSuccess)(res, null, 'Student soft deleted');
}));
router.post('/:id/restore', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const existing = await prisma_1.prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(existing.academyId, academyId);
    await (0, subscription_service_1.checkStudentLimit)(academyId);
    const student = await prisma_1.prisma.student.update({
        where: { id: req.params.id },
        data: { deletedAt: null, isActive: true },
    });
    (0, response_1.sendSuccess)(res, student, 'Student restored');
}));
router.post('/fee-preview', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const body = zod_1.z
        .object({
        sportId: zod_1.z.string().uuid(),
        membershipPlanId: zod_1.z.string().uuid(),
        registrationFee: zod_1.z.number().min(0).default(0),
        additionalCharges: zod_1.z.number().min(0).default(0),
        discount: zod_1.z.number().min(0).default(0),
    })
        .parse(req.body);
    const [sport, plan] = await Promise.all([
        prisma_1.prisma.sport.findUniqueOrThrow({ where: { id: body.sportId } }),
        prisma_1.prisma.membershipPlan.findUniqueOrThrow({ where: { id: body.membershipPlanId } }),
    ]);
    const preview = (0, feeCalculator_1.previewFee)(Number(sport.monthlyFee), Number(plan.multiplier), body.registrationFee, body.additionalCharges, body.discount);
    (0, response_1.sendSuccess)(res, preview);
}));
exports.default = router;
//# sourceMappingURL=student.routes.js.map