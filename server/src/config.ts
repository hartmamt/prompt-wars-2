import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  geminiApiKey: string;
  falApiKey: string;
  discordClientId: string;
  discordClientSecret: string;
  corsOrigin: string;
}

function getEnvVar(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? '';
}

export const config: Config = {
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  geminiApiKey: getEnvVar('GEMINI_API_KEY'),
  falApiKey: getEnvVar('FAL_API_KEY'),
  discordClientId: getEnvVar('DISCORD_CLIENT_ID'),
  discordClientSecret: getEnvVar('DISCORD_CLIENT_SECRET'),
  corsOrigin: getEnvVar('CORS_ORIGIN', false) || '*',
};
