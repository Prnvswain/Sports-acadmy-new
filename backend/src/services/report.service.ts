import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { withTenant } from '../utils/tenantQuery';

export interface ReportFilters {
  academyId: string;
  startDate?: Date;
  endDate?: Date;
  sportId?: string;
  batchId?: string;
  coachId?: string;
  studentId?: string;
}

function dateFilter(startDate?: Date, endDate?: Date) {
  if (!startDate && !endDate) return {};
  return {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };
}

export async function getStudentReport(filters: ReportFilters) {
  const where = withTenant(filters.academyId, {
    deletedAt: null,
    ...(filters.sportId && { sportId: filters.sportId }),
    ...(filters.batchId && { batchId: filters.batchId }),
    ...(filters.studentId && { id: filters.studentId }),
  });

  return prisma.student.findMany({
    where,
    include: {
      sport: { select: { name: true } },
      batch: { select: { name: true } },
      membershipPlan: { select: { name: true, multiplier: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAttendanceReport(filters: ReportFilters) {
  const dateRange = dateFilter(filters.startDate, filters.endDate);
  return prisma.studentAttendance.findMany({
    where: withTenant(filters.academyId, {
      ...(Object.keys(dateRange).length && { date: dateRange }),
      ...(filters.batchId && { batchId: filters.batchId }),
      ...(filters.studentId && { studentId: filters.studentId }),
    }),
    include: {
      student: { select: { firstName: true, lastName: true } },
      batch: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getRevenueReport(filters: ReportFilters) {
  const dateRange = dateFilter(filters.startDate, filters.endDate);
  return prisma.feePayment.findMany({
    where: withTenant(filters.academyId, {
      ...(Object.keys(dateRange).length && { createdAt: dateRange }),
      ...(filters.studentId && { studentId: filters.studentId }),
    }),
    include: {
      student: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPerformanceReport(filters: ReportFilters) {
  const dateRange = dateFilter(filters.startDate, filters.endDate);
  return prisma.performanceScore.findMany({
    where: withTenant(filters.academyId, {
      ...(Object.keys(dateRange).length && { scoredAt: dateRange }),
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.coachId && { coachId: filters.coachId }),
    }),
    include: {
      student: { select: { firstName: true, lastName: true } },
      attribute: { select: { name: true } },
      coach: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { scoredAt: 'desc' },
  });
}

export async function getCoachReport(filters: ReportFilters) {
  return prisma.coach.findMany({
    where: withTenant(filters.academyId, {
      ...(filters.coachId && { id: filters.coachId }),
      isActive: true,
    }),
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      batchAssignments: { include: { batch: { select: { name: true } } } },
      _count: { select: { coachAttendances: true, performanceScores: true } },
    },
  });
}

export async function getDueFeesReport(filters: ReportFilters) {
  return prisma.feePayment.findMany({
    where: withTenant(filters.academyId, {
      status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL] },
      ...(filters.studentId && { studentId: filters.studentId }),
    }),
    include: {
      student: { select: { firstName: true, lastName: true, phone: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const data = rows.map((row) =>
    columns.map((col) => {
      const val = col.split('.').reduce((obj: unknown, key) => {
        if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
        return undefined;
      }, row as unknown);
      return val ?? '';
    })
  );
  return stringify([columns, ...data]);
}

export async function toExcel(sheetName: string, rows: Record<string, unknown>[], columns: { header: string; key: string }[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  rows.forEach((row) => {
    const record: Record<string, unknown> = {};
    columns.forEach((c) => {
      record[c.key] = c.key.split('.').reduce((obj: unknown, key) => {
        if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
        return undefined;
      }, row as unknown);
    });
    sheet.addRow(record);
  });
  return workbook.xlsx.writeBuffer();
}

export function toPDF(title: string, headers: string[], rows: string[][]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(8);

    const colWidth = (doc.page.width - 80) / headers.length;
    let y = doc.y;
    headers.forEach((h, i) => doc.text(h, 40 + i * colWidth, y, { width: colWidth }));
    y += 20;

    rows.forEach((row) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
      row.forEach((cell, i) => doc.text(String(cell), 40 + i * colWidth, y, { width: colWidth }));
      y += 16;
    });

    doc.end();
  });
}
