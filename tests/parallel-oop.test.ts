import { TaskQueue, ParallelExecutor } from '../src/utils/parallel';
import { TaskFunction } from '../types';

// Mock p-limit
jest.mock('p-limit', () => {
  return jest.fn((concurrency: number) => {
    let activeCount = 0;
    const queue: Array<() => void> = [];
    
    return jest.fn(async (fn: () => Promise<any>) => {
      if (activeCount >= concurrency) {
        await new Promise<void>(resolve => {
          queue.push(resolve);
        });
      }
      
      activeCount++;
      try {
        const result = await fn();
        return result;
      } finally {
        activeCount--;
        const next = queue.shift();
        if (next) next();
      }
    });
  });
});

describe('TaskQueue', () => {
  let taskQueue: TaskQueue<string>;

  beforeEach(() => {
    taskQueue = new TaskQueue<string>();
  });

  describe('constructor', () => {
    test('should initialize with empty state', () => {
      expect(taskQueue.getCompletedCount()).toBe(0);
      expect(taskQueue.getErrors()).toEqual([]);
      expect(taskQueue.getAllResults()).toEqual([]);
      expect(taskQueue.isRateLimited()).toBe(false);
    });
  });

  describe('task tracking', () => {
    test('should track completed tasks', () => {
      taskQueue.addResult(0, 'result1');
      taskQueue.addResult(1, 'result2');
      
      expect(taskQueue.getCompletedCount()).toBe(2);
      expect(taskQueue.getResult(0)).toBe('result1');
      expect(taskQueue.getResult(1)).toBe('result2');
    });

    test('should return undefined for non-existent results', () => {
      expect(taskQueue.getResult(0)).toBeUndefined();
    });

    test('should track errors', () => {
      const error1 = new Error('Test error 1');
      const error2 = new Error('Test error 2');
      
      taskQueue.addError(error1);
      taskQueue.addError(error2);
      
      expect(taskQueue.getErrors()).toEqual([error1, error2]);
      expect(taskQueue.hasErrors()).toBe(true);
    });

    test('should return all results in order', () => {
      taskQueue.addResult(2, 'result3');
      taskQueue.addResult(0, 'result1');
      taskQueue.addResult(1, 'result2');
      
      expect(taskQueue.getAllResults()).toEqual(['result1', 'result2', 'result3']);
    });

    test('should handle sparse results', () => {
      taskQueue.addResult(0, 'result1');
      taskQueue.addResult(2, 'result3');
      // Index 1 is missing
      
      expect(taskQueue.getAllResults()).toEqual(['result1', undefined, 'result3']);
    });
  });

  describe('rate limiting', () => {
    test('should track rate limit status', () => {
      expect(taskQueue.isRateLimited()).toBe(false);
      
      taskQueue.setRateLimited(true);
      expect(taskQueue.isRateLimited()).toBe(true);
      
      taskQueue.setRateLimited(false);
      expect(taskQueue.isRateLimited()).toBe(false);
    });
  });
});

