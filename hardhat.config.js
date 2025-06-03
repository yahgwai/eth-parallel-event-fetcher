require('@nomiclabs/hardhat-ethers');

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_URL,
        blockNumber: 18500000, // Block with USDC activity
      },
    },
  },
  solidity: "0.8.19",
};