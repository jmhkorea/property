/**
 * 블록체인 설정
 */
module.exports = {
  // 아발란체 퓨지테스트넷 RPC URL
  rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  
  // 계정 관련 설정
  privateKey: process.env.PRIVATE_KEY || '',
  adminWallet: process.env.ADMIN_WALLET || '',
  
  // 가스 설정
  gas: {
    limit: process.env.GAS_LIMIT || 3000000,
    price: process.env.GAS_PRICE || 25000000000 // 25 Gwei
  },
  
  // 스마트 컨트랙트 주소
  contracts: {
    propertyValuation: process.env.PROPERTY_VALUATION_CONTRACT || '',
    incomeDistribution: process.env.INCOME_DISTRIBUTION_CONTRACT || '',
    realEstateNFT: process.env.REAL_ESTATE_NFT_CONTRACT || '',
    fractionalOwnership: process.env.FRACTIONAL_OWNERSHIP_CONTRACT || ''
  },
  
  // IPFS 설정
  ipfs: {
    apiUrl: process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0',
    gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
    projectId: process.env.INFURA_IPFS_PROJECT_ID || '',
    projectSecret: process.env.INFURA_IPFS_PROJECT_SECRET || ''
  },
  
  // 블록체인 설정
  confirmations: process.env.CONFIRMATIONS || 2,
  blockTime: 2000, // 블록 생성 시간 (ms)
  
  // 네트워크 설정
  chainId: process.env.CHAIN_ID || 43113, // Fuji Testnet Chain ID
  
  // 트랜잭션 재시도 설정
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000
  }
}; 