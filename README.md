# Ethereum Parallel Fetcher

A TypeScript library for parallel fetching of Ethereum contract events with configurable concurrency, rate limiting, and block range chunking.

## Features

- 🚀 **Parallel Processing**: Fetch events across multiple block ranges simultaneously
- 🔄 **Automatic Retry Logic**: Built-in retry mechanism with exponential backoff
- 📊 **Progress Tracking**: Real-time progress reporting and callbacks
- 🎯 **Generic Interfaces**: Works with any Ethereum contract events
- ⚙️ **Configurable**: Extensive configuration options for performance tuning
- 🛡️ **TypeScript Support**: Full type safety and intellisense
- 🌍 **Environment Variables**: Configuration via environment variables

## Installation

```bash
npm install ethereum-parallel-fetcher
```

## Quick Start

```typescript
import { GenericEventFetcher } from 'ethereum-parallel-fetcher';
import { ethers } from 'ethers';

// Create provider
const provider = new ethers.providers.JsonRpcProvider('your-rpc-url');

// Create contract instance
const contract = new ethers.Contract(contractAddress, abi, provider);

// Create fetcher with default configuration
const fetcher = new GenericEventFetcher();

// Fetch events
const events = await fetcher.fetchEvents(
  contract,
  'EventName',
  {
    fromBlock: 1000000,
    toBlock: 1010000,
    contractAddress: '0x...'
  }
);

// Process events as needed
const processedEvents = events.map(event => ({
  blockNumber: event.blockNumber,
  transactionHash: event.transactionHash,
  args: event.args
}));
```

## Configuration

### Constructor Configuration

```typescript
import { GenericEventFetcher, FetcherConfig } from 'ethereum-parallel-fetcher';

const config: FetcherConfig = {
  // Concurrency and performance
  concurrency: 10,           // Number of parallel requests (1-50)
  chunkSize: 5000,          // Blocks per chunk (100-100,000)
  
  // Retry configuration
  maxRetries: 3,            // Number of retry attempts (0-10)
  initialRetryDelay: 1000,  // Initial delay in ms (100-30,000)
  
  // Rate limiting
  rateLimitPerSecond: 10,   // Requests per second (1-1,000)
  
  // Progress tracking
  showProgress: true,       // Show console progress
  progressCallback: (completed, total, chunk) => {
    console.log(`Progress: ${completed}/${total} chunks`);
  },
  
  // Error handling
  continueOnError: true,    // Continue on individual chunk errors
  maxLogsPerChunk: 9500     // Max logs per chunk to avoid truncation
};

const fetcher = new GenericEventFetcher(config);
```

### Environment Variables

Configure the library using environment variables:

```bash
# Concurrency and performance
ETH_FETCHER_CONCURRENCY=10
ETH_FETCHER_CHUNK_SIZE=5000

# Retry configuration
ETH_FETCHER_MAX_RETRIES=3
ETH_FETCHER_INITIAL_RETRY_DELAY=1000

# Rate limiting
ETH_FETCHER_RATE_LIMIT_PER_SECOND=10

# Progress tracking
ETH_FETCHER_SHOW_PROGRESS=true

# Error handling
ETH_FETCHER_CONTINUE_ON_ERROR=true
ETH_FETCHER_MAX_LOGS_PER_CHUNK=9500
```

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  concurrency: 4,
  chunkSize: 10000,
  maxRetries: 3,
  initialRetryDelay: 1000,
  rateLimitPerSecond: 10,
  showProgress: false,
  continueOnError: true,
  maxLogsPerChunk: 10000
};
```

## API Reference

### GenericEventFetcher

#### Constructor

```typescript
new GenericEventFetcher<TRawEvent, TAddress>(config?: Partial<FetcherConfig>)
```

#### Methods

##### fetchEvents()

```typescript
async fetchEvents(
  contract: ContractInterface<TAddress>,
  eventName: string,
  options: EventFetcherOptions<TAddress>
): Promise<TRawEvent[]>
```

**Parameters:**
- `contract`: Ethers contract instance with event filters
- `eventName`: Name of the event to fetch (must match contract ABI)
- `options`: Fetch options including block range and contract address

##### updateConfig()

```typescript
updateConfig(newConfig: Partial<FetcherConfig>): void
```

Update the fetcher configuration at runtime.

##### getConfig()

```typescript
getConfig(): Required<FetcherConfig>
```

Get the current configuration.

### Types


#### EventFetcherOptions

```typescript
interface EventFetcherOptions<TAddress = string> {
  fromBlock: number;
  toBlock: number;
  contractAddress: TAddress;
  chunkSize?: number;
  maxRetries?: number;
  initialRetryDelay?: number;
  onProgress?: (completed: number, total: number, chunk: [number, number]) => void;
}
```

## Usage Examples

### Basic Event Fetching

```typescript
import { GenericEventFetcher } from 'ethereum-parallel-fetcher';
import { ethers } from 'ethers';

