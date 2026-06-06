"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantWhere = exports.enforceTenantOwnership = exports.requireTenant = exports.resolveTenant = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma_1 = require("../lib/prisma");
/**
 * Multi-Tenancy Security Layer
 *
 * Strategy:
 * 1. JWT carries academyId for tenant users (null for SUPER_ADMIN)
 * 2. Middleware injects req.academyId — the ONLY tenant identifier used downstream
 * 3. SUPER_ADMIN must explicitly pass ?academyId or x-academy-id header for tenant ops
 * 4. All tenant-scoped services MUST use tenantWhere() helper — never trust client body academyId
 * 5. Cross-tenant resource access blocked at middleware + service + unique constraints
 */
const resolveTenant = async (req, _res, next) => {
    if (!req.user)
        throw new errors_1.ForbiddenError();
    if (req.user.role === client_1.UserRole.SUPER_ADMIN) {
        const headerAcademy = req.headers['x-academy-id'];
        const queryAcademy = req.query.academyId;
        req.academyId = headerAcademy || queryAcademy || null;
        return next();
    }
    if (!req.user.academyId) {
        throw new errors_1.ForbiddenError('No academy associated with this account');
    }
    const academy = await prisma_1.prisma.academy.findUnique({
        where: { id: req.user.academyId },
        select: { id: true, status: true, subscriptionStatus: true },
    });
    if (!academy)
        throw new errors_1.NotFoundError('Academy not found');
    if (academy.status !== 'ACTIVE') {
        throw new errors_1.ForbiddenError('Academy is inactive or suspended');
    }
    req.academyId = req.user.academyId;
    next();
};
exports.resolveTenant = resolveTenant;
const requireTenant = (req, _res, next) => {
    if (!req.academyId) {
        throw new errors_1.ForbiddenError('Academy context required for this operation');
    }
    next();
};
exports.requireTenant = requireTenant;
const enforceTenantOwnership = (resourceAcademyId, reqAcademyId) => {
    if (!reqAcademyId) {
        throw new errors_1.TenantViolationError();
    }
    if (resourceAcademyId !== reqAcademyId) {
        throw new errors_1.TenantViolationError('Resource belongs to a different academy');
    }
};
exports.enforceTenantOwnership = enforceTenantOwnership;
const tenantWhere = (academyId) => ({ academyId });
exports.tenantWhere = tenantWhere;
//# sourceMappingURL=tenant.js.map