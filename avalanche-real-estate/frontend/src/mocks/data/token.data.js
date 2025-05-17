// 부동산 토큰 샘플 데이터
export const tokens = [
  {
    _id: "token1",
    property: "prop1",
    name: "GNB-APT",
    symbol: "GNBA",
    tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
    totalSupply: 10000,
    tokenPrice: 2000000, // 원
    marketCap: 20000000000, // 원
    tradingStatus: "active",
    issuanceDate: "2023-01-20T00:00:00.000Z",
    lastTradeDate: "2023-09-01T14:30:00.000Z",
    blockchain: "avalanche",
    smartContractUrl: "https://snowtrace.io/token/0x1234567890abcdef1234567890abcdef12345678",
    distributions: [
      {
        distributionId: "inc1",
        distributionDate: "2023-04-15T00:00:00.000Z",
        amountPerToken: 1255, // 원
        totalDistributed: 12550000, // 원
        distributionType: "rental"
      }
    ],
    holders: [
      {
        address: "0xabc123...",
        balance: 2000,
        percentage: 20
      },
      {
        address: "0xdef456...",
        balance: 1500,
        percentage: 15
      },
      {
        address: "0xghi789...",
        balance: 1000,
        percentage: 10
      }
    ],
    tradingHistory: [
      {
        date: "2023-02-15T09:30:00.000Z",
        price: 1850000, // 원
        quantity: 100,
        transactionHash: "0xabc123..."
      },
      {
        date: "2023-05-10T11:15:00.000Z",
        price: 1920000, // 원
        quantity: 50,
        transactionHash: "0xdef456..."
      },
      {
        date: "2023-09-01T14:30:00.000Z",
        price: 2000000, // 원
        quantity: 30,
        transactionHash: "0xghi789..."
      }
    ],
    createdAt: "2023-01-20T00:00:00.000Z",
    updatedAt: "2023-09-01T14:30:00.000Z"
  },
  {
    _id: "token2",
    property: "prop2",
    name: "BSN-COM",
    symbol: "BSNC",
    tokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    totalSupply: 8000,
    tokenPrice: 1875000, // 원
    marketCap: 15000000000, // 원
    tradingStatus: "active",
    issuanceDate: "2023-03-10T00:00:00.000Z",
    lastTradeDate: "2023-08-20T10:45:00.000Z",
    blockchain: "avalanche",
    smartContractUrl: "https://snowtrace.io/token/0xabcdef1234567890abcdef1234567890abcdef12",
    distributions: [
      {
        distributionId: "inc3",
        distributionDate: "2023-08-01T00:00:00.000Z",
        amountPerToken: 3750, // 원
        totalDistributed: 37500000, // 원
        distributionType: "capital_gain"
      }
    ],
    holders: [
      {
        address: "0xklm123...",
        balance: 3000,
        percentage: 37.5
      },
      {
        address: "0xnop456...",
        balance: 2000,
        percentage: 25
      },
      {
        address: "0xqrs789...",
        balance: 1500,
        percentage: 18.75
      }
    ],
    tradingHistory: [
      {
        date: "2023-04-05T08:20:00.000Z",
        price: 1800000, // 원
        quantity: 200,
        transactionHash: "0xklm123..."
      },
      {
        date: "2023-06-15T13:40:00.000Z",
        price: 1850000, // 원
        quantity: 100,
        transactionHash: "0xnop456..."
      },
      {
        date: "2023-08-20T10:45:00.000Z",
        price: 1875000, // 원
        quantity: 50,
        transactionHash: "0xqrs789..."
      }
    ],
    createdAt: "2023-03-10T00:00:00.000Z",
    updatedAt: "2023-08-20T10:45:00.000Z"
  }
];

// 토큰 거래 데이터
export const tokenTransactions = [
  {
    _id: "trans1",
    token: "token1",
    transactionType: "purchase",
    quantity: 100,
    pricePerToken: 1850000,
    totalAmount: 185000000,
    buyer: "0xabc123...",
    seller: "0xplatform...",
    transactionHash: "0xabc123...",
    status: "completed",
    transactionDate: "2023-02-15T09:30:00.000Z",
    confirmationDate: "2023-02-15T09:32:00.000Z",
    gasUsed: 250000,
    gasFee: 0.025, // AVAX
    createdAt: "2023-02-15T09:30:00.000Z",
    updatedAt: "2023-02-15T09:32:00.000Z"
  },
  {
    _id: "trans2",
    token: "token1",
    transactionType: "sale",
    quantity: 50,
    pricePerToken: 1920000,
    totalAmount: 96000000,
    buyer: "0xdef456...",
    seller: "0xabc123...",
    transactionHash: "0xdef456...",
    status: "completed",
    transactionDate: "2023-05-10T11:15:00.000Z",
    confirmationDate: "2023-05-10T11:17:00.000Z",
    gasUsed: 230000,
    gasFee: 0.023, // AVAX
    createdAt: "2023-05-10T11:15:00.000Z",
    updatedAt: "2023-05-10T11:17:00.000Z"
  },
  {
    _id: "trans3",
    token: "token2",
    transactionType: "purchase",
    quantity: 200,
    pricePerToken: 1800000,
    totalAmount: 360000000,
    buyer: "0xklm123...",
    seller: "0xplatform...",
    transactionHash: "0xklm123...",
    status: "completed",
    transactionDate: "2023-04-05T08:20:00.000Z",
    confirmationDate: "2023-04-05T08:22:00.000Z",
    gasUsed: 260000,
    gasFee: 0.026, // AVAX
    createdAt: "2023-04-05T08:20:00.000Z",
    updatedAt: "2023-04-05T08:22:00.000Z"
  },
  {
    _id: "trans4",
    token: "token1",
    transactionType: "sale",
    quantity: 30,
    pricePerToken: 2000000,
    totalAmount: 60000000,
    buyer: "0xghi789...",
    seller: "0xdef456...",
    transactionHash: "0xghi789...",
    status: "completed",
    transactionDate: "2023-09-01T14:30:00.000Z",
    confirmationDate: "2023-09-01T14:32:00.000Z",
    gasUsed: 240000,
    gasFee: 0.024, // AVAX
    createdAt: "2023-09-01T14:30:00.000Z",
    updatedAt: "2023-09-01T14:32:00.000Z"
  },
  {
    _id: "trans5",
    token: "token2",
    transactionType: "pending_purchase",
    quantity: 100,
    pricePerToken: 1900000,
    totalAmount: 190000000,
    buyer: "0xtuv123...",
    seller: "0xqrs789...",
    transactionHash: "",
    status: "pending",
    transactionDate: "2023-09-10T15:45:00.000Z",
    confirmationDate: null,
    gasUsed: 0,
    gasFee: 0,
    createdAt: "2023-09-10T15:45:00.000Z",
    updatedAt: "2023-09-10T15:45:00.000Z"
  }
]; 