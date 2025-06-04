import { 
  DEFAULT_CONFIG, 
  ENV_VARS, 
  loadConfigFromEnv, 
  createConfig, 
  validateConfig 
} from '../src/config';

describe.skip('Configuration System', () => {
  // Store original env vars to restore after tests
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('DEFAULT_CONFIG', () => {
    test('should have all required configuration properties', () => {
      expect(DEFAULT_CONFIG).toEqual({
        concurrency: 4,
        chunkSize: 10000,
        maxRetries: 3,
        initialRetryDelay: 1000,
        rateLimitPerSecond: 10,
        showProgress: false,
        progressCallback: expect.any(Function),
        continueOnError: true,
        maxLogsPerChunk: 10000
      });
    });

    test('should have noop progressCallback by default', () => {
      expect(() => DEFAULT_CONFIG.progressCallback(1, 2, [3, 4])).not.toThrow();
    });
  });

  describe('loadConfigFromEnv', () => {
    test('should return empty config when no env vars set', () => {
      // Clear all relevant env vars
      Object.values(ENV_VARS).forEach(envVar => {
        delete process.env[envVar];
      });

      const config = loadConfigFromEnv();
      expect(config).toEqual({});
    });

    test('should parse numeric environment variables correctly', () => {
      process.env[ENV_VARS.CONCURRENCY] = '8';
      process.env[ENV_VARS.CHUNK_SIZE] = '5000';
      process.env[ENV_VARS.MAX_RETRIES] = '5';
      process.env[ENV_VARS.INITIAL_RETRY_DELAY] = '2000';
      process.env[ENV_VARS.RATE_LIMIT_PER_SECOND] = '15';
      process.env[ENV_VARS.MAX_LOGS_PER_CHUNK] = '8000';

      const config = loadConfigFromEnv();
      expect(config).toEqual({
        concurrency: 8,
        chunkSize: 5000,
        maxRetries: 5,
        initialRetryDelay: 2000,
        rateLimitPerSecond: 15,
        maxLogsPerChunk: 8000
      });
    });

    test('should parse boolean environment variables correctly', () => {
      process.env[ENV_VARS.SHOW_PROGRESS] = 'true';
      process.env[ENV_VARS.CONTINUE_ON_ERROR] = 'false';

      const config = loadConfigFromEnv();
      expect(config.showProgress).toBe(true);
      expect(config.continueOnError).toBe(false);
    });

    test('should handle boolean "1" as true', () => {
      process.env[ENV_VARS.SHOW_PROGRESS] = '1';
      process.env[ENV_VARS.CONTINUE_ON_ERROR] = '0';

      const config = loadConfigFromEnv();
      expect(config.showProgress).toBe(true);
      expect(config.continueOnError).toBe(false);
    });

    test('should ignore invalid numeric values', () => {
      process.env[ENV_VARS.CONCURRENCY] = 'invalid';
      process.env[ENV_VARS.CHUNK_SIZE] = 'NaN';
      process.env[ENV_VARS.MAX_RETRIES] = '-1';

      const config = loadConfigFromEnv();
      expect(config.concurrency).toBeUndefined();
      expect(config.chunkSize).toBeUndefined();
      expect(config.maxRetries).toBeUndefined();
    });

    test('should ignore values below minimum thresholds', () => {
      process.env[ENV_VARS.CONCURRENCY] = '0';
      process.env[ENV_VARS.CHUNK_SIZE] = '50';
      process.env[ENV_VARS.INITIAL_RETRY_DELAY] = '50';

      const config = loadConfigFromEnv();
      expect(config.concurrency).toBeUndefined();
      expect(config.chunkSize).toBeUndefined();
      expect(config.initialRetryDelay).toBeUndefined();
    });
  });

  describe('createConfig', () => {
    test('should return default config when no overrides provided', () => {
      // Clear env vars
      Object.values(ENV_VARS).forEach(envVar => {
        delete process.env[envVar];
      });

      const config = createConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    test('should merge environment variables with defaults', () => {
      process.env[ENV_VARS.CONCURRENCY] = '8';
      process.env[ENV_VARS.SHOW_PROGRESS] = 'true';

      const config = createConfig();
      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        concurrency: 8,
        showProgress: true
      });
    });

    test('should prioritize overrides over environment and defaults', () => {
      process.env[ENV_VARS.CONCURRENCY] = '8';
      process.env[ENV_VARS.CHUNK_SIZE] = '5000';

      const config = createConfig({
        concurrency: 12,
        maxRetries: 5
      });

      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        concurrency: 12, // Override wins
        chunkSize: 5000, // Env var used
        maxRetries: 5    // Override wins
      });
    });
  });

  describe('validateConfig', () => {
    test('should return valid for default config', () => {
      const result = validateConfig(DEFAULT_CONFIG);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate concurrency bounds', () => {
      let result = validateConfig({ concurrency: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('concurrency must be between 1 and 50');

      result = validateConfig({ concurrency: 51 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('concurrency must be between 1 and 50');

      result = validateConfig({ concurrency: 25 });
      expect(result.valid).toBe(true);
    });

    test('should validate chunkSize bounds', () => {
      let result = validateConfig({ chunkSize: 99 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('chunkSize must be between 100 and 100,000');

      result = validateConfig({ chunkSize: 100001 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('chunkSize must be between 100 and 100,000');

      result = validateConfig({ chunkSize: 5000 });
      expect(result.valid).toBe(true);
    });

    test('should validate maxRetries bounds', () => {
      let result = validateConfig({ maxRetries: -1 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxRetries must be between 0 and 10');

      result = validateConfig({ maxRetries: 11 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxRetries must be between 0 and 10');

      result = validateConfig({ maxRetries: 5 });
      expect(result.valid).toBe(true);
    });

    test('should validate initialRetryDelay bounds', () => {
      let result = validateConfig({ initialRetryDelay: 99 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('initialRetryDelay must be between 100ms and 30 seconds');

      result = validateConfig({ initialRetryDelay: 30001 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('initialRetryDelay must be between 100ms and 30 seconds');

      result = validateConfig({ initialRetryDelay: 1500 });
      expect(result.valid).toBe(true);
    });

    test('should validate rateLimitPerSecond bounds', () => {
      let result = validateConfig({ rateLimitPerSecond: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('rateLimitPerSecond must be between 1 and 1000');

      result = validateConfig({ rateLimitPerSecond: 1001 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('rateLimitPerSecond must be between 1 and 1000');

      result = validateConfig({ rateLimitPerSecond: 50 });
      expect(result.valid).toBe(true);
    });

    test('should validate maxLogsPerChunk bounds', () => {
      let result = validateConfig({ maxLogsPerChunk: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxLogsPerChunk must be between 1 and 1,000,000');

      result = validateConfig({ maxLogsPerChunk: 1000001 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxLogsPerChunk must be between 1 and 1,000,000');

      result = validateConfig({ maxLogsPerChunk: 5000 });
      expect(result.valid).toBe(true);
    });

    test('should collect multiple validation errors', () => {
      const result = validateConfig({
        concurrency: 0,
        chunkSize: 50,
        maxRetries: -1
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('concurrency must be between 1 and 50');
      expect(result.errors).toContain('chunkSize must be between 100 and 100,000');
      expect(result.errors).toContain('maxRetries must be between 0 and 10');
    });

    test('should ignore undefined values in validation', () => {
      const result = validateConfig({
        concurrency: undefined,
        chunkSize: undefined
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});