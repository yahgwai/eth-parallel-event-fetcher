import { ethers } from 'ethers';
import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG } from '../src/config';
import { ContractInterface, EventProcessor, RawEvent } from '../types';

interface TestEvent extends RawEvent {
  address: string;
  topics: string[];
  data: string;
  args: any;
}

describe('Integration - Basic Event Fetching', () => {
  let fetcher: GenericEventFetcher<TestEvent, any>;
  let provider: ethers.providers.JsonRpcProvider;
  let usdcContract: ContractInterface;

  beforeAll(async () => {
    const config = {
      ...DEFAULT_CONFIG,
      maxLogsPerChunk: 1000,
      chunkSize: 1000
    };

    fetcher = new GenericEventFetcher(config);
    
    provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
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
        const logs = await provider.getLogs({
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

  it('should fetch Transfer events from USDC contract', async () => {
    const basicProcessor: EventProcessor<TestEvent, any> = (events) => events;
    
    const events = await fetcher.fetchEvents(
      usdcContract,
      'Transfer',
      basicProcessor,
      {
        contractAddress: usdcContract.address,
        fromBlock: 18500000,
        toBlock: 18500100
      }
    );

    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    
    const firstEvent = events[0];
    expect(firstEvent).toHaveProperty('address');
    expect(firstEvent).toHaveProperty('topics');
    expect(firstEvent).toHaveProperty('data');
    expect(firstEvent).toHaveProperty('blockNumber');
    expect(firstEvent).toHaveProperty('transactionHash');
    expect(firstEvent.address.toLowerCase()).toBe(usdcContract.address.toLowerCase());
  }, 30000);

  it('should process events with custom processor', async () => {
    interface TransferData {
      hash: string;
      block: number;
      from: string;
      to: string;
    }
    
    const customProcessor: EventProcessor<TestEvent, TransferData> = (events) => {
      return events.map(event => ({
        hash: event.transactionHash,
        block: event.blockNumber,
        from: event.topics[1],
        to: event.topics[2]
      }));
    };

    const events = await fetcher.fetchEvents(
      usdcContract,
      'Transfer',
      customProcessor,
      {
        contractAddress: usdcContract.address,
        fromBlock: 18500000,
        toBlock: 18500050
      }
    );

    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    
    const firstEvent = events[0];
    expect(firstEvent).toHaveProperty('hash');
    expect(firstEvent).toHaveProperty('block');
    expect(firstEvent).toHaveProperty('from');
    expect(firstEvent).toHaveProperty('to');
    expect(typeof firstEvent.hash).toBe('string');
    expect(typeof firstEvent.block).toBe('number');
    expect(typeof firstEvent.from).toBe('string');
    expect(typeof firstEvent.to).toBe('string');
  }, 30000);

  it('should handle empty results for block ranges with no events', async () => {
    const nonExistentContract: ContractInterface = {
      address: '0x1111111111111111111111111111111111111111',
      filters: {
        Transfer: () => ({
          topics: ['0x1111111111111111111111111111111111111111111111111111111111111111']
        } as ethers.EventFilter)
      },
      queryFilter: async (filter: ethers.EventFilter, fromBlock?: number, toBlock?: number) => {
        const logs = await provider.getLogs({
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
    
    const basicProcessor: EventProcessor<TestEvent, any> = (events) => events;
    
    const events = await fetcher.fetchEvents(
      nonExistentContract,
      'Transfer',
      basicProcessor,
      {
        contractAddress: nonExistentContract.address,
        fromBlock: 18500000,
        toBlock: 18500010
      }
    );

    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(0);
  }, 15000);
});