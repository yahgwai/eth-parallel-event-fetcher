import { RetryableProvider } from '../src/utils/retryable-provider';
import { ProviderError, RateLimitError } from '../src/errors';
import { ethers } from 'ethers';

// Mock ethers to prevent actual network calls
jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers');
  
  class MockJsonRpcProvider {
    connection: { url?: string };
    network: any;
    pollingInterval: number;
    send = jest.fn();
    perform = jest.fn();
    getNetwork = jest.fn();
    _ready = jest.fn().mockResolvedValue(true);
    
    constructor(url?: string, network?: any) {
      this.connection = { url };
      this.network = network || { name: 'mainnet', chainId: 1 };
      this.pollingInterval = 4000;
      this.getNetwork.mockResolvedValue(this.network);
    }
  }
  
  return {
    ...actualEthers,
    providers: {
      ...actualEthers.providers,
      JsonRpcProvider: MockJsonRpcProvider
    }
  };
});

describe('RetryableProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic retry functionality', () => {
    test('should return result on first successful attempt', async () => {
      const provider = new RetryableProvider();
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.send = jest.fn().mockResolvedValueOnce('success');
      
      const result = await provider.send('test', []);
      
      expect(result).toBe('success');
      expect(parentProto.send).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 2,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.send = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');
      
      const result = await provider.send('test', []);
      
      expect(result).toBe('success');
      expect(parentProto.send).toHaveBeenCalledTimes(3);
    });

    test('should throw ProviderError after exhausting retries', async () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 2,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.send = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(provider.send('test', []))
        .rejects
        .toThrow(ProviderError);
      
      expect(parentProto.send).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('rate limit handling', () => {
    test('should throw RateLimitError for rate limit errors', async () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 1,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.send = jest.fn().mockRejectedValue(new Error('429 Too Many Requests'));
      
      await expect(provider.send('test', []))
        .rejects
        .toThrow(RateLimitError);
        
      expect(parentProto.send).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    test('should identify various rate limit error messages', async () => {
      const rateLimitMessages = [
        '429 Too Many Requests',
        'Rate limit exceeded',
        'too many requests',
        'Request exceeded capacity',
        'Request throttled'
      ];
      
      for (const message of rateLimitMessages) {
        jest.clearAllMocks();
        
        const provider = new RetryableProvider(undefined, undefined, {
          maxRetries: 0
        });
        
        const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
        parentProto.send = jest.fn().mockRejectedValue(new Error(message));
        
        await expect(provider.send('test', []))
          .rejects
          .toThrow(RateLimitError);
      }
    });
  });

  describe('retry timing', () => {
    test('should use exponential backoff', async () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 2,
        initialRetryDelay: 100,
        retryJitter: false
      });
      
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.send = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      await provider.send('test', []);
      const endTime = Date.now();
      
      // Should have delayed: 100ms (first retry) + 200ms (second retry) = 300ms
      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(300);
      expect(elapsed).toBeLessThan(400);
    });

    test('should respect maxRetryDelay', async () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 3,
        initialRetryDelay: 500,
        maxRetryDelay: 600,
        retryJitter: false
      });
      
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.send = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))  
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      await provider.send('test', []);
      const endTime = Date.now();
      
      // Should have delayed: 500ms + 600ms (capped) + 600ms (capped) = 1700ms
      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(1700);
      expect(elapsed).toBeLessThan(1900);
    });

    test('should apply jitter when enabled', async () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 1,
        initialRetryDelay: 1000,
        retryJitter: true
      });
      
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.send = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      await provider.send('test', []);
      const endTime = Date.now();
      
      const elapsed = endTime - startTime;
      // With jitter (±10%), delay should be between 900ms and 1100ms
      expect(elapsed).toBeGreaterThanOrEqual(900);
      expect(elapsed).toBeLessThanOrEqual(1100);
    });
  });

  describe('perform method', () => {
    test('should retry perform operations', async () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 1,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.perform = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');
      
      const result = await provider.perform('test', {});
      
      expect(result).toBe('success');
      expect(parentProto.perform).toHaveBeenCalledTimes(2);
    });
  });

  describe('provider creation', () => {
    test('should create RetryableProvider from existing provider', () => {
      const mockProvider = {
        connection: { url: 'https://example.com' },
        network: { name: 'mainnet', chainId: 1 }
      } as ethers.providers.JsonRpcProvider;
      
      const retryable = RetryableProvider.fromProvider(mockProvider, {
        maxRetries: 5
      });
      
      expect(retryable).toBeInstanceOf(RetryableProvider);
      expect(retryable['maxRetries']).toBe(5);
    });

    test('should create new provider with cloneWithOptions', () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 3,
        initialRetryDelay: 100
      });
      
      const cloned = provider.cloneWithOptions({
        maxRetries: 5,
        initialRetryDelay: 200
      });
      
      expect(cloned).toBeInstanceOf(RetryableProvider);
      expect(cloned).not.toBe(provider);
      expect(cloned['maxRetries']).toBe(5);
      expect(cloned['initialRetryDelay']).toBe(200);
    });
  });

  describe('error handling', () => {
    test('should handle non-Error exceptions', async () => {
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 0,
        initialRetryDelay: 50
      });
      
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      parentProto.send = jest.fn().mockRejectedValue('string error');
      
      await expect(provider.send('test', []))
        .rejects
        .toThrow(ProviderError);
    });
  });

  describe('concurrent requests', () => {
    test('should handle concurrent requests independently', async () => {
      const provider = new RetryableProvider();
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(provider));
      
      parentProto.send = jest.fn().mockImplementation((method) => {
        return Promise.resolve(`result-${method}`);
      });
      
      const results = await Promise.all([
        provider.send('method1', []),
        provider.send('method2', []),
        provider.send('method3', [])
      ]);
      
      expect(results).toEqual(['result-method1', 'result-method2', 'result-method3']);
      expect(parentProto.send).toHaveBeenCalledTimes(3);
    });
  });
});