"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const reportService = __importStar(require("../services/report.service"));
const router = (0, express_1.Router)();
const filterSchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    sportId: zod_1.z.string().uuid().optional(),
    batchId: zod_1.z.string().uuid().optional(),
    coachId: zod_1.z.string().uuid().optional(),
    studentId: zod_1.z.string().uuid().optional(),
    format: zod_1.z.enum(['json', 'csv', 'excel', 'pdf']).default('json'),
});
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant);
router.use((0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN));
function parseFilters(academyId, query) {
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
router.get('/students', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const filters = parseFilters(academyId, req.query);
    const data = await reportService.getStudentReport(filters);
    if (filters.format === 'csv') {
        const csv = reportService.toCSV(data, [
            'firstName', 'lastName', 'email', 'phone', 'sport.name', 'batch.name',
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
        res.send(csv);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
}));
router.get('/attendance', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const filters = parseFilters(academyId, req.query);
    const data = await reportService.getAttendanceReport(filters);
    (0, response_1.sendSuccess)(res, data);
}));
router.get('/revenue', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const filters = parseFilters(academyId, req.query);
    const data = await reportService.getRevenueReport(filters);
    (0, response_1.sendSuccess)(res, data);
}));
router.get('/performance', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const filters = parseFilters(academyId, req.query);
    const data = await reportService.getPerformanceReport(filters);
    (0, response_1.sendSuccess)(res, data);
}));
router.get('/coaches', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const filters = parseFilters(academyId, req.query);
    const data = await reportService.getCoachReport(filters);
    (0, response_1.sendSuccess)(res, data);
}));
router.get('/due-fees', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const filters = parseFilters(academyId, req.query);
    const data = await reportService.getDueFeesReport(filters);
    (0, response_1.sendSuccess)(res, data);
}));
exports.default = router;
//# sourceMappingURL=report.routes.js.map