"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentReport = getStudentReport;
exports.getAttendanceReport = getAttendanceReport;
exports.getRevenueReport = getRevenueReport;
exports.getPerformanceReport = getPerformanceReport;
exports.getCoachReport = getCoachReport;
exports.getDueFeesReport = getDueFeesReport;
exports.toCSV = toCSV;
exports.toExcel = toExcel;
exports.toPDF = toPDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const exceljs_1 = __importDefault(require("exceljs"));
const sync_1 = require("csv-stringify/sync");
const prisma_1 = require("../lib/prisma");
const tenantQuery_1 = require("../utils/tenantQuery");
function dateFilter(startDate, endDate) {
    if (!startDate && !endDate)
        return {};
    return {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
    };
}
async function getStudentReport(filters) {
    const where = (0, tenantQuery_1.withTenant)(filters.academyId, {
        deletedAt: null,
        ...(filters.sportId && { sportId: filters.sportId }),
        ...(filters.batchId && { batchId: filters.batchId }),
        ...(filters.studentId && { id: filters.studentId }),
    });
    return prisma_1.prisma.student.findMany({
        where,
        include: {
            sport: { select: { name: true } },
            batch: { select: { name: true } },
            membershipPlan: { select: { name: true, multiplier: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function getAttendanceReport(filters) {
    const dateRange = dateFilter(filters.startDate, filters.endDate);
    return prisma_1.prisma.studentAttendance.findMany({
        where: (0, tenantQuery_1.withTenant)(filters.academyId, {
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
async function getRevenueReport(filters) {
    const dateRange = dateFilter(filters.startDate, filters.endDate);
    return prisma_1.prisma.feePayment.findMany({
        where: (0, tenantQuery_1.withTenant)(filters.academyId, {
            ...(Object.keys(dateRange).length && { createdAt: dateRange }),
            ...(filters.studentId && { studentId: filters.studentId }),
        }),
        include: {
            student: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function getPerformanceReport(filters) {
    const dateRange = dateFilter(filters.startDate, filters.endDate);
    return prisma_1.prisma.performanceScore.findMany({
        where: (0, tenantQuery_1.withTenant)(filters.academyId, {
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
async function getCoachReport(filters) {
    return prisma_1.prisma.coach.findMany({
        where: (0, tenantQuery_1.withTenant)(filters.academyId, {
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
async function getDueFeesReport(filters) {
    return prisma_1.prisma.feePayment.findMany({
        where: (0, tenantQuery_1.withTenant)(filters.academyId, {
            status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
            ...(filters.studentId && { studentId: filters.studentId }),
        }),
        include: {
            student: { select: { firstName: true, lastName: true, phone: true } },
        },
        orderBy: { dueDate: 'asc' },
    });
}
function toCSV(rows, columns) {
    const data = rows.map((row) => columns.map((col) => {
        const val = col.split('.').reduce((obj, key) => {
            if (obj && typeof obj === 'object')
                return obj[key];
            return undefined;
        }, row);
        return val ?? '';
    }));
    return (0, sync_1.stringify)([columns, ...data]);
}
async function toExcel(sheetName, rows, columns) {
    const workbook = new exceljs_1.default.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns;
    rows.forEach((row) => {
        const record = {};
        columns.forEach((c) => {
            record[c.key] = c.key.split('.').reduce((obj, key) => {
                if (obj && typeof obj === 'object')
                    return obj[key];
                return undefined;
            }, row);
        });
        sheet.addRow(record);
    });
    return workbook.xlsx.writeBuffer();
}
function toPDF(title, headers, rows) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
        const chunks = [];
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
//# sourceMappingURL=report.service.js.map