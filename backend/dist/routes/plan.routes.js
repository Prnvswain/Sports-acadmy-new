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
const errors_1 = require("../utils/errors");
const params_1 = require("../utils/params");
const router = (0, express_1.Router)();
const schema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    duration: zod_1.z.number().int().positive(),
    multiplier: zod_1.z.number().positive(),
    isCustom: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
});
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant);
router.get('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN, client_1.UserRole.COACH), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const plans = await prisma_1.prisma.membershipPlan.findMany({
        where: (0, tenantQuery_1.withTenant)(academyId),
        orderBy: { duration: 'asc' },
    });
    (0, response_1.sendSuccess)(res, plans);
}));
router.post('/', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const body = schema.parse(req.body);
    const plan = await prisma_1.prisma.membershipPlan.create({
        data: { ...body, academyId: academyId },
    });
    (0, response_1.sendSuccess)(res, plan, 'Plan created', 201);
}));
router.patch('/:id', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const existing = await prisma_1.prisma.membershipPlan.findUnique({ where: { id: (0, params_1.paramId)(req) } });
    if (!existing)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(existing.academyId, academyId);
    const plan = await prisma_1.prisma.membershipPlan.update({
        where: { id: (0, params_1.paramId)(req) },
        data: schema.partial().parse(req.body),
    });
    (0, response_1.sendSuccess)(res, plan);
}));
exports.default = router;
//# sourceMappingURL=plan.routes.js.map