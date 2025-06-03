import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG, validateConfig } from '../src/config';

describe.skip('Error Handling - Simple Tests', () => {
  it('should validate configuration errors correctly', () => {
    expect(() => {
      new GenericEventFetcher({
        concurrency: -1
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      new GenericEventFetcher({
        chunkSize: 0
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      new GenericEventFetcher({
        maxRetries: -1
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      new GenericEventFetcher({
        initialRetryDelay: 50
      });
    }).toThrow('Invalid configuration');
  });

  it('should handle updateConfig validation errors', () => {
    const fetcher = new GenericEventFetcher(DEFAULT_CONFIG);
    
    expect(() => {
      fetcher.updateConfig({
        concurrency: 0
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      fetcher.updateConfig({
        chunkSize: -100
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      fetcher.updateConfig({
        initialRetryDelay: 50
      });
    }).toThrow('Invalid configuration');
  });

  it('should validate configurations correctly', () => {
    const validConfig = { concurrency: 4, chunkSize: 1000 };
    const invalidConfig1 = { concurrency: -1 };
    const invalidConfig2 = { chunkSize: 0 };
    const invalidConfig3 = { initialRetryDelay: 50 };

    expect(validateConfig(validConfig).valid).toBe(true);
    expect(validateConfig(invalidConfig1).valid).toBe(false);
    expect(validateConfig(invalidConfig2).valid).toBe(false);
    expect(validateConfig(invalidConfig3).valid).toBe(false);

    expect(validateConfig(invalidConfig1).errors).toContain('concurrency must be between 1 and 50');
    expect(validateConfig(invalidConfig2).errors).toContain('chunkSize must be between 100 and 100,000');
    expect(validateConfig(invalidConfig3).errors).toContain('initialRetryDelay must be between 100ms and 30 seconds');
  });
});