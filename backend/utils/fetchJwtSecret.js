// secretManager.js
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({ region: "us-east-1" });

async function fetchJwtSecret() {
  const secret_name = "prod/chimps/jwt";
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
      })
    );
    return JSON.parse(response.SecretString).jwtkey;
  } catch (error) {
    console.error("Error fetching secret:", error);
    throw error;
  }
}

export default fetchJwtSecret;
