import { ethers } from 'ethers';

// USDC contract address on mainnet (official Circle USDC)
export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

// USDC contract ABI (minimal - just Transfer event)
export const USDC_ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];

// Test block range with known activity
export const TEST_FROM_BLOCK = 18500000;
export const TEST_TO_BLOCK = 18500100;

// Global test provider
export let testProvider: ethers.providers.JsonRpcProvider;
export let usdcContract: ethers.Contract;

beforeAll(async () => {
  // Initialize provider for hardhat fork
  testProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

  // Create USDC contract instance - skip checksum validation
  usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, testProvider);
}, 10000);

afterAll(async () => {
  // Cleanup provider connections
  if (testProvider) {
    // For JsonRpcProvider in ethers v5, remove listeners and polling
    testProvider.removeAllListeners();
    testProvider.polling = false;
    // @ts-expect-error - Access internal connection to close it
    if ((testProvider as any)._websocket) {
      (testProvider as any)._websocket.close();
    }
  }
});
