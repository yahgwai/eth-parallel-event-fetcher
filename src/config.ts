import { FetcherConfig } from '../types/interfaces';

/**
 * Default configuration values for the event fetcher
 */
export const DEFAULT_CONFIG: Required<FetcherConfig> = {
  concurrency: 4,
  chunkSize: 10000,
  maxRetries: 3,
  initialRetryDelay: 1000,
  rateLimitPerSecond: 10,
  showProgress: false,
  progressCallback: () => {},
  continueOnError: true,
  maxLogsPerChunk: 10000,
};

/**
 * Environment variable names for configuration
 */
export const ENV_VARS = {
  CONCURRENCY: 'ETH_FETCHER_CONCURRENCY',
  CHUNK_SIZE: 'ETH_FETCHER_CHUNK_SIZE',
  MAX_RETRIES: 'ETH_FETCHER_MAX_RETRIES',
  INITIAL_RETRY_DELAY: 'ETH_FETCHER_INITIAL_RETRY_DELAY',
  RATE_LIMIT_PER_SECOND: 'ETH_FETCHER_RATE_LIMIT_PER_SECOND',
  SHOW_PROGRESS: 'ETH_FETCHER_SHOW_PROGRESS',
  CONTINUE_ON_ERROR: 'ETH_FETCHER_CONTINUE_ON_ERROR',
  MAX_LOGS_PER_CHUNK: 'ETH_FETCHER_MAX_LOGS_PER_CHUNK',
} as const;

/**
 * Loads configuration from environment variables
 */
export function loadConfigFromEnv(): Partial<FetcherConfig> {
  const config: Partial<FetcherConfig> = {};

  const parseNumber = (value: string | undefined, min = 1): number | undefined => {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) && parsed >= min ? parsed : undefined;
  };
  const parseBoolean = (value: string | undefined): boolean | undefined => {
    if (!value) return undefined;
    return value.toLowerCase() === 'true' || value === '1';
  };
  const concurrency = parseNumber(process.env[ENV_VARS.CONCURRENCY], 1);
  if (concurrency !== undefined) config.concurrency = concurrency;

  const chunkSize = parseNumber(process.env[ENV_VARS.CHUNK_SIZE], 100);
  if (chunkSize !== undefined) config.chunkSize = chunkSize;

  const maxRetries = parseNumber(process.env[ENV_VARS.MAX_RETRIES], 0);
  if (maxRetries !== undefined) config.maxRetries = maxRetries;

  const initialRetryDelay = parseNumber(process.env[ENV_VARS.INITIAL_RETRY_DELAY], 100);
  if (initialRetryDelay !== undefined) config.initialRetryDelay = initialRetryDelay;

  const rateLimitPerSecond = parseNumber(process.env[ENV_VARS.RATE_LIMIT_PER_SECOND], 1);
  if (rateLimitPerSecond !== undefined) config.rateLimitPerSecond = rateLimitPerSecond;

  const showProgress = parseBoolean(process.env[ENV_VARS.SHOW_PROGRESS]);
  if (showProgress !== undefined) config.showProgress = showProgress;

  const continueOnError = parseBoolean(process.env[ENV_VARS.CONTINUE_ON_ERROR]);
  if (continueOnError !== undefined) config.continueOnError = continueOnError;

  const maxLogsPerChunk = parseNumber(process.env[ENV_VARS.MAX_LOGS_PER_CHUNK], 1);
  if (maxLogsPerChunk !== undefined) config.maxLogsPerChunk = maxLogsPerChunk;

  return config;
}

/**
 * Creates a complete configuration by merging defaults, environment, and overrides
 */
export function createConfig(overrides: Partial<FetcherConfig> = {}): Required<FetcherConfig> {
  const envConfig = loadConfigFromEnv();

  return {
    ...DEFAULT_CONFIG,
    ...envConfig,
    ...overrides,
  };
}

/**
 * Validates configuration values
 */
export function validateConfig(config: FetcherConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.concurrency !== undefined && (config.concurrency < 1 || config.concurrency > 50)) {
    errors.push('concurrency must be between 1 and 50');
  }

  if (config.chunkSize !== undefined && (config.chunkSize < 100 || config.chunkSize > 100000)) {
    errors.push('chunkSize must be between 100 and 100,000');
  }

  if (config.maxRetries !== undefined && (config.maxRetries < 0 || config.maxRetries > 10)) {
    errors.push('maxRetries must be between 0 and 10');
  }

  if (
    config.initialRetryDelay !== undefined &&
    (config.initialRetryDelay < 100 || config.initialRetryDelay > 30000)
  ) {
    errors.push('initialRetryDelay must be between 100ms and 30 seconds');
  }

  if (
    config.rateLimitPerSecond !== undefined &&
    (config.rateLimitPerSecond < 1 || config.rateLimitPerSecond > 1000)
  ) {
    errors.push('rateLimitPerSecond must be between 1 and 1000');
  }

  if (
    config.maxLogsPerChunk !== undefined &&
    (config.maxLogsPerChunk < 1 || config.maxLogsPerChunk > 1000000)
  ) {
    errors.push('maxLogsPerChunk must be between 1 and 1,000,000');
  }

  return { valid: errors.length === 0, errors };
}
