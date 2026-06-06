"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const coachContext_1 = require("../middleware/coachContext");
const prisma_1 = require("../lib/prisma");
const tenantQuery_1 = require("../utils/tenantQuery");
const geo_1 = require("../utils/geo");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant, coachContext_1.resolveCoach);
// Coach self attendance
router.post('/coach/check-in', coachContext_1.coachOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, coachId, user } = req;
    const body = zod_1.z
        .object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        academyLatitude: zod_1.z.number(),
        academyLongitude: zod_1.z.number(),
        status: zod_1.z.enum(['PRESENT', 'LATE']).default('PRESENT'),
    })
        .parse(req.body);
    const academy = await prisma_1.prisma.academy.findUniqueOrThrow({ where: { id: academyId } });
    if (!(0, geo_1.isWithinRadius)(body.latitude, body.longitude, body.academyLatitude, body.academyLongitude, academy.attendanceRadiusM)) {
        throw new errors_1.ValidationError('You are outside the allowed attendance radius');
    }
    const today = new Date(new Date().toISOString().slice(0, 10));
    const existing = await prisma_1.prisma.coachAttendance.findUnique({
        where: { coachId_date: { coachId: coachId, date: today } },
    });
    if (existing)
        throw new errors_1.ValidationError('Attendance already marked for today');
    const record = await prisma_1.prisma.coachAttendance.create({
        data: {
            academyId: academyId,
            coachId: coachId,
            date: today,
            status: body.status,
            checkInAt: new Date(),
            latitude: body.latitude,
            longitude: body.longitude,
        },
    });
    (0, response_1.sendSuccess)(res, record, 'Coach attendance marked', 201);
}));
router.get('/coach', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN, client_1.UserRole.COACH), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, user, coachId } = req;
    const where = (0, tenantQuery_1.withTenant)(academyId, {
        ...(user.role === client_1.UserRole.COACH && { coachId: coachId }),
        ...(req.query.coachId && user.role === client_1.UserRole.ACADEMY_ADMIN && { coachId: req.query.coachId }),
    });
    const records = await prisma_1.prisma.coachAttendance.findMany({
        where,
        include: { coach: { include: { user: { select: { firstName: true, lastName: true } } } } },
        orderBy: { date: 'desc' },
        take: 100,
    });
    (0, response_1.sendSuccess)(res, records);
}));
// Student attendance
router.post('/student', coachContext_1.coachOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, coachId, user } = req;
    const body = zod_1.z
        .object({
        batchId: zod_1.z.string().uuid(),
        date: zod_1.z.string(),
        records: zod_1.z.array(zod_1.z.object({
            studentId: zod_1.z.string().uuid(),
            status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE']),
            notes: zod_1.z.string().optional(),
        })),
    })
        .parse(req.body);
    const assignment = await prisma_1.prisma.batchCoach.findFirst({
        where: { batchId: body.batchId, coachId: coachId },
    });
    if (!assignment)
        throw new errors_1.ForbiddenError('Not assigned to this batch');
    const batch = await prisma_1.prisma.batch.findUniqueOrThrow({ where: { id: body.batchId } });
    (0, tenantQuery_1.assertTenantMatch)(batch.academyId, academyId);
    const date = new Date(body.date);
    const created = [];
    for (const rec of body.records) {
        const student = await prisma_1.prisma.student.findUnique({ where: { id: rec.studentId } });
        if (!student || student.batchId !== body.batchId)
            continue;
        const existing = await prisma_1.prisma.studentAttendance.findUnique({
            where: {
                studentId_batchId_date: {
                    studentId: rec.studentId,
                    batchId: body.batchId,
                    date,
                },
            },
        });
        if (existing?.isLocked)
            continue;
        const record = await prisma_1.prisma.studentAttendance.upsert({
            where: {
                studentId_batchId_date: {
                    studentId: rec.studentId,
                    batchId: body.batchId,
                    date,
                },
            },
            create: {
                academyId: academyId,
                studentId: rec.studentId,
                batchId: body.batchId,
                date,
                status: rec.status,
                markedBy: user.userId,
                isLocked: true,
                notes: rec.notes,
            },
            update: {},
        });
        created.push(record);
    }
    (0, response_1.sendSuccess)(res, created, 'Student attendance submitted', 201);
}));
router.get('/student', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN, client_1.UserRole.COACH), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, coachId, user } = req;
    let batchFilter;
    if (user.role === client_1.UserRole.COACH) {
        const assignments = await prisma_1.prisma.batchCoach.findMany({
            where: { coachId: coachId },
            select: { batchId: true },
        });
        batchFilter = assignments.map((a) => a.batchId);
    }
    const records = await prisma_1.prisma.studentAttendance.findMany({
        where: (0, tenantQuery_1.withTenant)(academyId, {
            ...(batchFilter && { batchId: { in: batchFilter } }),
            ...(req.query.batchId && { batchId: req.query.batchId }),
            ...(req.query.studentId && { studentId: req.query.studentId }),
        }),
        include: {
            student: { select: { firstName: true, lastName: true } },
            batch: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: 200,
    });
    (0, response_1.sendSuccess)(res, records);
}));
exports.default = router;
//# sourceMappingURL=attendance.routes.js.map