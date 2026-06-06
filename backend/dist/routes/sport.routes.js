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
const tenantQuery_2 = require("../utils/tenantQuery");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
const schema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    monthlyFee: zod_1.z.number().min(0),
    isActive: zod_1.z.boolean().optional(),
});
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant);
router.use((0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const sports = await prisma_1.prisma.sport.findMany({
        where: (0, tenantQuery_1.withTenant)(academyId),
        include: { _count: { select: { students: true, batches: true } } },
        orderBy: { name: 'asc' },
    });
    (0, response_1.sendSuccess)(res, sports);
}));
router.post('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const body = schema.parse(req.body);
    const sport = await prisma_1.prisma.sport.create({
        data: { ...body, academyId: academyId },
    });
    (0, response_1.sendSuccess)(res, sport, 'Sport created', 201);
}));
router.patch('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const existing = await prisma_1.prisma.sport.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_2.assertTenantMatch)(existing.academyId, academyId);
    const body = schema.partial().parse(req.body);
    const sport = await prisma_1.prisma.sport.update({ where: { id: req.params.id }, data: body });
    (0, response_1.sendSuccess)(res, sport);
}));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const existing = await prisma_1.prisma.sport.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_2.assertTenantMatch)(existing.academyId, academyId);
    await prisma_1.prisma.sport.update({
        where: { id: req.params.id },
        data: { isActive: false },
    });
    (0, response_1.sendSuccess)(res, null, 'Sport deactivated');
}));
exports.default = router;
//# sourceMappingURL=sport.routes.js.map