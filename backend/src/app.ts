import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import academyRoutes from './routes/academy.routes';
import sportRoutes from './routes/sport.routes';
import planRoutes from './routes/plan.routes';
import batchRoutes from './routes/batch.routes';
import coachRoutes from './routes/coach.routes';
import studentRoutes from './routes/student.routes';
import feeRoutes from './routes/fee.routes';
import attendanceRoutes from './routes/attendance.routes';
import performanceRoutes from './routes/performance.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import importRoutes from './routes/import.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SAMS API', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/academies', academyRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/import', importRoutes);

app.use(errorHandler);

export default app;
