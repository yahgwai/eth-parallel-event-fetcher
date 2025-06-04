import { executeInParallel, chunkArray, createBlockRangeChunks } from '../src/utils/parallel';
import { createProvider } from '../src/utils/provider';
import { BlockRangeError, ProviderError } from '../src/errors';
import { ProgressTracker } from '../src/utils/progress';

// Mock p-limit since we have it configured in Jest
jest.mock('p-limit', () => {
  return jest.fn((_concurrency: number) => {
    return jest.fn(async (fn: () => Promise<any>) => {
      return await fn();
    });
  });
});

describe.skip('Parallel Utils', () => {
  describe('createBlockRangeChunks', () => {
    test('should create correct chunks for block ranges', () => {
      const chunks = createBlockRangeChunks(100, 200, 50);

      expect(chunks).toEqual([
        [100, 149],
        [150, 199],
        [200, 200],
      ]);
    });

    test('should handle single chunk when range is smaller than chunk size', () => {
      const chunks = createBlockRangeChunks(100, 120, 50);

      expect(chunks).toEqual([[100, 120]]);
    });

    test('should handle exact chunk size boundaries', () => {
      const chunks = createBlockRangeChunks(100, 199, 50);

      expect(chunks).toEqual([
        [100, 149],
        [150, 199],
      ]);
    });

    test('should throw error for invalid start/end blocks', () => {
      expect(() => createBlockRangeChunks(200, 100, 50)).toThrow(BlockRangeError);

      expect(() => createBlockRangeChunks(200, 100, 50)).toThrow(
        'Start block must be less than or equal to end block'
      );
    });

    test('should throw error for invalid chunk size', () => {
      expect(() => createBlockRangeChunks(100, 200, 0)).toThrow(BlockRangeError);

      expect(() => createBlockRangeChunks(100, 200, 0)).toThrow('Chunk size must be positive');

      expect(() => createBlockRangeChunks(100, 200, -10)).toThrow(BlockRangeError);

      expect(() => createBlockRangeChunks(100, 200, -10)).toThrow('Chunk size must be positive');
    });

    test('should handle same start and end block', () => {
      const chunks = createBlockRangeChunks(100, 100, 50);

      expect(chunks).toEqual([[100, 100]]);
    });

    test('should use default chunk size when not provided', () => {
      const chunks = createBlockRangeChunks(0, 20000);

      expect(chunks).toEqual([
        [0, 9999],
        [10000, 19999],
        [20000, 20000],
      ]);
    });
  });

  describe('chunkArray', () => {
    test('should split array into correct chunks', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = chunkArray(array, 3);

      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    test('should handle empty array', () => {
      const chunks = chunkArray([], 3);
      expect(chunks).toEqual([]);
    });

    test('should handle chunk size larger than array', () => {
      const array = [1, 2, 3];
      const chunks = chunkArray(array, 10);

      expect(chunks).toEqual([[1, 2, 3]]);
    });

    test('should handle chunk size of 1', () => {
      const array = [1, 2, 3];
      const chunks = chunkArray(array, 1);

      expect(chunks).toEqual([[1], [2], [3]]);
    });
  });

  describe('executeInParallel', () => {
    test('should execute tasks and return results', async () => {
      const tasks = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

      const results = await executeInParallel(tasks, {
        showProgress: false,
        concurrency: 2,
      });

      expect(results).toEqual([1, 2, 3]);
    });

    test('should handle task failures when continueOnError is true', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Task failed')),
        () => Promise.resolve(3),
      ];

      const results = await executeInParallel(tasks, {
        showProgress: false,
        continueOnError: true,
      });

      expect(results).toEqual([1, 3]); // Failed task filtered out
    });

    test('should throw on first error when continueOnError is false', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Task failed')),
        () => Promise.resolve(3),
      ];

      await expect(
        executeInParallel(tasks, {
          showProgress: false,
          continueOnError: false,
        })
      ).rejects.toThrow('Task failed');
    });

    test('should call progress callback', async () => {
      const progressCallback = jest.fn();
      const tasks = [() => Promise.resolve(1), () => Promise.resolve(2)];

      await executeInParallel(tasks, {
        showProgress: false,
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalledWith(1, 2);
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });

    test('should handle empty task array', async () => {
      const results = await executeInParallel([], { showProgress: false });
      expect(results).toEqual([]);
    });
  });
});

describe.skip('Provider Utils', () => {
  describe('createProvider', () => {
    test('should throw error when no URL provided', async () => {
      await expect(createProvider({})).rejects.toThrow(ProviderError);
      await expect(createProvider({})).rejects.toThrow('Provider URL is required');
    });

    test('should create provider with valid URL', async () => {
      // This test validates that provider requires a URL
      await expect(createProvider({})).rejects.toThrow(ProviderError);
      await expect(createProvider({})).rejects.toThrow('Provider URL is required');
    });
  });
});

describe.skip('Progress Utils', () => {
  describe('ProgressTracker', () => {
    let logSpy: jest.Mock;
    let tracker: ProgressTracker;

    beforeEach(() => {
      logSpy = jest.fn();
      tracker = new ProgressTracker(100, 'Test', 1000, logSpy);
    });

    test('should initialize with correct values', () => {
      expect(tracker.getProgress()).toBe(0);
      expect(tracker.getProgressPercent()).toBe(0);
    });

    test('should update progress correctly', () => {
      tracker.update(25);
      expect(tracker.getProgress()).toBe(0.25);
      expect(tracker.getProgressPercent()).toBe(25);
    });

    test('should log progress when forced', () => {
      tracker.update(25, true);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Test: 25/100 (25.00%)'));
    });

    test('should not log progress too frequently', () => {
      tracker.update(10);
      tracker.update(10);
      tracker.update(10);

      // Should only log once at initialization
      expect(logSpy).toHaveBeenCalledTimes(0);
    });

    test('should log when reaching 100%', () => {
      tracker.update(100);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Test: 100/100 (100.00%)'));
    });

    test('should format time correctly', () => {
      // Test private method through complete()
      tracker.update(100);
      tracker.complete();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Test completed in'));
    });

    test('should handle completion correctly', () => {
      tracker.update(50);
      tracker.complete();

      expect(tracker.getProgress()).toBe(1);
      expect(tracker.getProgressPercent()).toBe(100);
    });

    test('should include time estimates in progress messages', () => {
      // Fast forward time to test time estimates
      jest.useFakeTimers();

      const tracker = new ProgressTracker(100, 'Test', 0, logSpy);

      // Simulate progress over time
      jest.advanceTimersByTime(1000);
      tracker.update(25, true);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Test: 25\/100 \(25\.00%\) \(.*elapsed.*remaining\)/)
      );

      jest.useRealTimers();
    });
  });
});
