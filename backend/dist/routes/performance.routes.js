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
const notification_service_1 = require("../services/notification.service");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant, coachContext_1.resolveCoach);
router.get('/attributes', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN, client_1.UserRole.COACH), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const attrs = await prisma_1.prisma.performanceAttribute.findMany({
        where: (0, tenantQuery_1.withTenant)(academyId, { isActive: true }),
        orderBy: { name: 'asc' },
    });
    (0, response_1.sendSuccess)(res, attrs);
}));
router.post('/attributes', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const body = zod_1.z.object({ name: zod_1.z.string(), description: zod_1.z.string().optional(), sportId: zod_1.z.string().uuid().optional() }).parse(req.body);
    const attr = await prisma_1.prisma.performanceAttribute.create({
        data: { ...body, academyId: academyId },
    });
    (0, response_1.sendSuccess)(res, attr, 'Attribute created', 201);
}));
router.post('/attribute-requests', coachContext_1.coachOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, user } = req;
    const body = zod_1.z.object({ name: zod_1.z.string(), description: zod_1.z.string().optional(), sportId: zod_1.z.string().uuid().optional() }).parse(req.body);
    const request = await prisma_1.prisma.performanceAttributeRequest.create({
        data: {
            academyId: academyId,
            requestedBy: user.userId,
            name: body.name,
            description: body.description,
            sportId: body.sportId,
        },
    });
    await (0, notification_service_1.notifyAcademyAdmins)(academyId, 'ATTRIBUTE_REQUEST', 'New Performance Attribute Request', `Coach requested attribute: ${body.name}`);
    (0, response_1.sendSuccess)(res, request, 'Request submitted', 201);
}));
router.get('/attribute-requests', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const requests = await prisma_1.prisma.performanceAttributeRequest.findMany({
        where: (0, tenantQuery_1.withTenant)(academyId),
        include: { requester: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
    });
    (0, response_1.sendSuccess)(res, requests);
}));
router.patch('/attribute-requests/:id', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, user } = req;
    const body = zod_1.z.object({
        status: zod_1.z.enum(['APPROVED', 'REJECTED']),
        reviewNote: zod_1.z.string().optional(),
    }).parse(req.body);
    const request = await prisma_1.prisma.performanceAttributeRequest.findUnique({
        where: { id: req.params.id },
    });
    if (!request)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(request.academyId, academyId);
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
        const reqUpdated = await tx.performanceAttributeRequest.update({
            where: { id: req.params.id },
            data: {
                status: body.status,
                reviewNote: body.reviewNote,
                reviewedBy: user.userId,
                reviewedAt: new Date(),
            },
        });
        if (body.status === 'APPROVED') {
            await tx.performanceAttribute.create({
                data: {
                    academyId: academyId,
                    name: request.name,
                    description: request.description,
                    sportId: request.sportId,
                },
            });
        }
        return reqUpdated;
    });
    (0, response_1.sendSuccess)(res, updated);
}));
router.post('/scores', coachContext_1.coachOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, coachId } = req;
    const body = zod_1.z.object({
        studentId: zod_1.z.string().uuid(),
        attributeId: zod_1.z.string().uuid(),
        score: zod_1.z.number().int().min(1).max(10),
        notes: zod_1.z.string().optional(),
    }).parse(req.body);
    const student = await prisma_1.prisma.student.findUnique({ where: { id: body.studentId } });
    if (!student)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(student.academyId, academyId);
    const score = await prisma_1.prisma.performanceScore.create({
        data: {
            academyId: academyId,
            studentId: body.studentId,
            attributeId: body.attributeId,
            coachId: coachId,
            score: body.score,
            notes: body.notes,
        },
        include: { attribute: true },
    });
    (0, response_1.sendSuccess)(res, score, 'Score submitted', 201);
}));
router.get('/scores/:studentId', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN, client_1.UserRole.COACH), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const student = await prisma_1.prisma.student.findUnique({ where: { id: req.params.studentId } });
    if (!student)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(student.academyId, academyId);
    const scores = await prisma_1.prisma.performanceScore.findMany({
        where: { studentId: req.params.studentId, academyId: academyId },
        include: {
            attribute: true,
            coach: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { scoredAt: 'desc' },
    });
    const radar = await prisma_1.prisma.performanceScore.groupBy({
        by: ['attributeId'],
        where: { studentId: req.params.studentId },
        _avg: { score: true },
    });
    const attrs = await prisma_1.prisma.performanceAttribute.findMany({
        where: { id: { in: radar.map((r) => r.attributeId) } },
    });
    const radarData = radar.map((r) => ({
        attribute: attrs.find((a) => a.id === r.attributeId)?.name,
        score: r._avg.score,
    }));
    (0, response_1.sendSuccess)(res, { scores, radarData });
}));
exports.default = router;
//# sourceMappingURL=performance.routes.js.map