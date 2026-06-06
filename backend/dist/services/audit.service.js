"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const prisma_1 = require("../lib/prisma");
async function createAuditLog(params) {
    return prisma_1.prisma.auditLog.create({
        data: {
            academyId: params.academyId,
            userId: params.userId,
            action: params.action,
            entity: params.entity,
            entityId: params.entityId,
            oldValues: params.oldValues,
            newValues: params.newValues,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        },
    });
}
//# sourceMappingURL=audit.service.js.map