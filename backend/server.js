const { createApp, env } = require('./src/app');
const { pool } = require('./src/db/pool');
const { migrate } = require('./src/db/migrate');
const recurringService = require('./src/services/recurringService');

async function start() {
  await migrate();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`FinTrack server running on port ${env.port}`);
  });

  const tick = async () => {
    try {
      await recurringService.processAllDue();
    } catch (err) {
      console.error('Recurring processor error:', err.message);
    }
  };
  await tick();
  const timer = setInterval(tick, 60 * 60 * 1000);

  const shutdown = () => {
    console.log('Shutting down server...');
    clearInterval(timer);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
