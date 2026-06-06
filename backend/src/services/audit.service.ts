import { AuditAction } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function createAuditLog(params: {
  academyId?: string | null;
  userId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      academyId: params.academyId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldValues: params.oldValues as object,
      newValues: params.newValues as object,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
