"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200) => {
    res.status(statusCode).json({ success: true, message, data });
};
exports.sendSuccess = sendSuccess;
const sendPaginated = (res, data, total, page, limit) => {
    res.json({
        success: true,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
};
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=response.js.map