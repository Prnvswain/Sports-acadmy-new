import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { withTenant, assertTenantMatch, getPagination } from '../utils/tenantQuery';
import { calculateFinalFee } from '../utils/feeCalculator';
import { generateReceiptNumber } from '../services/auth.service';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.use(authenticate, resolveTenant, requireTenant);
router.use(requireRoles(UserRole.ACADEMY_ADMIN));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const { page, limit, skip } = getPagination(Number(req.query.page), Number(req.query.limit));
    const status = req.query.status as string | undefined;

    const where = withTenant(academyId!, {
      ...(status && { status: status as 'PENDING' | 'PAID' | 'OVERDUE' }),
    });

    const [payments, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        skip,
        take: limit,
        include: { student: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feePayment.count({ where }),
    ]);
    sendPaginated(res, payments, total, page, limit);
  })
);

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalRevenue, monthlyRevenue, pending, overdue] = await Promise.all([
      prisma.feePayment.aggregate({
        where: withTenant(academyId!, { status: 'PAID' }),
        _sum: { amount: true },
      }),
      prisma.feePayment.aggregate({
        where: withTenant(academyId!, { status: 'PAID', paidDate: { gte: monthStart } }),
        _sum: { amount: true },
      }),
      prisma.feePayment.aggregate({
        where: withTenant(academyId!, { status: 'PENDING' }),
        _sum: { amount: true },
      }),
      prisma.feePayment.aggregate({
        where: withTenant(academyId!, { status: 'OVERDUE' }),
        _sum: { amount: true },
      }),
    ]);

    sendSuccess(res, {
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      pendingDues: Number(pending._sum.amount || 0),
      overdueDues: Number(overdue._sum.amount || 0),
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const body = z
      .object({
        studentId: z.string().uuid(),
        dueDate: z.string(),
        periodStart: z.string(),
        periodEnd: z.string(),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
        collectNow: z.boolean().default(false),
      })
      .parse(req.body);

    const student = await prisma.student.findUnique({
      where: { id: body.studentId },
      include: { sport: true, membershipPlan: true },
    });
    if (!student) throw new NotFoundError('Student not found');
    assertTenantMatch(student.academyId, academyId);

    const academy = await prisma.academy.findUniqueOrThrow({ where: { id: academyId! } });
    const sportFee = Number(student.sport?.monthlyFee || 0);
    const multiplier = Number(student.membershipPlan?.multiplier || 1);
    const regFee = Number(student.registrationFee);
    const additional = Number(student.additionalCharges);
    const discount = Number(student.discount);

    const amount = calculateFinalFee({
      sportMonthlyFee: sportFee,
      planMultiplier: multiplier,
      registrationFee: regFee,
      additionalCharges: additional,
      discount,
    });

    const payment = await prisma.feePayment.create({
      data: {
        academyId: academyId!,
        studentId: student.id,
        receiptNumber: generateReceiptNumber(academy.receiptPrefix),
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

    sendSuccess(res, payment, 'Fee record created', 201);
  })
);

router.post(
  '/:id/collect',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const { paymentMethod } = z.object({ paymentMethod: z.string().optional() }).parse(req.body);

    const payment = await prisma.feePayment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw new NotFoundError();
    assertTenantMatch(payment.academyId, academyId);

    const updated = await prisma.feePayment.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidDate: new Date(), paymentMethod },
    });
    sendSuccess(res, updated, 'Payment collected');
  })
);

export default router;
