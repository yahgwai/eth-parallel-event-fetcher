import { ethers } from 'ethers';

export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const USDC_ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];
export const TEST_FROM_BLOCK = 18500000;
export const TEST_TO_BLOCK = 18500100;
export let testProvider: ethers.providers.JsonRpcProvider;
export let usdcContract: ethers.Contract;

beforeAll(async () => {  testProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, testProvider);
}, 10000);

afterAll(async () => {  if (testProvider) {    testProvider.removeAllListeners();
    testProvider.polling = false;    const provider = testProvider as any;
    if (provider._websocket) {
      provider._websocket.close();
    }
  }
});
