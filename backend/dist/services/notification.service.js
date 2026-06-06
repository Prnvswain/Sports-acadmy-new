"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.notifyAcademyAdmins = notifyAcademyAdmins;
const prisma_1 = require("../lib/prisma");
async function createNotification(params) {
    return prisma_1.prisma.notification.create({
        data: {
            academyId: params.academyId,
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            metadata: params.metadata,
        },
    });
}
async function notifyAcademyAdmins(academyId, type, title, message, metadata) {
    const admins = await prisma_1.prisma.user.findMany({
        where: { academyId, role: 'ACADEMY_ADMIN', isActive: true },
        select: { id: true },
    });
    await prisma_1.prisma.notification.createMany({
        data: admins.map((a) => ({
            academyId,
            userId: a.id,
            type,
            title,
            message,
            metadata,
        })),
    });
}
//# sourceMappingURL=notification.service.js.map