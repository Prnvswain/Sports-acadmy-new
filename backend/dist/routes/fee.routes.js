"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const prisma_1 = require("../lib/prisma");
const tenantQuery_1 = require("../utils/tenantQuery");
const feeCalculator_1 = require("../utils/feeCalculator");
const auth_service_1 = require("../services/auth.service");
const receipt_service_1 = require("../services/receipt.service");
const errors_1 = require("../utils/errors");
const params_1 = require("../utils/params");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant);
router.use((0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const { page, limit, skip } = (0, tenantQuery_1.getPagination)(Number(req.query.page), Number(req.query.limit));
    const status = req.query.status;
    const where = (0, tenantQuery_1.withTenant)(academyId, {
        ...(status && { status: status }),
    });
    const [payments, total] = await Promise.all([
        prisma_1.prisma.feePayment.findMany({
            where,
            skip,
            take: limit,
            include: { student: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.feePayment.count({ where }),
    ]);
    (0, response_1.sendPaginated)(res, payments, total, page, limit);
}));
router.get('/dashboard', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [totalRevenue, monthlyRevenue, pending, overdue] = await Promise.all([
        prisma_1.prisma.feePayment.aggregate({
            where: (0, tenantQuery_1.withTenant)(academyId, { status: client_1.PaymentStatus.PAID }),
            _sum: { amount: true },
        }),
        prisma_1.prisma.feePayment.aggregate({
            where: (0, tenantQuery_1.withTenant)(academyId, { status: client_1.PaymentStatus.PAID, paidDate: { gte: monthStart } }),
            _sum: { amount: true },
        }),
        prisma_1.prisma.feePayment.aggregate({
            where: (0, tenantQuery_1.withTenant)(academyId, { status: client_1.PaymentStatus.PENDING }),
            _sum: { amount: true },
        }),
        prisma_1.prisma.feePayment.aggregate({
            where: (0, tenantQuery_1.withTenant)(academyId, { status: client_1.PaymentStatus.OVERDUE }),
            _sum: { amount: true },
        }),
    ]);
    (0, response_1.sendSuccess)(res, {
        totalRevenue: Number(totalRevenue._sum?.amount || 0),
        monthlyRevenue: Number(monthlyRevenue._sum?.amount || 0),
        pendingDues: Number(pending._sum?.amount || 0),
        overdueDues: Number(overdue._sum?.amount || 0),
    });
}));
router.post('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const body = zod_1.z
        .object({
        studentId: zod_1.z.string().uuid(),
        dueDate: zod_1.z.string(),
        periodStart: zod_1.z.string(),
        periodEnd: zod_1.z.string(),
        paymentMethod: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        collectNow: zod_1.z.boolean().default(false),
    })
        .parse(req.body);
    const student = await prisma_1.prisma.student.findUnique({
        where: { id: body.studentId },
        include: { sport: true, membershipPlan: true },
    });
    if (!student)
        throw new errors_1.NotFoundError('Student not found');
    (0, tenantQuery_1.assertTenantMatch)(student.academyId, academyId);
    const academy = await prisma_1.prisma.academy.findUniqueOrThrow({ where: { id: academyId } });
    const sportFee = Number(student.sport?.monthlyFee || 0);
    const multiplier = Number(student.membershipPlan?.multiplier || 1);
    const regFee = Number(student.registrationFee);
    const additional = Number(student.additionalCharges);
    const discount = Number(student.discount);
    const amount = (0, feeCalculator_1.calculateFinalFee)({
        sportMonthlyFee: sportFee,
        planMultiplier: multiplier,
        registrationFee: regFee,
        additionalCharges: additional,
        discount,
    });
    const payment = await prisma_1.prisma.feePayment.create({
        data: {
            academyId: academyId,
            studentId: student.id,
            receiptNumber: (0, auth_service_1.generateReceiptNumber)(academy.receiptPrefix),
            amount,
            sportFee: sportFee * multiplier,
            planMultiplier: multiplier,
            registrationFee: regFee,
            additionalCharges: additional,
            discount,
            dueDate: new Date(body.dueDate),
            periodStart: new Date(body.periodStart),
            periodEnd: new Date(body.periodEnd),
            status: body.collectNow ? 'PAID' : 'PENDING',
            paidDate: body.collectNow ? new Date() : null,
            paymentMethod: body.paymentMethod,
            notes: body.notes,
        },
        include: { student: { select: { firstName: true, lastName: true } } },
    });
    (0, response_1.sendSuccess)(res, payment, 'Fee record created', 201);
}));
router.post('/:id/collect', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const { paymentMethod } = zod_1.z.object({ paymentMethod: zod_1.z.string().optional() }).parse(req.body);
    const id = (0, params_1.paramId)(req);
    const payment = await prisma_1.prisma.feePayment.findUnique({ where: { id } });
    if (!payment)
        throw new errors_1.NotFoundError();
    (0, tenantQuery_1.assertTenantMatch)(payment.academyId, academyId);
    const updated = await prisma_1.prisma.feePayment.update({
        where: { id },
        data: { status: client_1.PaymentStatus.PAID, paidDate: new Date(), paymentMethod },
    });
    (0, response_1.sendSuccess)(res, updated, 'Payment collected');
}));
router.get('/:id/receipt', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const id = (0, params_1.paramId)(req);
    const pdf = await (0, receipt_service_1.generateReceiptPDF)(id, academyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${id}.pdf`);
    res.send(pdf);
}));
exports.default = router;
//# sourceMappingURL=fee.routes.js.map