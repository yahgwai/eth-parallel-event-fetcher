import { ethers } from 'ethers';
import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG } from '../src/config';
import { ContractInterface, EventProcessor, RawEvent } from '../types';
import { testProvider } from './setup';

interface TestEvent extends RawEvent {
  address: string;
  topics: string[];
  data: string;
  args: any;
}

describe('Integration - Parallel Processing', () => {
  let fetcher: GenericEventFetcher<TestEvent, any>;
  let usdcContract: ContractInterface;

  beforeAll(async () => {
    const config = {
      ...DEFAULT_CONFIG,
      maxLogsPerChunk: 500,
      chunkSize: 2000,
      concurrency: 3,
      showProgress: true
    };

    fetcher = new GenericEventFetcher(config);
    
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    
    usdcContract = {
      address: usdcAddress,
      filters: {
        Transfer: () => ({
          topics: [transferEventTopic]
        } as ethers.EventFilter)
      },
      queryFilter: async (filter: ethers.EventFilter, fromBlock?: number, toBlock?: number) => {
        const logs = await testProvider.getLogs({
          ...filter,
          fromBlock,
          toBlock
        });
        return logs.map(log => ({
          ...log,
          args: {} 
        })) as ethers.Event[];
      }
    };
  });

  afterAll(async () => {
    // No need to clean up provider - using shared testProvider from setup.ts
  });

  it('should fetch events using multiple parallel chunks', async () => {
    const progressUpdates: Array<{completed: number, total: number}> = [];
    
    const trackingProcessor: EventProcessor<TestEvent, TestEvent & {chunkInfo?: string}> = (events, contractAddress) => {
      return events.map(event => ({
        ...event,
        chunkInfo: `Processed from ${contractAddress}`
      }));
    };

    const events = await fetcher.fetchEvents(
      usdcContract,
      'Transfer',
      trackingProcessor,
      {
        contractAddress: usdcContract.address,
        fromBlock: 18500000,
        toBlock: 18506000,
        onProgress: (completed, total, chunk) => {
          progressUpdates.push({ completed, total });
        }
      }
    );

    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);

    expect(progressUpdates.length).toBeGreaterThan(1);
    expect(progressUpdates[progressUpdates.length - 1].completed).toBe(progressUpdates[progressUpdates.length - 1].total);

    const firstEvent = events[0];
    expect(firstEvent).toHaveProperty('address');
    expect(firstEvent).toHaveProperty('blockNumber');
    expect(firstEvent).toHaveProperty('transactionHash');
    expect(firstEvent).toHaveProperty('chunkInfo');
    expect(firstEvent.address.toLowerCase()).toBe(usdcContract.address.toLowerCase());
  }, 45000);

  // This test is mentioned in BUGFIXES.md as demonstrating the ordering issue
  it('should maintain event order across chunks', async () => {
    // Use a custom fetcher with smaller chunks to ensure multiple chunks are used
    const customFetcher = new GenericEventFetcher<TestEvent, TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 100,    // 10k blocks / 100 = 100 chunks (many chunks to test ordering across chunks)
      concurrency: 10,   // High concurrency to increase chance of out-of-order completion
      showProgress: true // Show progress to see chunk processing
    });

    // Track which chunks complete in what order
    const chunkCompletionOrder: number[] = [];
    
    const trackingProcessor: EventProcessor<TestEvent, TestEvent & { chunkStart: number }> = (events, contractAddress) => {
      if (events.length > 0) {
        const firstBlockInChunk = Math.min(...events.map(e => e.blockNumber));
        chunkCompletionOrder.push(firstBlockInChunk);
      }
      return events.map(event => ({
        ...event,
        chunkStart: events.length > 0 ? Math.min(...events.map(e => e.blockNumber)) : 0
      }));
    };

    const events = await customFetcher.fetchEvents(
      usdcContract,
      'Transfer',
      trackingProcessor,
      {
        contractAddress: usdcContract.address,
        fromBlock: 18000000,  // Known range with many events (59k+)
        toBlock: 18009999     // 10k blocks with 500 block chunks = 20 chunks
      }
    );

    console.log(`Total events found: ${events.length}`);
    console.log(`Number of chunks processed: ${chunkCompletionOrder.length}`);
    console.log(`Chunk completion order (by first block): ${chunkCompletionOrder.join(', ')}`);

    // If we have many events, check ordering regardless of chunk count
    if (events.length > 100) {
      // Check if chunks completed out of order (which is expected with parallel processing)
      const sortedChunkOrder = [...chunkCompletionOrder].sort((a, b) => a - b);
      const chunksCompletedOutOfOrder = !chunkCompletionOrder.every((val, idx) => val === sortedChunkOrder[idx]);
      
      console.log(`Chunks completed ${chunksCompletedOutOfOrder ? 'out of order' : 'in order'} (${chunkCompletionOrder.length} chunks)`);
      
      // Check if events are in chronological order
      const eventsByBlock = events.map(e => e.blockNumber);
      const sortedEventsByBlock = [...eventsByBlock].sort((a, b) => a - b);
      
      // Check if events are already sorted
      const alreadySorted = eventsByBlock.every((val, idx) => val === sortedEventsByBlock[idx]);
      
      if (!alreadySorted) {
        // Log first few events to see the ordering issue
        console.log(`\n❌ Events are NOT in chronological order!`);
        console.log(`First 10 event blocks: ${eventsByBlock.slice(0, 10).join(', ')}`);
        console.log(`Should be: ${sortedEventsByBlock.slice(0, 10).join(', ')}`);
        
        // Find first mismatch
        let firstMismatch = -1;
        for (let i = 0; i < eventsByBlock.length; i++) {
          if (eventsByBlock[i] !== sortedEventsByBlock[i]) {
            firstMismatch = i;
            break;
          }
        }
        
        if (firstMismatch >= 0) {
          console.log(`First mismatch at index ${firstMismatch}: got ${eventsByBlock[firstMismatch]}, expected ${sortedEventsByBlock[firstMismatch]}`);
        }
      }
      
      // This should fail if events are not properly sorted by block number
      expect(eventsByBlock).toEqual(sortedEventsByBlock);
    } else {
      console.log(`⚠️  Not enough events (${events.length}) or chunks (${chunkCompletionOrder.length}) to properly test ordering`);
      expect(events.length).toBeGreaterThan(0);
    }
  }, 60000);

  it('should handle different chunk sizes correctly', async () => {
    const smallChunkFetcher = new GenericEventFetcher<TestEvent, TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 500,
      concurrency: 2
    });

    const largeChunkFetcher = new GenericEventFetcher<TestEvent, TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 2000,
      concurrency: 2
    });

    const basicProcessor: EventProcessor<TestEvent, TestEvent> = (events) => events;

    const [smallChunkEvents, largeChunkEvents] = await Promise.all([
      smallChunkFetcher.fetchEvents(
        usdcContract,
        'Transfer',
        basicProcessor,
        {
          contractAddress: usdcContract.address,
          fromBlock: 18500000,
          toBlock: 18501000
        }
      ),
      largeChunkFetcher.fetchEvents(
        usdcContract,
        'Transfer',
        basicProcessor,
        {
          contractAddress: usdcContract.address,
          fromBlock: 18500000,
          toBlock: 18501000
        }
      )
    ]);

    expect(smallChunkEvents.length).toBe(largeChunkEvents.length);
    
    for (let i = 0; i < smallChunkEvents.length; i++) {
      expect(smallChunkEvents[i].transactionHash).toBe(largeChunkEvents[i].transactionHash);
      expect(smallChunkEvents[i].blockNumber).toBe(largeChunkEvents[i].blockNumber);
    }
  }, 40000);

  it('should handle different concurrency settings', async () => {
    const highConcurrencyFetcher = new GenericEventFetcher<TestEvent, TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 1000,
      concurrency: 5,
      showProgress: true
    });

    const lowConcurrencyFetcher = new GenericEventFetcher<TestEvent, TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 1000,
      concurrency: 1,
      showProgress: true
    });

    const basicProcessor: EventProcessor<TestEvent, TestEvent> = (events) => events;

    const blockRange = { fromBlock: 18500000, toBlock: 18503000 };

    const [highConcurrencyEvents, lowConcurrencyEvents] = await Promise.all([
      highConcurrencyFetcher.fetchEvents(
        usdcContract,
        'Transfer',
        basicProcessor,
        {
          contractAddress: usdcContract.address,
          ...blockRange
        }
      ),
      lowConcurrencyFetcher.fetchEvents(
        usdcContract,
        'Transfer',
        basicProcessor,
        {
          contractAddress: usdcContract.address,
          ...blockRange
        }
      )
    ]);

    expect(highConcurrencyEvents.length).toBe(lowConcurrencyEvents.length);
    expect(highConcurrencyEvents.length).toBeGreaterThan(0);
  }, 60000);
});