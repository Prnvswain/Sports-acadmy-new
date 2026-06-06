"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.login = login;
exports.refreshAccessToken = refreshAccessToken;
exports.logout = logout;
exports.changePassword = changePassword;
exports.generateReceiptNumber = generateReceiptNumber;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
const SALT_ROUNDS = 12;
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.accessSecret, {
        expiresIn: config_1.config.jwt.accessExpires,
    });
}
function signRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, config_1.config.jwt.refreshSecret, {
        expiresIn: config_1.config.jwt.refreshExpires,
    });
}
async function login(email, password) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
            academy: { select: { id: true, name: true, status: true, subscriptionPlan: true } },
            coach: { select: { id: true } },
        },
    });
    if (!user || !user.isActive) {
        throw new errors_1.UnauthorizedError('Invalid credentials');
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid)
        throw new errors_1.UnauthorizedError('Invalid credentials');
    if (user.role !== client_1.UserRole.SUPER_ADMIN && user.academy?.status !== 'ACTIVE') {
        throw new errors_1.UnauthorizedError('Academy is inactive');
    }
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        academyId: user.academyId,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma_1.prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt },
    });
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    const { passwordHash: _, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
}
async function refreshAccessToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
        const stored = await prisma_1.prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
        const payload = {
            userId: stored.user.id,
            email: stored.user.email,
            role: stored.user.role,
            academyId: stored.user.academyId,
        };
        return { accessToken: signAccessToken(payload) };
    }
    catch {
        throw new errors_1.UnauthorizedError('Invalid refresh token');
    }
}
async function logout(token) {
    await prisma_1.prisma.refreshToken.deleteMany({ where: { token } });
}
async function changePassword(userId, currentPassword, newPassword) {
    const user = await prisma_1.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid)
        throw new errors_1.ValidationError('Current password is incorrect');
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(newPassword) },
    });
}
function generateReceiptNumber(prefix) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = (0, uuid_1.v4)().slice(0, 8).toUpperCase();
    return `${prefix}-${date}-${random}`;
}
//# sourceMappingURL=auth.service.js.map