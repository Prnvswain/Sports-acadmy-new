"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COACH_TEMPLATE = exports.STUDENT_TEMPLATE = void 0;
exports.parseCSV = parseCSV;
exports.validateStudentRows = validateStudentRows;
exports.validateCoachRows = validateCoachRows;
exports.importStudents = importStudents;
exports.importCoaches = importCoaches;
const sync_1 = require("csv-parse/sync");
const prisma_1 = require("../lib/prisma");
const auth_service_1 = require("./auth.service");
const subscription_service_1 = require("./subscription.service");
const client_1 = require("@prisma/client");
const STUDENT_REQUIRED = ['firstName', 'lastName'];
const COACH_REQUIRED = ['firstName', 'lastName', 'email'];
function parseCSV(buffer) {
    return (0, sync_1.parse)(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
    });
}
function validateStudentRows(rows) {
    const errors = [];
    rows.forEach((row, i) => {
        STUDENT_REQUIRED.forEach((field) => {
            if (!row[field]?.trim()) {
                errors.push({ row: i + 2, field, message: `${field} is required` });
            }
        });
    });
    return { total: rows.length, success: 0, failed: errors.length, errors, preview: rows.slice(0, 10) };
}
function validateCoachRows(rows) {
    const errors = [];
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
async function importStudents(academyId, rows) {
    const validation = validateStudentRows(rows);
    if (validation.errors.length === rows.length)
        return { ...validation, success: 0, failed: rows.length };
    const errors = [...validation.errors];
    let success = 0;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowErrors = validation.errors.filter((e) => e.row === i + 2);
        if (rowErrors.length)
            continue;
        try {
            await (0, subscription_service_1.checkStudentLimit)(academyId);
            await prisma_1.prisma.student.create({
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
        }
        catch (err) {
            errors.push({
                row: i + 2,
                message: err instanceof Error ? err.message : 'Import failed',
            });
        }
    }
    return { total: rows.length, success, failed: rows.length - success, errors };
}
async function importCoaches(academyId, rows, defaultPassword) {
    const validation = validateCoachRows(rows);
    const errors = [...validation.errors];
    let success = 0;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (validation.errors.some((e) => e.row === i + 2))
            continue;
        try {
            await (0, subscription_service_1.checkCoachLimit)(academyId);
            const existing = await prisma_1.prisma.user.findUnique({ where: { email: row.email.toLowerCase() } });
            if (existing) {
                errors.push({ row: i + 2, field: 'email', message: 'Email already exists' });
                continue;
            }
            const passwordHash = await (0, auth_service_1.hashPassword)(row.password || defaultPassword);
            await prisma_1.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: row.email.toLowerCase(),
                        passwordHash,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        role: client_1.UserRole.COACH,
                        academyId,
                    },
                });
                await tx.coach.create({
                    data: { academyId, userId: user.id, phone: row.phone || null },
                });
            });
            success++;
        }
        catch (err) {
            errors.push({
                row: i + 2,
                message: err instanceof Error ? err.message : 'Import failed',
            });
        }
    }
    return { total: rows.length, success, failed: rows.length - success, errors };
}
exports.STUDENT_TEMPLATE = 'firstName,lastName,email,phone,guardianName,guardianPhone,guardianEmail\nJohn,Doe,john@example.com,9876543210,Jane Doe,9876543211,jane@example.com';
exports.COACH_TEMPLATE = 'firstName,lastName,email,phone,password\nAlex,Smith,alex@example.com,9876543210,Coach@123';
//# sourceMappingURL=import.service.js.map