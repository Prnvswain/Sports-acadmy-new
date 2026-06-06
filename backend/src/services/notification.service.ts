import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function createNotification(params: {
  academyId?: string | null;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      academyId: params.academyId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata as Prisma.InputJsonValue,
    },
  });
}

export async function notifyAcademyAdmins(
  academyId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  const admins = await prisma.user.findMany({
    where: { academyId, role: 'ACADEMY_ADMIN', isActive: true },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      academyId,
      userId: a.id,
      type,
      title,
      message,
      metadata: metadata as Prisma.InputJsonValue,
    })),
  });
}
