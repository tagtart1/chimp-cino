require("./utils/loadEnv");

const Pool = require("pg").Pool;
const connectionString = process.env.DATABASE_URL;
const isRenderExternalUrl = new URL(connectionString).hostname.endsWith(
  ".render.com"
);

const pool = new Pool({
  connectionString,
  ssl: isRenderExternalUrl ? { rejectUnauthorized: true } : undefined,
});

console.log("Total client:", pool.totalCount);

module.exports = pool;
