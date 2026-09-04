const path = require('path');

const DEFAULTS = {
  port: Number(process.env.EMBEDDED_PG_PORT) || 5432,
  databaseDir: process.env.EMBEDDED_PG_DIR || path.join(__dirname, '../.pgdata'),
  database: process.env.EMBEDDED_PG_DB || 'fintrack',
};

async function startEmbeddedPostgres(options = {}) {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const port = options.port || DEFAULTS.port;
  const databaseDir = options.databaseDir || DEFAULTS.databaseDir;
  const database = options.database || DEFAULTS.database;
  const persistent = options.persistent !== false;

  const pg = new EmbeddedPostgres({
    databaseDir,
    user: 'fintrack',
    password: 'fintrack',
    port,
    persistent,
  });

  await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase(database);
  } catch {
    // Database already exists on a reused data directory.
  }
  return pg;
}

async function main() {
  const pg = await startEmbeddedPostgres();
  console.log(`Embedded PostgreSQL listening on postgres://fintrack:fintrack@127.0.0.1:${DEFAULTS.port}/${DEFAULTS.database}`);
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { startEmbeddedPostgres };
