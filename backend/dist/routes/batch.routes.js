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
const errors_1 = require("../utils/errors");
const params_1 = require("../utils/params");
const router = (0, express_1.Router)();
const schema = zod_1.z.object({
    sportId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    startTime: zod_1.z.string(),
    endTime: zod_1.z.string(),
    capacity: zod_1.z.number().int().positive(),
    coachIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    isActive: zod_1.z.boolean().optional(),
});
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant, coachContext_1.resolveCoach);
router.get('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN, client_1.UserRole.COACH), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, user, coachId } = req;
    let where = (0, tenantQuery_1.withTenant)(academyId);
    if (user.role === client_1.UserRole.COACH) {
        where = {
            ...where,
            coaches: { some: { coachId: coachId } },
        };
    }
    const batches = await prisma_1.prisma.batch.findMany({
        where,
        include: {
            sport: { select: { name: true } },
            coaches: { include: { coach: { include: { user: { select: { firstName: true, lastName: true } } } } } },
            _count: { select: { students: true } },
        },
        orderBy: { name: 'asc' },
    });
    (0, response_1.sendSuccess)(res, batches);
}));
router.post('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const body = schema.parse(req.body);
    const sport = await prisma_1.prisma.sport.findUnique({ where: { id: body.sportId } });
    if (!sport)
        throw new errors_1.NotFoundError('Sport not found');
    (0, tenantQuery_1.assertTenantMatch)(sport.academyId, academyId);
    const batch = await prisma_1.prisma.$transaction(async (tx) => {
        const b = await tx.batch.create({
            data: {
                academyId: academyId,
                sportId: body.sportId,
                name: body.name,
                startTime: body.startTime,
                endTime: body.endTime,
                capacity: body.capacity,
            },
        });
        if (body.coachIds?.length) {
            await tx.batchCoach.createMany({
                data: body.coachIds.map((coachId) => ({ batchId: b.id, coachId })),
            });
        }
        return b;
    });
    (0, response_1.sendSuccess)(res, batch, 'Batch created', 201);
}));
router.patch('/:id', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const existing = await prisma_1.prisma.batch.findUnique({ where: { id: (0, params_1.paramId)(req) } });
    if (!existing)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(existing.academyId, academyId);
    const body = schema.partial().parse(req.body);
    const { coachIds, ...data } = body;
    const batch = await prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.batch.update({ where: { id: (0, params_1.paramId)(req) }, data });
        if (coachIds) {
            await tx.batchCoach.deleteMany({ where: { batchId: (0, params_1.paramId)(req) } });
            if (coachIds.length) {
                await tx.batchCoach.createMany({
                    data: coachIds.map((coachId) => ({ batchId: (0, params_1.paramId)(req), coachId })),
                });
            }
        }
        return updated;
    });
    (0, response_1.sendSuccess)(res, batch);
}));
router.post('/:id/assign-student', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const { studentId } = zod_1.z.object({ studentId: zod_1.z.string().uuid() }).parse(req.body);
    const [batch, student] = await Promise.all([
        prisma_1.prisma.batch.findUnique({
            where: { id: (0, params_1.paramId)(req) },
            include: { _count: { select: { students: true } } },
        }),
        prisma_1.prisma.student.findUnique({ where: { id: studentId } }),
    ]);
    if (!batch || !student)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(batch.academyId, academyId);
    (0, tenantQuery_1.assertTenantMatch)(student.academyId, academyId);
    if (batch._count.students >= batch.capacity) {
        throw new errors_1.ValidationError('Batch capacity exceeded');
    }
    const updated = await prisma_1.prisma.student.update({
        where: { id: studentId },
        data: { batchId: batch.id, sportId: batch.sportId },
    });
    (0, response_1.sendSuccess)(res, updated, 'Student assigned to batch');
}));
exports.default = router;
//# sourceMappingURL=batch.routes.js.map