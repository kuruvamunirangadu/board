export interface AppEnvironmentConfig {
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
  port: number;
  host: string;
  appUrl: string;
  maxUploadSizeMB: number;
  collabSyncIntervalMs: number;
  isProduction: boolean;
  hasAiApiKey: boolean;
}

export function validateEnvironment(): AppEnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as AppEnvironmentConfig['nodeEnv'];
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOSTNAME || '0.0.0.0';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const maxUploadSizeMB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10);
  const collabSyncIntervalMs = parseInt(process.env.COLLAB_SYNC_INTERVAL_MS || '1200', 10);
  const hasAiApiKey = Boolean(process.env.AI_PROVIDER_API_KEY && process.env.AI_PROVIDER_API_KEY.length > 5);

  return {
    nodeEnv,
    port,
    host,
    appUrl,
    maxUploadSizeMB,
    collabSyncIntervalMs,
    isProduction: nodeEnv === 'production',
    hasAiApiKey,
  };
}

export const envConfig = validateEnvironment();

