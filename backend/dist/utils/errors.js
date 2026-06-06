"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitExceededError = exports.TenantViolationError = exports.ValidationError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(404, message, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    constructor(message) {
        super(400, message, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class TenantViolationError extends AppError {
    constructor(message = 'Cross-tenant access denied') {
        super(403, message, 'TENANT_VIOLATION');
    }
}
exports.TenantViolationError = TenantViolationError;
class LimitExceededError extends AppError {
    constructor(message) {
        super(403, message, 'LIMIT_EXCEEDED');
    }
}
exports.LimitExceededError = LimitExceededError;
//# sourceMappingURL=errors.js.map