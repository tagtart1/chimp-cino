require("dotenv").config();

const Pool = require("pg").Pool;
const AppError = require("./utils/appError");
const fs = require("fs");
const path = require("path");

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const secret_name = "prod/chimps/postgres";

const client = new SecretsManagerClient({
  region: "us-east-1",
});

let response;

try {
  response = await client.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
      VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
    })
  );
} catch (error) {
  // For a list of exceptions thrown, see
  // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html

  throw new AppError("Server Error", 500, "SERVER_ERROR");
}

const secret = JSON.parse(response.SecretString);

const sslCert = fs.readFileSync(
  path.join("/home/ubuntu", "chimps-global-bundle.pem")
);

const pool = new Pool({
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

module.exports = pool;
