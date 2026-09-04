const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { isAllowedOrigin } = require('./middleware/cors');
const { generalLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const entryRoutes = require('./routes/entries');
const analyticsRoutes = require('./routes/analytics');
const budgetRoutes = require('./routes/budgets');
const recurringRoutes = require('./routes/recurring');
const goalRoutes = require('./routes/goals');
const reportRoutes = require('./routes/reports');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.isProd) {
    app.set('trust proxy', 1);
  }
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'FinTrack API is running' });
  });

  app.use('/auth', authRoutes);
  app.use('/entries', entryRoutes);
  app.use('/analytics', analyticsRoutes);
  app.use('/budgets', budgetRoutes);
  app.use('/recurring', recurringRoutes);
  app.use('/goals', goalRoutes);
  app.use('/reports', reportRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp, env };
