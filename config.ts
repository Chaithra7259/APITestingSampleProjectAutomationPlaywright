import 'dotenv/config';

/**
 * Get environment variable with a fallback default value.
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set. Please check your .env file.`);
  }
  return value || defaultValue || '';
}

/**
 * API-specific configuration.
 * Loads settings from environment variables with sensible defaults.
 */
export const config = {
  /**
   * API base URL for all requests
   */
  api: {
    baseUrl: getEnv('API_BASE_URL', 'https://conduit-api.bondaracademy.com/api'),
  },

  /**
   * Authentication credentials
   */
  auth: {
    email: getEnv('AUTH_EMAIL'),
    password: getEnv('AUTH_PASSWORD'),
  },
};
