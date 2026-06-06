import { SubscriptionPlan } from '@prisma/client';
import { PLAN_LIMITS } from '../config';
import { prisma } from '../lib/prisma';
import { LimitExceededError } from '../utils/errors';

export function getPlanLimits(plan: SubscriptionPlan) {
  return PLAN_LIMITS[plan];
}

export async function checkStudentLimit(academyId: string) {
  const academy = await prisma.academy.findUniqueOrThrow({
    where: { id: academyId },
    select: { maxStudents: true, subscriptionPlan: true },
  });

  const count = await prisma.student.count({
    where: { academyId, deletedAt: null, isActive: true },
  });

  if (count >= academy.maxStudents) {
    throw new LimitExceededError(
      `Student limit reached (${academy.maxStudents}). Upgrade your ${academy.subscriptionPlan} plan.`
    );
  }
  return { current: count, max: academy.maxStudents };
}

export async function checkCoachLimit(academyId: string) {
  const academy = await prisma.academy.findUniqueOrThrow({
    where: { id: academyId },
    select: { maxCoaches: true, subscriptionPlan: true },
  });

  const count = await prisma.coach.count({
    where: { academyId, isActive: true },
  });

  if (count >= academy.maxCoaches) {
    throw new LimitExceededError(
      `Coach limit reached (${academy.maxCoaches}). Upgrade your ${academy.subscriptionPlan} plan.`
    );
  }
  return { current: count, max: academy.maxCoaches };
}

export async function getSubscriptionStatus(academyId: string) {
  const academy = await prisma.academy.findUniqueOrThrow({
    where: { id: academyId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionEnd: true,
      maxStudents: true,
      maxCoaches: true,
    },
  });

  const [studentCount, coachCount] = await Promise.all([
    prisma.student.count({ where: { academyId, deletedAt: null, isActive: true } }),
    prisma.coach.count({ where: { academyId, isActive: true } }),
  ]);

  const daysUntilExpiry = academy.subscriptionEnd
    ? Math.ceil((academy.subscriptionEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    ...academy,
    studentCount,
    coachCount,
    studentUsagePercent: Math.round((studentCount / academy.maxStudents) * 100),
    coachUsagePercent: Math.round((coachCount / academy.maxCoaches) * 100),
    daysUntilExpiry,
    isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0,
    isExpired: academy.subscriptionStatus === 'EXPIRED' || (daysUntilExpiry !== null && daysUntilExpiry <= 0),
  };
}

export async function upgradePlan(academyId: string, plan: SubscriptionPlan) {
  const limits = getPlanLimits(plan);
  return prisma.academy.update({
    where: { id: academyId },
    data: {
      subscriptionPlan: plan,
      maxStudents: limits.maxStudents,
      maxCoaches: limits.maxCoaches,
      subscriptionStatus: 'ACTIVE',
    },
  });
}
