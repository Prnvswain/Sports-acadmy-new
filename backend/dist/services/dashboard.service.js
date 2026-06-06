"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = getAdminDashboard;
exports.getCoachDashboard = getCoachDashboard;
exports.getSuperAdminDashboard = getSuperAdminDashboard;
const prisma_1 = require("../lib/prisma");
const tenantQuery_1 = require("../utils/tenantQuery");
const subscription_service_1 = require("./subscription.service");
async function getAdminDashboard(academyId) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [activeStudents, activeCoaches, activeBatches, monthlyRevenue, pendingDues, overdueDues, revenueTrend, studentGrowth, attendanceTrend, sportsDistribution, recentActivities, absentCoachesToday, subscription,] = await Promise.all([
        prisma_1.prisma.student.count({ where: { academyId, isActive: true, deletedAt: null } }),
        prisma_1.prisma.coach.count({ where: { academyId, isActive: true } }),
        prisma_1.prisma.batch.count({ where: { academyId, isActive: true } }),
        prisma_1.prisma.feePayment.aggregate({
            where: { academyId, status: 'PAID', paidDate: { gte: monthStart } },
            _sum: { amount: true },
        }),
        prisma_1.prisma.feePayment.aggregate({
            where: { academyId, status: 'PENDING' },
            _sum: { amount: true },
        }),
        prisma_1.prisma.feePayment.aggregate({
            where: { academyId, status: 'OVERDUE' },
            _sum: { amount: true },
        }),
        getRevenueTrend(academyId),
        getStudentGrowth(academyId),
        getAttendanceTrend(academyId),
        getSportsDistribution(academyId),
        prisma_1.prisma.auditLog.findMany({
            where: { academyId },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { firstName: true, lastName: true } } },
        }),
        prisma_1.prisma.coachAttendance.findMany({
            where: {
                academyId,
                date: new Date(now.toISOString().slice(0, 10)),
                status: 'ABSENT',
            },
            include: { coach: { include: { user: { select: { firstName: true, lastName: true } } } } },
        }),
        (0, subscription_service_1.getSubscriptionStatus)(academyId),
    ]);
    return {
        cards: {
            activeStudents,
            activeCoaches,
            activeBatches,
            monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
            pendingDues: Number(pendingDues._sum.amount || 0),
            overdueDues: Number(overdueDues._sum.amount || 0),
        },
        charts: { revenueTrend, studentGrowth, attendanceTrend, sportsDistribution },
        widgets: { subscription, recentActivities, absentCoachesToday },
    };
}
async function getCoachDashboard(academyId, coachId) {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const batches = await prisma_1.prisma.batchCoach.findMany({
        where: { coachId },
        include: {
            batch: {
                include: {
                    sport: { select: { name: true } },
                    students: { where: { isActive: true, deletedAt: null }, select: { id: true } },
                },
            },
        },
    });
    const todayBatches = batches.filter((b) => b.batch.isActive);
    const ownAttendance = await prisma_1.prisma.coachAttendance.findFirst({
        where: { coachId, date: new Date(today) },
    });
    const monthlyAttendance = await prisma_1.prisma.coachAttendance.groupBy({
        by: ['status'],
        where: { coachId, date: { gte: monthStart } },
        _count: true,
    });
    const pendingPerformance = await prisma_1.prisma.student.count({
        where: {
            academyId,
            batchId: { in: batches.map((b) => b.batchId) },
            isActive: true,
            deletedAt: null,
        },
    });
    const batchIds = batches.map((b) => b.batchId);
    const todayAttendanceMarked = await prisma_1.prisma.studentAttendance.count({
        where: { batchId: { in: batchIds }, date: new Date(today) },
    });
    const totalStudents = batches.reduce((sum, b) => sum + b.batch.students.length, 0);
    return {
        todayBatches: todayBatches.map((b) => ({
            id: b.batch.id,
            name: b.batch.name,
            sport: b.batch.sport.name,
            startTime: b.batch.startTime,
            endTime: b.batch.endTime,
            studentCount: b.batch.students.length,
        })),
        attendancePending: Math.max(0, totalStudents - todayAttendanceMarked),
        ownAttendanceStatus: ownAttendance?.status || null,
        monthlyAttendanceSummary: monthlyAttendance,
        pendingPerformanceTasks: pendingPerformance,
    };
}
async function getSuperAdminDashboard() {
    const [academies, revenue, planBreakdown] = await Promise.all([
        prisma_1.prisma.academy.groupBy({ by: ['status'], _count: true }),
        prisma_1.prisma.feePayment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
        prisma_1.prisma.academy.groupBy({ by: ['subscriptionPlan'], _count: true }),
    ]);
    const totalAcademies = academies.reduce((s, a) => s + a._count, 0);
    const activeAcademies = academies.find((a) => a.status === 'ACTIVE')?._count || 0;
    return {
        totalAcademies,
        activeAcademies,
        totalRevenue: Number(revenue._sum.amount || 0),
        planBreakdown,
    };
}
async function getRevenueTrend(academyId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const payments = await prisma_1.prisma.feePayment.findMany({
        where: { academyId, status: 'PAID', paidDate: { gte: sixMonthsAgo } },
        select: { amount: true, paidDate: true },
    });
    const byMonth = {};
    payments.forEach((p) => {
        if (!p.paidDate)
            return;
        const key = p.paidDate.toISOString().slice(0, 7);
        byMonth[key] = (byMonth[key] || 0) + Number(p.amount);
    });
    return Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }));
}
async function getStudentGrowth(academyId) {
    const students = await prisma_1.prisma.student.findMany({
        where: (0, tenantQuery_1.withTenant)(academyId, { deletedAt: null }),
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
    });
    const byMonth = {};
    students.forEach((s) => {
        const key = s.createdAt.toISOString().slice(0, 7);
        byMonth[key] = (byMonth[key] || 0) + 1;
    });
    let cumulative = 0;
    return Object.entries(byMonth).map(([month, count]) => {
        cumulative += count;
        return { month, newStudents: count, total: cumulative };
    });
}
async function getAttendanceTrend(academyId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const records = await prisma_1.prisma.studentAttendance.groupBy({
        by: ['status'],
        where: { academyId, date: { gte: thirtyDaysAgo } },
        _count: true,
    });
    return records.map((r) => ({ status: r.status, count: r._count }));
}
async function getSportsDistribution(academyId) {
    const sports = await prisma_1.prisma.sport.findMany({
        where: { academyId, isActive: true },
        include: { _count: { select: { students: true, batches: true } } },
    });
    return sports.map((s) => ({
        name: s.name,
        students: s._count.students,
        batches: s._count.batches,
    }));
}
//# sourceMappingURL=dashboard.service.js.map