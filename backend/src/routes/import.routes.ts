import { Router } from 'express';
import multer from 'multer';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { AuthRequest } from '../types';
import * as importService from '../services/import.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.use(authenticate, resolveTenant, requireTenant, requireRoles(UserRole.ACADEMY_ADMIN));

router.get(
  '/students/template',
  asyncHandler(async (_req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students-template.csv');
    res.send(importService.STUDENT_TEMPLATE);
  })
);

router.get(
  '/coaches/template',
  asyncHandler(async (_req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=coaches-template.csv');
    res.send(importService.COACH_TEMPLATE);
  })
);

router.post(
  '/students/preview',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new Error('File required');
    const rows = importService.parseCSV(req.file.buffer);
    const result = importService.validateStudentRows(rows);
    sendSuccess(res, result);
  })
);

router.post(
  '/students',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    if (!req.file) throw new Error('File required');
    const rows = importService.parseCSV(req.file.buffer);
    const result = await importService.importStudents(academyId!, rows);
    sendSuccess(res, result);
  })
);

router.post(
  '/coaches/preview',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new Error('File required');
    const rows = importService.parseCSV(req.file.buffer);
    const result = importService.validateCoachRows(rows);
    sendSuccess(res, result);
  })
);

router.post(
  '/coaches',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { academyId } = req as AuthRequest;
    if (!req.file) throw new Error('File required');
    const rows = importService.parseCSV(req.file.buffer);
    const result = await importService.importCoaches(academyId!, rows, 'Coach@123');
    sendSuccess(res, result);
  })
);

export default router;
