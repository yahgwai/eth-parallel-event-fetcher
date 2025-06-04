import { RetryableProvider } from '../src/utils/retryable-provider';
import { ProviderError, RateLimitError } from '../src/errors';
import { ethers } from 'ethers';

describe('RetryableProvider', () => {
  let originalSend: any;
  let originalPerform: any;

  // Helper to create a mock that handles initialization calls
  const createMockSend = (testMethodBehavior: (callCount: number) => Promise<any>) => {
    const mockFn = jest.fn();
    mockFn.mockImplementation((method: string) => {
      // Handle initialization calls
      if (method === 'eth_chainId' || method === 'net_version') {
        return Promise.resolve('0x1');
      }
      
      // Handle test method with custom behavior
      if (method === 'test') {
        const callCount = mockFn.mock.calls.filter((call: any[]) => call[0] === 'test').length;
        return testMethodBehavior(callCount);
      }
      
      return Promise.resolve(null);
    });
    return mockFn;
  };

  // Helper to count test method calls
  const getTestCallCount = (mockFn: jest.Mock): number => {
    return mockFn.mock.calls.filter(call => call[0] === 'test').length;
  };

  beforeAll(() => {
    // Save original methods
    originalSend = ethers.providers.JsonRpcProvider.prototype.send;
    originalPerform = ethers.providers.JsonRpcProvider.prototype.perform;
  });

  afterAll(() => {
    // Restore original methods
    ethers.providers.JsonRpcProvider.prototype.send = originalSend;
    ethers.providers.JsonRpcProvider.prototype.perform = originalPerform;
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('basic retry functionality', () => {
    test('should return result on first successful attempt', async () => {
      const mockSend = createMockSend(() => Promise.resolve('success'));
      ethers.providers.JsonRpcProvider.prototype.send = mockSend;
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 2,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      const result = await provider.send('test', []);
      
      expect(result).toBe('success');
      expect(getTestCallCount(mockSend)).toBe(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const mockSend = createMockSend((callCount) => {
        if (callCount === 1) {
          return Promise.reject(new Error('Fail 1'));
        } else if (callCount === 2) {
          return Promise.reject(new Error('Fail 2'));
        } else {
          return Promise.resolve('success');
        }
      });
      
      ethers.providers.JsonRpcProvider.prototype.send = mockSend;
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 2,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      const result = await provider.send('test', []);
      
      expect(result).toBe('success');
      expect(getTestCallCount(mockSend)).toBe(3);
    });

    test('should throw ProviderError after exhausting retries', async () => {
      const mockSend = createMockSend(() => Promise.reject(new Error('Always fails')));
      ethers.providers.JsonRpcProvider.prototype.send = mockSend;
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 2,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      await expect(provider.send('test', []))
        .rejects
        .toThrow(ProviderError);
      
      expect(getTestCallCount(mockSend)).toBe(3); // Initial + 2 retries
    });
  });

  describe('rate limit handling', () => {
    test('should throw RateLimitError for rate limit errors', async () => {
      const mockSend = createMockSend(() => Promise.reject(new Error('429 Too Many Requests')));
      ethers.providers.JsonRpcProvider.prototype.send = mockSend;
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 1,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      await expect(provider.send('test', []))
        .rejects
        .toThrow(RateLimitError);
        
      expect(getTestCallCount(mockSend)).toBe(2); // Initial + 1 retry
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
        const mockSend = createMockSend(() => Promise.reject(new Error(message)));
        ethers.providers.JsonRpcProvider.prototype.send = mockSend;
        
        const provider = new RetryableProvider(undefined, undefined, {
          maxRetries: 0
        });
        
        await expect(provider.send('test', []))
          .rejects
          .toThrow(RateLimitError);
      }
    });
  });

  describe('retry timing', () => {
    test('should use exponential backoff', async () => {
      const mockSend = createMockSend((callCount) => {
        if (callCount === 1) {
          return Promise.reject(new Error('Fail 1'));
        } else if (callCount === 2) {
          return Promise.reject(new Error('Fail 2'));
        } else {
          return Promise.resolve('success');
        }
      });
      
      ethers.providers.JsonRpcProvider.prototype.send = mockSend;
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 2,
        initialRetryDelay: 100,
        retryJitter: false
      });
      
      const startTime = Date.now();
      await provider.send('test', []);
      const endTime = Date.now();
      
      // Should have delayed: 100ms (first retry) + 200ms (second retry) = 300ms
      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(300);
      expect(elapsed).toBeLessThan(400);
    });

    test('should respect maxRetryDelay', async () => {
      const mockSend = createMockSend((callCount) => {
        if (callCount <= 3) {
          return Promise.reject(new Error(`Fail ${callCount}`));
        } else {
          return Promise.resolve('success');
        }
      });
      
      ethers.providers.JsonRpcProvider.prototype.send = mockSend;
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 3,
        initialRetryDelay: 500,
        maxRetryDelay: 600,
        retryJitter: false
      });
      
      const startTime = Date.now();
      await provider.send('test', []);
      const endTime = Date.now();
      
      // Should have delayed: 500ms + 600ms (capped) + 600ms (capped) = 1700ms
      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(1700);
      expect(elapsed).toBeLessThan(1900);
    });

    test('should apply jitter when enabled', async () => {
      ethers.providers.JsonRpcProvider.prototype.send = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 1,
        initialRetryDelay: 1000,
        retryJitter: true
      });
      
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
      ethers.providers.JsonRpcProvider.prototype.perform = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 1,
        initialRetryDelay: 50,
        retryJitter: false
      });
      
      const result = await provider.perform('test', {});
      
      expect(result).toBe('success');
      expect(ethers.providers.JsonRpcProvider.prototype.perform).toHaveBeenCalledTimes(2);
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
      ethers.providers.JsonRpcProvider.prototype.send = jest.fn()
        .mockRejectedValue('string error');
      
      const provider = new RetryableProvider(undefined, undefined, {
        maxRetries: 0,
        initialRetryDelay: 50
      });
      
      await expect(provider.send('test', []))
        .rejects
        .toThrow(ProviderError);
    });
  });

  describe('concurrent requests', () => {
    test('should handle concurrent requests independently', async () => {
      ethers.providers.JsonRpcProvider.prototype.send = jest.fn()
        .mockImplementation((method) => {
          return Promise.resolve(`result-${method}`);
        });
      
      const provider = new RetryableProvider();
      
      const results = await Promise.all([
        provider.send('method1', []),
        provider.send('method2', []),
        provider.send('method3', [])
      ]);
      
      expect(results).toEqual(['result-method1', 'result-method2', 'result-method3']);
      expect(ethers.providers.JsonRpcProvider.prototype.send).toHaveBeenCalledTimes(3);
    });
  });
});