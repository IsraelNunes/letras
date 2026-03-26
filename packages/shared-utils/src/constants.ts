const maybeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;

export const API_BASE_URL = maybeProcess?.env?.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const STORAGE_KEYS = {
  LEARNER_PROFILE_ID: '@letras/learnerProfileId',
  LEARNER_DEVICE_ID: '@letras/learnerDeviceId',
  EDUCATOR_DEVICE_ID: '@letras/educatorDeviceId',
  EDUCATOR_AUTH_TOKEN: '@letras/educatorAuthToken',
  EDUCATOR_AUTH_EXPIRES_AT: '@letras/educatorAuthExpiresAt',
  EDUCATOR_AUTH_PROFILE: '@letras/educatorAuthProfile',
} as const;
