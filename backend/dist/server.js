"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const prisma_1 = require("./lib/prisma");
const scheduler_service_1 = require("./services/scheduler.service");
const start = async () => {
    try {
        await prisma_1.prisma.$connect();
        console.log('Database connected');
        app_1.default.listen(config_1.config.port, () => {
            console.log(`SAMS API running on http://localhost:${config_1.config.port}`);
        });
        if (config_1.config.nodeEnv === 'production') {
            setInterval(() => (0, scheduler_service_1.runDailyJobs)().catch(console.error), 24 * 60 * 60 * 1000);
        }
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map