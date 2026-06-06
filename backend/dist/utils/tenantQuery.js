"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTenantMatch = assertTenantMatch;
exports.withTenant = withTenant;
exports.getPagination = getPagination;
const errors_1 = require("./errors");
function assertTenantMatch(resourceAcademyId, requestAcademyId) {
    if (!requestAcademyId || !resourceAcademyId || resourceAcademyId !== requestAcademyId) {
        throw new errors_1.TenantViolationError();
    }
}
function withTenant(academyId, where = {}) {
    return { ...where, academyId };
}
function getPagination(page, limit) {
    const p = Math.max(1, page || 1);
    const l = Math.min(100, Math.max(1, limit || 20));
    return { skip: (p - 1) * l, take: l, page: p, limit: l };
}
//# sourceMappingURL=tenantQuery.js.map