/**
 * Environment variable validation and type-safe access
 */

export const env = {
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT as string | undefined,
  DATA_DIR: process.env.DATA_DIR as string | undefined,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY as string | undefined,
} as const;

export type Env = typeof env;

/**
 * Validates required environment variables are present
 * @throws Error if any required variables are missing
 */
export function validateEnv(): void {
  const required = ['DEEPSEEK_API_KEY'];
  
  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Type-safe environment variable getter with optional default value
 */
export function getEnvVar<K extends keyof Env>(
  key: K,
  defaultValue?: string
): string {
  const value = env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set and no default provided`);
  }
  return value ?? defaultValue ?? '';
}

/**
 * Check if running in Railway production environment
 */
export function isRailway(): boolean {
  return env.RAILWAY_ENVIRONMENT === 'production';
}

/**
 * Get the data directory path, with proper fallback logic
 * Always returns /data in Railway, handles local development properly
 */
export function getDataDir(): string {
  if (isRailway()) {
    return '/data';
  }
  
  // For local development
  if (env.DATA_DIR) {
    return env.DATA_DIR;
  }
  
  // Default to data directory in project root for local dev
  return './data';
} 