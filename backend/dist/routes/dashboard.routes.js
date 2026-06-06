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
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const coachContext_1 = require("../middleware/coachContext");
const dashboardService = __importStar(require("../services/dashboard.service"));
const subscription_service_1 = require("../services/subscription.service");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, coachContext_1.resolveCoach);
router.get('/admin', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), tenant_1.requireTenant, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const data = await dashboardService.getAdminDashboard(academyId);
    (0, response_1.sendSuccess)(res, data);
}));
router.get('/coach', (0, auth_1.requireRoles)(client_1.UserRole.COACH), tenant_1.requireTenant, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId, coachId } = req;
    const data = await dashboardService.getCoachDashboard(academyId, coachId);
    (0, response_1.sendSuccess)(res, data);
}));
router.get('/super-admin', (0, auth_1.requireRoles)(client_1.UserRole.SUPER_ADMIN), (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await dashboardService.getSuperAdminDashboard();
    (0, response_1.sendSuccess)(res, data);
}));
router.get('/subscription', (0, auth_1.requireRoles)(client_1.UserRole.ACADEMY_ADMIN), tenant_1.requireTenant, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { academyId } = req;
    const status = await (0, subscription_service_1.getSubscriptionStatus)(academyId);
    (0, response_1.sendSuccess)(res, status);
}));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map