// Setup
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(ADDRESS, ABI, provider);
const fetcher = new GenericEventFetcher({ concurrency: 8 });

// Fetch events
const events = await fetcher.fetchEvents(
  contract,
  'Transfer',
  {
    fromBlock: 18000000,
    toBlock: 18100000,
    contractAddress: ADDRESS
  }
);

console.log(`Found ${events.length} Transfer events`);
```

### Advanced Event Processing

```typescript
// Fetch with progress tracking
const events = await fetcher.fetchEvents(
  contract,
  'Transfer',
  {
    fromBlock: 18000000,
    toBlock: 18100000,
    contractAddress: ADDRESS,
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total} chunks`);
    }
  }
);

// Process events as needed
const transfers = events.map(event => ({
  from: event.args.from,
  to: event.args.to,
  value: ethers.utils.formatEther(event.args.value),
  blockNumber: event.blockNumber,
  transactionHash: event.transactionHash,
  timestamp: null // Will be populated separately if needed
}));
    fromBlock: startBlock,
    toBlock: endBlock,
    contractAddress: TOKEN_ADDRESS,
    onProgress: (completed, total, currentChunk) => {
      const percentage = (completed / total * 100).toFixed(1);
      console.log(`Progress: ${percentage}% (${completed}/${total} chunks)`);
      console.log(`Current chunk: blocks ${currentChunk[0]}-${currentChunk[1]}`);
    }
  }
);
```

### Multiple Contract Types

```typescript
// Type-safe usage with custom interfaces
interface MyContract {
  address: string;
  filters: {
    MyEvent(): ethers.EventFilter;
  };
  queryFilter(filter: ethers.EventFilter, fromBlock?: number, toBlock?: number): Promise<ethers.Event[]>;
}

interface MyEvent {
  args: {
    param1: string;
    param2: number;
  };
  blockNumber: number;
  transactionHash: string;
}

interface ProcessedMyEvent {
  param1: string;
  param2: number;
  blockNumber: number;
  txHash: string;
  contractAddress: string;
}

const myEventProcessor = (events: MyEvent[], contractAddress: string): ProcessedMyEvent[] => {
  return events.map(event => ({
    param1: event.args.param1,
    param2: event.args.param2,
    blockNumber: event.blockNumber,
    txHash: event.transactionHash,
    contractAddress
  }));
};

const typedFetcher = new GenericEventFetcher<MyEvent, ProcessedMyEvent, string>();
const processedEvents = await typedFetcher.fetchEvents(
  contract as MyContract,
  'MyEvent',
  myEventProcessor,
  options
);
```

### Error Handling

```typescript
try {
  const events = await fetcher.fetchEvents(contract, 'EventName', options);
} catch (error) {
  if (error.message.includes('truncation detected')) {
    console.log('Try reducing chunk size');
    // Retry with smaller chunks
    const smallerFetcher = new GenericEventFetcher({ chunkSize: 1000 });
    const events = await smallerFetcher.fetchEvents(contract, 'EventName', options);
  } else {
    console.error('Fetch failed:', error);
  }
}
```

## Performance Tips

### Chunk Size Optimization

- **Large ranges**: Use larger chunks (5,000-10,000 blocks) for sparse events
- **Dense events**: Use smaller chunks (1,000-2,000 blocks) to avoid truncation
- **Provider limits**: Stay under provider log limits (usually 10,000 logs per request)

### Concurrency Settings

- **Alchemy/Infura**: 8-15 concurrent requests work well
- **Local node**: Can handle higher concurrency (20-30)
- **Rate limited providers**: Reduce concurrency and increase retry delay

### Memory Considerations

- For very large ranges, process results in batches
- Use streaming or pagination for millions of events
- Monitor memory usage with large chunk sizes

## Troubleshooting

### Common Issues

**"Potential event truncation detected"**
- Reduce `chunkSize` to stay under provider limits
- Check if the block range has unusually high activity

**Rate limiting errors**
- Reduce `concurrency` 
- Increase `initialRetryDelay`
- Adjust `rateLimitPerSecond`

**Timeout errors**
- Increase `maxRetries`
- Reduce `chunkSize` for problematic ranges
- Check network connectivity

### Debug Mode

Enable detailed logging:

```typescript
const fetcher = new GenericEventFetcher({
  showProgress: true,
  progressCallback: (completed, total, chunk) => {
    console.log(`Chunk ${completed}/${total}: blocks ${chunk[0]}-${chunk[1]}`);
  }
});
```

## License

ISC

## Testing

### Running Tests

The library includes comprehensive test coverage with unit tests, integration tests, and large-scale testing.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- config.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Environment Setup

Tests require a local blockchain fork using Hardhat. The test setup automatically:
- Forks Ethereum mainnet at block 18,500,000
- Uses USDC contract for realistic testing
- Provides 10-second timeout for setup

```bash
# Start hardhat fork for testing (automatic)
npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/your-key
```

### Test Structure

The test suite is organized into several categories:

#### Unit Tests
- **config.test.ts** (20 tests): Configuration system testing
- **fetcher.test.ts** (18 tests): GenericEventFetcher class testing  
- **utils.test.ts** (31 tests): Utility functions testing

#### Integration Tests
- **connectivity.test.ts** (3 tests): Blockchain connection testing
- **integration-basic.test.ts** (3 tests): Basic event fetching
- **integration-parallel.test.ts** (4 tests): Parallel processing
- **integration-processor.test.ts** (3 tests): Event processing patterns

#### Error Handling & Large-Scale Tests
- **error-handling-simple.test.ts** (3 tests): Configuration validation
- **integration-large-scale-real.test.ts** (1 test): >500k block processing

### Test Features

- **Real blockchain data**: Tests use actual USDC Transfer events
- **Parallel processing verification**: Tests verify concurrent chunk processing
- **Event processing patterns**: Demonstrates various ways to transform fetched events
- **Error scenario coverage**: Tests configuration validation and edge cases
- **Large-scale validation**: Confirms library handles production workloads (>500k blocks)

### Writing New Tests

When adding tests, follow these patterns:

```typescript
// Unit test example
describe('New Feature', () => {
  test('should handle specific scenario', () => {
    // Test implementation
    expect(result).toBeDefined();
  });
});

// Integration test example  
describe('Integration - New Feature', () => {
  beforeAll(async () => {
    // Setup with real provider
  });
  
  test('should work with real blockchain data', async () => {
    // Test with actual events
  }, 30000); // 30s timeout for integration tests
});
```

### Test Configuration

Tests use Jest with the following configuration:
- TypeScript support via `ts-jest`
- ES module handling for dependencies
- Mock implementations for external dependencies
- 30-second timeout for integration tests

## Contributing

This library is part of a larger project. For contributions and issues, please refer to the main project repository.