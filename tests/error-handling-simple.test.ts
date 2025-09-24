import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG, validateConfig } from '../src/config';
import { LogFilter } from '../types';
import { ethers } from 'ethers';

describe('Error Handling - Simple Tests', () => {
  let mockProvider: ethers.providers.Provider;

  beforeEach(() => {
    mockProvider = {
      getLogs: jest.fn(),
      getBlockNumber: jest.fn(),
    } as unknown as ethers.providers.Provider;
  });
  it('should validate configuration errors correctly', () => {
    expect(() => {
      new GenericEventFetcher(mockProvider, {
        concurrency: -1,
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      new GenericEventFetcher(mockProvider, {
        chunkSize: 0,
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      new GenericEventFetcher(mockProvider, {
        maxRetries: -1,
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      new GenericEventFetcher(mockProvider, {
        initialRetryDelay: 50,
      });
    }).toThrow('Invalid configuration');
  });

  it('should handle updateConfig validation errors', () => {
    const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);

    expect(() => {
      fetcher.updateConfig({
        concurrency: 0,
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      fetcher.updateConfig({
        chunkSize: -100,
      });
    }).toThrow('Invalid configuration');

    expect(() => {
      fetcher.updateConfig({
        initialRetryDelay: 50,
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
    expect(validateConfig(invalidConfig2).errors).toContain(
      'chunkSize must be between 100 and 100,000'
    );
    expect(validateConfig(invalidConfig3).errors).toContain(
      'initialRetryDelay must be between 100ms and 30 seconds'
    );
  });

  describe('fetchLogs error handling', () => {
    it('should throw when fromBlock > toBlock', async () => {
      const mockProvider = {
        getLogs: jest.fn(),
        getBlockNumber: jest.fn(),
      } as any;

      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      const filter: LogFilter = {
        fromBlock: 2000,
        toBlock: 1000,
      };

      await expect(fetcher.fetchLogs(filter)).rejects.toThrow(
        'fromBlock cannot be greater than toBlock'
      );
    });

    it('should throw error for invalid block tags', async () => {
      const mockProvider = {
        getLogs: jest.fn(),
        getBlockNumber: jest.fn(),
      } as any;

      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 'pending',
      };

      await expect(fetcher.fetchLogs(filter)).rejects.toThrow('Pending block tag is not supported');
    });

    it('should handle invalid block tag strings', async () => {
      const mockProvider = {
        getLogs: jest.fn(),
        getBlockNumber: jest.fn(),
      } as any;

      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 'invalid-tag' as any,
      };

      await expect(fetcher.fetchLogs(filter)).rejects.toThrow('Invalid block tag');
    });
  });
});
