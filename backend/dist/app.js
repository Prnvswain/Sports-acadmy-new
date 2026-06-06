"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const academy_routes_1 = __importDefault(require("./routes/academy.routes"));
const sport_routes_1 = __importDefault(require("./routes/sport.routes"));
const plan_routes_1 = __importDefault(require("./routes/plan.routes"));
const batch_routes_1 = __importDefault(require("./routes/batch.routes"));
const coach_routes_1 = __importDefault(require("./routes/coach.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const fee_routes_1 = __importDefault(require("./routes/fee.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const performance_routes_1 = __importDefault(require("./routes/performance.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: config_1.config.frontendUrl, credentials: true }));
app.use((0, morgan_1.default)(config_1.config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'SAMS API', version: '1.0.0' });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/academies', academy_routes_1.default);
app.use('/api/sports', sport_routes_1.default);
app.use('/api/plans', plan_routes_1.default);
app.use('/api/batches', batch_routes_1.default);
app.use('/api/coaches', coach_routes_1.default);
app.use('/api/students', student_routes_1.default);
app.use('/api/fees', fee_routes_1.default);
app.use('/api/attendance', attendance_routes_1.default);
app.use('/api/performance', performance_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/import', import_routes_1.default);
app.use('/api/audit-logs', audit_routes_1.default);
app.use('/api/subscription', subscription_routes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map