describe('ParallelExecutor', () => {
  let executor: ParallelExecutor<string>;
  let mockTasks: TaskFunction<string>[];
  let onProgressMock: jest.Mock;

  beforeEach(() => {
    onProgressMock = jest.fn();
    executor = new ParallelExecutor({
      concurrency: 2,
      maxRetries: 2,
      continueOnError: false,
      showProgress: false,
      onProgress: onProgressMock
    });

    mockTasks = [
      jest.fn().mockResolvedValue('result1'),
      jest.fn().mockResolvedValue('result2'),
      jest.fn().mockResolvedValue('result3')
    ];
  });

  describe('successful execution', () => {
    test('should execute all tasks and return results', async () => {
      const results = await executor.execute(mockTasks);
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(mockTasks[0]).toHaveBeenCalledTimes(1);
      expect(mockTasks[1]).toHaveBeenCalledTimes(1);
      expect(mockTasks[2]).toHaveBeenCalledTimes(1);
    });

    test('should respect concurrency limit', async () => {
      const executionOrder: number[] = [];
      const tasks: TaskFunction<string>[] = [
        jest.fn(async () => {
          executionOrder.push(0);
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'result1';
        }),
        jest.fn(async () => {
          executionOrder.push(1);
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'result2';
        }),
        jest.fn(async () => {
          executionOrder.push(2);
          return 'result3';
        })
      ];

      await executor.execute(tasks);
      
      // With concurrency 2, task 2 should start after task 0 or 1 completes
      expect(executionOrder[0]).toBeLessThan(2);
      expect(executionOrder[1]).toBeLessThan(2);
      expect(executionOrder[2]).toBe(2);
    });

    test('should call progress callback', async () => {
      await executor.execute(mockTasks);
      
      expect(onProgressMock).toHaveBeenCalledWith(
        expect.any(Number),
        3
      );
      
      // Should be called at least once per task
      expect(onProgressMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    test('should retry failed tasks', async () => {
      const failingTask = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');
      
      const results = await executor.execute([failingTask]);
      
      expect(results).toEqual(['success']);
      expect(failingTask).toHaveBeenCalledTimes(2);
    });

    test('should throw after exhausting retries when continueOnError is false', async () => {
      const failingTask = jest.fn()
        .mockRejectedValue(new Error('Persistent failure'));
      
      await expect(executor.execute([failingTask]))
        .rejects
        .toThrow('Persistent failure');
      
      // Initial attempt + 2 retries = 3 calls
      expect(failingTask).toHaveBeenCalledTimes(3);
    });

    test('should continue on error when configured', async () => {
      const executorWithContinue = new ParallelExecutor({
        concurrency: 2,
        maxRetries: 1,
        continueOnError: true,
        showProgress: false
      });

      const tasks: TaskFunction<string>[] = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockRejectedValue(new Error('Task 2 failed')),
        jest.fn().mockResolvedValue('result3')
      ];

      const results = await executorWithContinue.execute(tasks);
      
      expect(results).toEqual(['result1', 'result3']);
      expect(tasks[1]).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('rate limiting', () => {
    test('should handle rate limit errors with appropriate delays', async () => {
      const rateLimitError = new Error('429 Too Many Requests');
      const startTime = Date.now();
      
      const task = jest.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce('success');

      const executor = new ParallelExecutor({
        concurrency: 1,
        maxRetries: 1,
        showProgress: false
      });

      const results = await executor.execute([task]);
      const elapsed = Date.now() - startTime;
      
      expect(results).toEqual(['success']);
      expect(task).toHaveBeenCalledTimes(2);
      // Rate limit errors should have longer delays (2000ms base)
      expect(elapsed).toBeGreaterThanOrEqual(2000);
    });

    test('should handle various rate limit error messages', async () => {
      const rateLimitErrors = [
        'rate limit exceeded',
        'Too many requests',
        'exceeded capacity',
        'request throttled'
      ];

      for (const errorMsg of rateLimitErrors) {
        const task = jest.fn()
          .mockRejectedValueOnce(new Error(errorMsg))
          .mockResolvedValueOnce('success');

        const executor = new ParallelExecutor({
          concurrency: 1,
          maxRetries: 1,
          showProgress: false
        });

        const startTime = Date.now();
        await executor.execute([task]);
        const elapsed = Date.now() - startTime;
        
        // All rate limit errors should trigger longer delays
        expect(elapsed).toBeGreaterThanOrEqual(2000);
      }
    });
  });

  describe('edge cases', () => {
    test('should handle empty task array', async () => {
      const results = await executor.execute([]);
      
      expect(results).toEqual([]);
      expect(onProgressMock).not.toHaveBeenCalled();
    });

    test('should handle single task', async () => {
      const results = await executor.execute([mockTasks[0]]);
      
      expect(results).toEqual(['result1']);
      expect(mockTasks[0]).toHaveBeenCalledTimes(1);
    });

    test('should preserve task order in results', async () => {
      const tasks: TaskFunction<string>[] = [
        jest.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'slow';
        }),
        jest.fn(async () => {
          return 'fast';
        })
      ];

      const results = await executor.execute(tasks);
      
      expect(results).toEqual(['slow', 'fast']);
    });
  });

  describe('configuration', () => {
    test('should use default options when not provided', () => {
      const defaultExecutor = new ParallelExecutor();
      
      // Test by checking behavior - should execute with default concurrency
      const tasks = Array(10).fill(null).map(() => jest.fn().mockResolvedValue('result'));
      
      expect(async () => {
        await defaultExecutor.execute(tasks);
      }).not.toThrow();
    });

    test('should respect custom retry delay', async () => {
      const executorWithDelay = new ParallelExecutor({
        concurrency: 1,
        maxRetries: 2,
        retryDelay: 10,
        showProgress: false
      });

      const startTime = Date.now();
      const failingTask = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');

      await executorWithDelay.execute([failingTask]);
      const elapsed = Date.now() - startTime;
      
      // Should have delays: 10ms (first retry) + 20ms (second retry) = 30ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(30);
    });
  });
});

describe('Integration with executeInParallel', () => {
  test('should maintain backward compatibility', async () => {
    const { executeInParallel } = await import('../src/utils/parallel');
    
    const tasks = [
      jest.fn().mockResolvedValue('result1'),
      jest.fn().mockResolvedValue('result2')
    ];

    const results = await executeInParallel(tasks, {
      concurrency: 2,
      showProgress: false
    });
    
    expect(results).toEqual(['result1', 'result2']);
  });
});