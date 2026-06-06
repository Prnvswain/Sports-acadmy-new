"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlanLimits = getPlanLimits;
exports.checkStudentLimit = checkStudentLimit;
exports.checkCoachLimit = checkCoachLimit;
exports.getSubscriptionStatus = getSubscriptionStatus;
exports.upgradePlan = upgradePlan;
const config_1 = require("../config");
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
function getPlanLimits(plan) {
    return config_1.PLAN_LIMITS[plan];
}
async function checkStudentLimit(academyId) {
    const academy = await prisma_1.prisma.academy.findUniqueOrThrow({
        where: { id: academyId },
        select: { maxStudents: true, subscriptionPlan: true },
    });
    const count = await prisma_1.prisma.student.count({
        where: { academyId, deletedAt: null, isActive: true },
    });
    if (count >= academy.maxStudents) {
        throw new errors_1.LimitExceededError(`Student limit reached (${academy.maxStudents}). Upgrade your ${academy.subscriptionPlan} plan.`);
    }
    return { current: count, max: academy.maxStudents };
}
async function checkCoachLimit(academyId) {
    const academy = await prisma_1.prisma.academy.findUniqueOrThrow({
        where: { id: academyId },
        select: { maxCoaches: true, subscriptionPlan: true },
    });
    const count = await prisma_1.prisma.coach.count({
        where: { academyId, isActive: true },
    });
    if (count >= academy.maxCoaches) {
        throw new errors_1.LimitExceededError(`Coach limit reached (${academy.maxCoaches}). Upgrade your ${academy.subscriptionPlan} plan.`);
    }
    return { current: count, max: academy.maxCoaches };
}
async function getSubscriptionStatus(academyId) {
    const academy = await prisma_1.prisma.academy.findUniqueOrThrow({
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
        prisma_1.prisma.student.count({ where: { academyId, deletedAt: null, isActive: true } }),
        prisma_1.prisma.coach.count({ where: { academyId, isActive: true } }),
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
async function upgradePlan(academyId, plan) {
    const limits = getPlanLimits(plan);
    return prisma_1.prisma.academy.update({
        where: { id: academyId },
        data: {
            subscriptionPlan: plan,
            maxStudents: limits.maxStudents,
            maxCoaches: limits.maxCoaches,
            subscriptionStatus: 'ACTIVE',
        },
    });
}
//# sourceMappingURL=subscription.service.js.map