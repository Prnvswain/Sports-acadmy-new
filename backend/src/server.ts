import app from './app';
import { config } from './config';
import { prisma } from './lib/prisma';
import { runDailyJobs } from './services/scheduler.service';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected');

    app.listen(config.port, () => {
      console.log(`SAMS API running on http://localhost:${config.port}`);
    });

    if (config.nodeEnv === 'production') {
      setInterval(() => runDailyJobs().catch(console.error), 24 * 60 * 60 * 1000);
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
