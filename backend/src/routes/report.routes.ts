import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import * as reportService from '../services/report.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const filterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sportId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  coachId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  format: z.enum(['json', 'csv', 'excel', 'pdf']).default('json'),
});

router.use(authenticate, resolveTenant, requireTenant);
router.use(requireRoles(UserRole.ACADEMY_ADMIN));

function parseFilters(academyId: string, query: Record<string, unknown>) {
  const parsed = filterSchema.parse(query);
  return {
    academyId,
    startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
    endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
    sportId: parsed.sportId,
    batchId: parsed.batchId,
    coachId: parsed.coachId,
    studentId: parsed.studentId,
    format: parsed.format,
  };
}

router.get(
  '/students',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const filters = parseFilters(academyId!, req.query as Record<string, unknown>);
    const data = await reportService.getStudentReport(filters);

    if (filters.format === 'csv') {
      const csv = reportService.toCSV(data as unknown as Record<string, unknown>[], [
        'firstName', 'lastName', 'email', 'phone', 'sport.name', 'batch.name',
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
      return res.send(csv);
    }

    sendSuccess(res, data);
  })
);

router.get(
  '/attendance',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const filters = parseFilters(academyId!, req.query as Record<string, unknown>);
    const data = await reportService.getAttendanceReport(filters);
    sendSuccess(res, data);
  })
);

router.get(
  '/revenue',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const filters = parseFilters(academyId!, req.query as Record<string, unknown>);
    const data = await reportService.getRevenueReport(filters);
    sendSuccess(res, data);
  })
);

router.get(
  '/performance',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const filters = parseFilters(academyId!, req.query as Record<string, unknown>);
    const data = await reportService.getPerformanceReport(filters);
    sendSuccess(res, data);
  })
);

router.get(
  '/coaches',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const filters = parseFilters(academyId!, req.query as Record<string, unknown>);
    const data = await reportService.getCoachReport(filters);
    sendSuccess(res, data);
  })
);

router.get(
  '/due-fees',
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    const filters = parseFilters(academyId!, req.query as Record<string, unknown>);
    const data = await reportService.getDueFeesReport(filters);
    sendSuccess(res, data);
  })
);

export default router;
