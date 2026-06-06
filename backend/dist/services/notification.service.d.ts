import { NotificationType, Prisma } from '@prisma/client';
export declare function createNotification(params: {
    academyId?: string | null;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
}): Promise<{
    id: string;
    academyId: string | null;
    createdAt: Date;
    userId: string;
    type: import("@prisma/client").$Enums.NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    metadata: Prisma.JsonValue | null;
}>;
export declare function notifyAcademyAdmins(academyId: string, type: NotificationType, title: string, message: string, metadata?: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=notification.service.d.ts.map