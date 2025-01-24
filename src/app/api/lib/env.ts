import { config } from 'dotenv';

// Load environment variables from .env file
config();

const requiredEnvVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'GENIUS_ACCESS_TOKEN'
] as const;

type EnvVars = {
  [K in typeof requiredEnvVars[number]]: string;
};

function validateEnv(): EnvVars {
  const missingVars = requiredEnvVars.filter(
    (name) => !process.env[name]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  return requiredEnvVars.reduce((acc, name) => {
    acc[name] = process.env[name]!;
    return acc;
  }, {} as EnvVars);
}

export const env = validateEnv(); 