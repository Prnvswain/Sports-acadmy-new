"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachOnly = exports.resolveCoach = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma_1 = require("../lib/prisma");
const resolveCoach = async (req, _res, next) => {
    if (req.user?.role !== client_1.UserRole.COACH)
        return next();
    const coach = await prisma_1.prisma.coach.findFirst({
        where: { userId: req.user.userId, academyId: req.academyId },
        select: { id: true },
    });
    if (!coach)
        throw new errors_1.NotFoundError('Coach profile not found');
    req.coachId = coach.id;
    next();
};
exports.resolveCoach = resolveCoach;
const coachOnly = (req, _res, next) => {
    if (req.user?.role !== client_1.UserRole.COACH) {
        throw new errors_1.ForbiddenError('Coach access only');
    }
    next();
};
exports.coachOnly = coachOnly;
//# sourceMappingURL=coachContext.js.map