import { parse } from 'csv-parse/sync';
import { prisma } from '../lib/prisma';
import { hashPassword } from './auth.service';
import { checkCoachLimit, checkStudentLimit } from './subscription.service';
import { UserRole } from '@prisma/client';

export interface ImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: ImportRowError[];
  preview?: Record<string, string>[];
}

const STUDENT_REQUIRED = ['firstName', 'lastName'];
const COACH_REQUIRED = ['firstName', 'lastName', 'email'];

export function parseCSV(buffer: Buffer): Record<string, string>[] {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
}

export function validateStudentRows(rows: Record<string, string>[]): ImportResult {
  const errors: ImportRowError[] = [];
  rows.forEach((row, i) => {
    STUDENT_REQUIRED.forEach((field) => {
      if (!row[field]?.trim()) {
        errors.push({ row: i + 2, field, message: `${field} is required` });
      }
    });
  });
  return { total: rows.length, success: 0, failed: errors.length, errors, preview: rows.slice(0, 10) };
}

export function validateCoachRows(rows: Record<string, string>[]): ImportResult {
  const errors: ImportRowError[] = [];
  rows.forEach((row, i) => {
    COACH_REQUIRED.forEach((field) => {
      if (!row[field]?.trim()) {
        errors.push({ row: i + 2, field, message: `${field} is required` });
      }
    });
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: i + 2, field: 'email', message: 'Invalid email format' });
    }
  });
  return { total: rows.length, success: 0, failed: errors.length, errors, preview: rows.slice(0, 10) };
}

export async function importStudents(
  academyId: string,
  rows: Record<string, string>[]
): Promise<ImportResult> {
  const validation = validateStudentRows(rows);
  if (validation.errors.length === rows.length) return { ...validation, success: 0, failed: rows.length };

  const errors: ImportRowError[] = [...validation.errors];
  let success = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors = validation.errors.filter((e) => e.row === i + 2);
    if (rowErrors.length) continue;

    try {
      await checkStudentLimit(academyId);
      await prisma.student.create({
        data: {
          academyId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || null,
          phone: row.phone || null,
          guardianName: row.guardianName || null,
          guardianPhone: row.guardianPhone || null,
          guardianEmail: row.guardianEmail || null,
        },
      });
      success++;
    } catch (err) {
      errors.push({
        row: i + 2,
        message: err instanceof Error ? err.message : 'Import failed',
      });
    }
  }

  return { total: rows.length, success, failed: rows.length - success, errors };
}

export async function importCoaches(
  academyId: string,
  rows: Record<string, string>[],
  defaultPassword: string
): Promise<ImportResult> {
  const validation = validateCoachRows(rows);
  const errors: ImportRowError[] = [...validation.errors];
  let success = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (validation.errors.some((e) => e.row === i + 2)) continue;

    try {
      await checkCoachLimit(academyId);
      const existing = await prisma.user.findUnique({ where: { email: row.email.toLowerCase() } });
      if (existing) {
        errors.push({ row: i + 2, field: 'email', message: 'Email already exists' });
        continue;
      }

      const passwordHash = await hashPassword(row.password || defaultPassword);
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: row.email.toLowerCase(),
            passwordHash,
            firstName: row.firstName,
            lastName: row.lastName,
            role: UserRole.COACH,
            academyId,
          },
        });
        await tx.coach.create({
          data: { academyId, userId: user.id, phone: row.phone || null },
        });
      });
      success++;
    } catch (err) {
      errors.push({
        row: i + 2,
        message: err instanceof Error ? err.message : 'Import failed',
      });
    }
  }

  return { total: rows.length, success, failed: rows.length - success, errors };
}

export const STUDENT_TEMPLATE = 'firstName,lastName,email,phone,guardianName,guardianPhone,guardianEmail\nJohn,Doe,john@example.com,9876543210,Jane Doe,9876543211,jane@example.com';
export const COACH_TEMPLATE = 'firstName,lastName,email,phone,password\nAlex,Smith,alex@example.com,9876543210,Coach@123';
