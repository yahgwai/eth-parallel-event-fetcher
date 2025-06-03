import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG } from '../src/config';
import { FetcherConfig } from '../types/interfaces';
import { ConfigurationError } from '../src/errors';

describe('GenericEventFetcher', () => {
  describe('constructor', () => {
    test('should initialize with default config when no config provided', () => {
      const fetcher = new GenericEventFetcher();
      const config = fetcher.getConfig();
      
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    test('should initialize with partial config overrides', () => {
      const overrides: Partial<FetcherConfig> = {
        concurrency: 8,
        showProgress: true,
        maxRetries: 5
      };
      
      const fetcher = new GenericEventFetcher(overrides);
      const config = fetcher.getConfig();
      
      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        ...overrides
      });
    });

    test('should initialize with environment variables', () => {
      // Set env vars
      process.env.ETH_FETCHER_CONCURRENCY = '12';
      process.env.ETH_FETCHER_CHUNK_SIZE = '5000';
      
      const fetcher = new GenericEventFetcher();
      const config = fetcher.getConfig();
      
      expect(config.concurrency).toBe(12);
      expect(config.chunkSize).toBe(5000);
      
      // Clean up
      delete process.env.ETH_FETCHER_CONCURRENCY;
      delete process.env.ETH_FETCHER_CHUNK_SIZE;
    });

    test('should prioritize constructor overrides over environment variables', () => {
      // Set env var
      process.env.ETH_FETCHER_CONCURRENCY = '8';
      
      const fetcher = new GenericEventFetcher({ concurrency: 12 });
      const config = fetcher.getConfig();
      
      expect(config.concurrency).toBe(12); // Override wins
      
      // Clean up
      delete process.env.ETH_FETCHER_CONCURRENCY;
    });

    test('should throw error for invalid configuration', () => {
      expect(() => {
        new GenericEventFetcher({ concurrency: 0 });
      }).toThrow(ConfigurationError);
      
      expect(() => {
        new GenericEventFetcher({ concurrency: 0 });
      }).toThrow('Configuration validation failed');
    });

    test('should throw error with multiple validation errors', () => {
      expect(() => {
        new GenericEventFetcher({ 
          concurrency: 0,
          chunkSize: 50,
          maxRetries: -1
        });
      }).toThrow(ConfigurationError);
      
      // Test that the error contains the expected validation messages
      try {
        new GenericEventFetcher({ 
          concurrency: 0,
          chunkSize: 50,
          maxRetries: -1
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        const configError = error as ConfigurationError;
        expect(configError.errors).toContain('concurrency must be between 1 and 50');
        expect(configError.errors).toContain('chunkSize must be between 100 and 100,000');
        expect(configError.errors).toContain('maxRetries must be between 0 and 10');
      }
    });

    test('should initialize with custom progressCallback', () => {
      const mockCallback = jest.fn();
      const fetcher = new GenericEventFetcher({ 
        progressCallback: mockCallback 
      });
      const config = fetcher.getConfig();
      
      expect(config.progressCallback).toBe(mockCallback);
    });
  });

  describe('getConfig', () => {
    test('should return a copy of the current configuration', () => {
      const fetcher = new GenericEventFetcher({ concurrency: 8 });
      const config1 = fetcher.getConfig();
      const config2 = fetcher.getConfig();
      
      // Should be equal but not the same reference
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    test('should return complete configuration with all required properties', () => {
      const fetcher = new GenericEventFetcher();
      const config = fetcher.getConfig();
      
      expect(config).toHaveProperty('concurrency');
      expect(config).toHaveProperty('chunkSize');
      expect(config).toHaveProperty('maxRetries');
      expect(config).toHaveProperty('initialRetryDelay');
      expect(config).toHaveProperty('rateLimitPerSecond');
      expect(config).toHaveProperty('showProgress');
      expect(config).toHaveProperty('progressCallback');
      expect(config).toHaveProperty('continueOnError');
      expect(config).toHaveProperty('maxLogsPerChunk');
    });

    test('should not allow external modification of returned config', () => {
      const fetcher = new GenericEventFetcher({ concurrency: 8 });
      const config = fetcher.getConfig();
      
      // Modify the returned config
      config.concurrency = 16;
      
      // Original config should be unchanged
      const originalConfig = fetcher.getConfig();
      expect(originalConfig.concurrency).toBe(8);
    });
  });

  describe('updateConfig', () => {
    test('should update configuration with valid values', () => {
      const fetcher = new GenericEventFetcher({ concurrency: 4 });
      
      fetcher.updateConfig({ 
        concurrency: 8,
        showProgress: true
      });
      
      const config = fetcher.getConfig();
      expect(config.concurrency).toBe(8);
      expect(config.showProgress).toBe(true);
      expect(config.chunkSize).toBe(DEFAULT_CONFIG.chunkSize); // Unchanged
    });

    test('should merge new config with existing config', () => {
      const fetcher = new GenericEventFetcher({ 
        concurrency: 4,
        chunkSize: 5000,
        showProgress: true
      });
      
      fetcher.updateConfig({ 
        concurrency: 8,
        maxRetries: 5
      });
      
      const config = fetcher.getConfig();
      expect(config.concurrency).toBe(8);      // Updated
      expect(config.maxRetries).toBe(5);       // Updated
      expect(config.chunkSize).toBe(5000);     // Preserved
      expect(config.showProgress).toBe(true);  // Preserved
    });

    test('should throw error for invalid configuration updates', () => {
      const fetcher = new GenericEventFetcher();
      
      expect(() => {
        fetcher.updateConfig({ concurrency: 0 });
      }).toThrow(ConfigurationError);
      
      expect(() => {
        fetcher.updateConfig({ concurrency: 0 });
      }).toThrow('Configuration validation failed');
    });

    test('should throw error with multiple validation errors on update', () => {
      const fetcher = new GenericEventFetcher();
      
      expect(() => {
        fetcher.updateConfig({ 
          concurrency: 0,
          maxRetries: -1
        });
      }).toThrow(ConfigurationError);
      
      // Test that the error contains the expected validation messages
      try {
        fetcher.updateConfig({ 
          concurrency: 0,
          maxRetries: -1
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        const configError = error as ConfigurationError;
        expect(configError.errors).toContain('concurrency must be between 1 and 50');
        expect(configError.errors).toContain('maxRetries must be between 0 and 10');
      }
    });

    test('should not modify config if validation fails', () => {
      const fetcher = new GenericEventFetcher({ concurrency: 8 });
      const originalConfig = fetcher.getConfig();
      
      expect(() => {
        fetcher.updateConfig({ concurrency: 0 });
      }).toThrow();
      
      // Config should remain unchanged
      const currentConfig = fetcher.getConfig();
      expect(currentConfig).toEqual(originalConfig);
    });

    test('should allow updating progressCallback function', () => {
      const fetcher = new GenericEventFetcher();
      const newCallback = jest.fn();
      
      fetcher.updateConfig({ progressCallback: newCallback });
      
      const config = fetcher.getConfig();
      expect(config.progressCallback).toBe(newCallback);
    });

    test('should validate updated config against current environment', () => {
      // Set env var
      process.env.ETH_FETCHER_CONCURRENCY = '6';
      
      const fetcher = new GenericEventFetcher();
      
      // Update should still work with env vars in place
      fetcher.updateConfig({ chunkSize: 8000 });
      
      const config = fetcher.getConfig();
      expect(config.chunkSize).toBe(8000);
      expect(config.concurrency).toBe(6); // From env var
      
      // Clean up
      delete process.env.ETH_FETCHER_CONCURRENCY;
    });

    test('should handle undefined values in partial update', () => {
      const fetcher = new GenericEventFetcher({ concurrency: 8 });
      
      fetcher.updateConfig({ 
        chunkSize: 5000
        // Not including concurrency to test partial updates
      });
      
      const config = fetcher.getConfig();
      expect(config.concurrency).toBe(8);     // Should preserve existing value when not specified
      expect(config.chunkSize).toBe(5000);    // Should update
    });
  });
});