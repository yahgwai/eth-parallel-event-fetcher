import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG } from '../src/config';
import { ethers } from 'ethers';
import { LogFilter, FetchLogsOptions } from '../types';

describe('GenericEventFetcher - fetchLogs', () => {
  let mockProvider: ethers.providers.Provider;
  let mockGetLogs: jest.Mock;
  let mockGetBlockNumber: jest.Mock;

  beforeEach(() => {
    mockGetLogs = jest.fn();
    mockGetBlockNumber = jest.fn();
    mockProvider = {
      getLogs: mockGetLogs,
      getBlockNumber: mockGetBlockNumber,
    } as any as ethers.providers.Provider;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor with provider', () => {
    test('should accept provider in constructor', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 1100,
      };

      const logs = await fetcher.fetchLogs(filter);
      expect(logs).toEqual([]);
      expect(mockGetLogs).toHaveBeenCalled();
    });
  });

  describe('basic fetching', () => {
    test('should fetch logs with basic filter', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      const expectedLogs = [
        {
          blockNumber: 1001,
          blockHash: '0xabc',
          transactionIndex: 0,
          removed: false,
          address: '0x123',
          data: '0x',
          topics: ['0xtopic1'],
          transactionHash: '0xtx1',
          logIndex: 0,
        },
      ];
      mockGetLogs.mockResolvedValue(expectedLogs);

      const filter: LogFilter = {
        address: '0x123',
        fromBlock: 1000,
        toBlock: 1100,
      };

      const logs = await fetcher.fetchLogs(filter);
      expect(logs).toEqual(expectedLogs);
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '0x123',
          fromBlock: 1000,
          toBlock: 1100,
        })
      );
    });

    test('should fetch logs with topics filter', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        address: '0x123',
        topics: ['0xtopic1', null, '0xtopic3'],
        fromBlock: 1000,
        toBlock: 1100,
      };

      await fetcher.fetchLogs(filter);
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '0x123',
          topics: ['0xtopic1', null, '0xtopic3'],
          fromBlock: 1000,
          toBlock: 1100,
        })
      );
    });

    test('should handle empty results gracefully', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 1100,
      };

      const logs = await fetcher.fetchLogs(filter);
      expect(logs).toEqual([]);
      expect(logs.length).toBe(0);
    });
  });

  describe('block tag resolution', () => {
    test('should resolve latest to current block number', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetBlockNumber.mockResolvedValue(15000000);
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        fromBlock: 14999900,
        toBlock: 'latest',
      };

      await fetcher.fetchLogs(filter);
      expect(mockGetBlockNumber).toHaveBeenCalled();
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          fromBlock: 14999900,
          toBlock: 15000000,
        })
      );
    });

    test('should resolve earliest to 0', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        fromBlock: 'earliest',
        toBlock: 100,
      };

      await fetcher.fetchLogs(filter);
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          fromBlock: 0,
          toBlock: 100,
        })
      );
    });

    test('should handle numeric block tags', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 2000,
      };

      await fetcher.fetchLogs(filter);
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          fromBlock: 1000,
          toBlock: 2000,
        })
      );
    });

    test('should throw error for pending tag', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 'pending',
      };

      await expect(fetcher.fetchLogs(filter)).rejects.toThrow('Pending block tag is not supported');
    });

    test('should handle string numbers', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        fromBlock: '1000',
        toBlock: '2000',
      };

      await fetcher.fetchLogs(filter);
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          fromBlock: 1000,
          toBlock: 2000,
        })
      );
    });
  });

  describe('options handling', () => {
    test('should respect custom chunk size', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 2999,
      };

      const options: FetchLogsOptions = {
        chunkSize: 500,
      };

      await fetcher.fetchLogs(filter, options);
      expect(mockGetLogs).toHaveBeenCalledTimes(4);
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({ fromBlock: 1000, toBlock: 1499 })
      );
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({ fromBlock: 1500, toBlock: 1999 })
      );
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({ fromBlock: 2000, toBlock: 2499 })
      );
      expect(mockGetLogs).toHaveBeenCalledWith(
        expect.objectContaining({ fromBlock: 2500, toBlock: 2999 })
      );
    });

    test('should call progress callback during fetching', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, { ...DEFAULT_CONFIG, chunkSize: 500 });
      mockGetLogs.mockResolvedValue([]);
      const onProgress = jest.fn();

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 2000,
      };

      const options: FetchLogsOptions = {
        onProgress,
      };

      await fetcher.fetchLogs(filter, options);
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Array)
      );
    });

    test('should merge options with default config', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, { ...DEFAULT_CONFIG, chunkSize: 1000 });
      mockGetLogs.mockResolvedValue([]);

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 2999,
      };

      const options: FetchLogsOptions = {};

      await fetcher.fetchLogs(filter, options);
      expect(mockGetLogs).toHaveBeenCalledTimes(2);
    });

    test('should handle continueOnError option', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, { ...DEFAULT_CONFIG, chunkSize: 500 });

      mockGetLogs
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([]);

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 1500,
      };

      const options: FetchLogsOptions = {
        continueOnError: true,
        maxRetries: 0,
      };

      const logs = await fetcher.fetchLogs(filter, options);
      expect(logs).toEqual([]);
    });
  });

  describe('error handling', () => {
    test('should throw when fromBlock > toBlock', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);

      const filter: LogFilter = {
        fromBlock: 2000,
        toBlock: 1000,
      };

      await expect(fetcher.fetchLogs(filter)).rejects.toThrow(
        'fromBlock cannot be greater than toBlock'
      );
    });

    test('should handle provider errors', async () => {
      const fetcher = new GenericEventFetcher(mockProvider, DEFAULT_CONFIG);
      mockGetLogs.mockRejectedValue(new Error('Provider error'));

      const filter: LogFilter = {
        fromBlock: 1000,
        toBlock: 1100,
      };

      const options: FetchLogsOptions = {
        maxRetries: 0,
        continueOnError: false,
      };

      await expect(fetcher.fetchLogs(filter, options)).rejects.toThrow();
    });
  });
});
