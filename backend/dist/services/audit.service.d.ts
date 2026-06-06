import { AuditAction } from '@prisma/client';
export declare function createAuditLog(params: {
    academyId?: string | null;
    userId: string;
    action: AuditAction;
    entity: string;
    entityId?: string;
    oldValues?: unknown;
    newValues?: unknown;
    ipAddress?: string;
    userAgent?: string;
}): Promise<{
    id: string;
    academyId: string | null;
    createdAt: Date;
    userId: string;
    action: import("@prisma/client").$Enums.AuditAction;
    entity: string;
    entityId: string | null;
    oldValues: import("@prisma/client/runtime/client").JsonValue | null;
    newValues: import("@prisma/client/runtime/client").JsonValue | null;
    ipAddress: string | null;
    userAgent: string | null;
}>;
//# sourceMappingURL=audit.service.d.ts.map