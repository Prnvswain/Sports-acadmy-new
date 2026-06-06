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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const importService = __importStar(require("../services/import.service"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireTenant, (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN));
router.get('/students/template', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students-template.csv');
    res.send(importService.STUDENT_TEMPLATE);
}));
router.get('/coaches/template', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=coaches-template.csv');
    res.send(importService.COACH_TEMPLATE);
}));
router.post('/students/preview', upload.single('file'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new Error('File required');
    const rows = importService.parseCSV(req.file.buffer);
    const result = importService.validateStudentRows(rows);
    (0, response_1.sendSuccess)(res, result);
}));
router.post('/students', upload.single('file'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    if (!req.file)
        throw new Error('File required');
    const rows = importService.parseCSV(req.file.buffer);
    const result = await importService.importStudents(academyId, rows);
    (0, response_1.sendSuccess)(res, result);
}));
router.post('/coaches/preview', upload.single('file'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new Error('File required');
    const rows = importService.parseCSV(req.file.buffer);
    const result = importService.validateCoachRows(rows);
    (0, response_1.sendSuccess)(res, result);
}));
router.post('/coaches', upload.single('file'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    if (!req.file)
        throw new Error('File required');
    const rows = importService.parseCSV(req.file.buffer);
    const result = await importService.importCoaches(academyId, rows, 'Coach@123');
    (0, response_1.sendSuccess)(res, result);
}));
exports.default = router;
//# sourceMappingURL=import.routes.js.map