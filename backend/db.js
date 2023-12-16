const Pool = require("pg").Pool;
const AppError = require("./utils/appError");
const fs = require("fs");
const path = require("path");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const secret_name = "prod/chimps/postgres";
const client = new SecretsManagerClient({ region: "us-east-1" });
let pool;

async function initializePool() {
  let response;
  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT",
      })
    );

    const secret = JSON.parse(response.SecretString);
    const sslCert = fs.readFileSync(
      path.join("/home/ubuntu", "chimps-global-bundle.pem")
    );

    pool = new Pool({
      user: secret.username,
      host: secret.host,
      database: secret.dbname,
      password: secret.password,
      port: secret.port,
      ssl: {
        rejectUnauthorized: true,
        ca: sslCert,
      },
    });
  } catch (error) {
    console.log(error);
    throw new AppError("Server Error", 500, "SERVER_ERROR");
  }
}

function getPool() {
  if (!pool) {
    throw new Error("Database pool has not been initialized.");
  }
  return pool;
}

module.exports = { initializePool, getPool };
