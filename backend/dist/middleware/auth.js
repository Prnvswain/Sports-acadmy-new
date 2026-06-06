"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const prisma_1 = require("../lib/prisma");
const authenticate = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new errors_1.UnauthorizedError('Access token required');
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, isActive: true, role: true, academyId: true },
        });
        if (!user || !user.isActive) {
            throw new errors_1.UnauthorizedError('User account is inactive');
        }
        req.user = {
            userId: user.id,
            email: payload.email,
            role: user.role,
            academyId: user.academyId,
        };
        next();
    }
    catch {
        throw new errors_1.UnauthorizedError('Invalid or expired access token');
    }
};
exports.authenticate = authenticate;
const requireRoles = (...roles) => {
    return (req, _res, next) => {
        if (!req.user)
            throw new errors_1.UnauthorizedError();
        if (!roles.includes(req.user.role)) {
            throw new errors_1.ForbiddenError('Insufficient permissions');
        }
        next();
    };
};
exports.requireRoles = requireRoles;
const optionalAuth = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return next();
    try {
        const token = authHeader.split(' ')[1];
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
        req.user = payload;
    }
    catch {
        // ignore invalid token for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map