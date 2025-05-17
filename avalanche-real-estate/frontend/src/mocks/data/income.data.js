// 수익 분배 샘플 데이터
export const incomeDistributions = [
  {
    _id: "inc1",
    property: "prop1",
    title: "2023년 1분기 임대 수익",
    distributionType: "rental",
    totalAmount: 15000000,
    periodStart: "2023-01-01T00:00:00.000Z",
    periodEnd: "2023-03-31T23:59:59.000Z",
    paymentDate: "2023-04-15T00:00:00.000Z",
    status: "completed",
    currency: "KRW",
    sourceDetails: {
      tenantName: "김철수",
      contractId: "RT-2023-001",
      paymentReference: "PAYMENT-2023-Q1"
    },
    expenses: [
      {
        category: "maintenance",
        amount: 1200000,
        description: "건물 유지 보수 비용"
      },
      {
        category: "tax",
        amount: 750000,
        description: "임대 소득세"
      },
      {
        category: "management",
        amount: 500000,
        description: "관리 수수료"
      }
    ],
    netAmount: 12550000,
    tokenHolderDistribution: {
      totalDistributed: 12550000,
      perTokenAmount: 1255
    },
    documents: [
      {
        title: "임대 수익 명세서",
        documentType: "income_statement",
        fileUrl: "https://example.com/files/income_statement_q1_2023.pdf",
        uploadedBy: "admin1",
        uploadedAt: "2023-04-10T10:30:00.000Z"
      }
    ],
    recordedOnChain: true,
    transactionHash: "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef",
    blockchainDistributionId: 1,
    createdBy: "admin1",
    createdAt: "2023-04-05T09:00:00.000Z",
    updatedAt: "2023-04-16T15:30:00.000Z"
  },
  {
    _id: "inc2",
    property: "prop1",
    title: "2023년 2분기 임대 수익",
    distributionType: "rental",
    totalAmount: 15500000,
    periodStart: "2023-04-01T00:00:00.000Z",
    periodEnd: "2023-06-30T23:59:59.000Z",
    paymentDate: "2023-07-15T00:00:00.000Z",
    status: "pending",
    currency: "KRW",
    sourceDetails: {
      tenantName: "김철수",
      contractId: "RT-2023-001",
      paymentReference: "PAYMENT-2023-Q2"
    },
    expenses: [
      {
        category: "maintenance",
        amount: 800000,
        description: "에어컨 수리 비용"
      },
      {
        category: "tax",
        amount: 775000,
        description: "임대 소득세"
      },
      {
        category: "management",
        amount: 500000,
        description: "관리 수수료"
      }
    ],
    netAmount: 13425000,
    tokenHolderDistribution: {
      totalDistributed: 0,
      perTokenAmount: 0
    },
    documents: [],
    recordedOnChain: false,
    createdBy: "admin1",
    createdAt: "2023-07-05T09:00:00.000Z",
    updatedAt: "2023-07-05T09:00:00.000Z"
  },
  {
    _id: "inc3",
    property: "prop2",
    title: "2023년 상반기 자산 평가 상승",
    distributionType: "capital_gain",
    totalAmount: 50000000,
    periodStart: "2023-01-01T00:00:00.000Z",
    periodEnd: "2023-06-30T23:59:59.000Z",
    paymentDate: "2023-08-01T00:00:00.000Z",
    status: "approved",
    currency: "KRW",
    sourceDetails: {
      valuationBefore: 700000000,
      valuationAfter: 750000000,
      valuationIds: ["val3", "val4"]
    },
    expenses: [
      {
        category: "tax",
        amount: 10000000,
        description: "양도소득세"
      },
      {
        category: "fee",
        amount: 2500000,
        description: "처리 수수료"
      }
    ],
    netAmount: 37500000,
    tokenHolderDistribution: {
      totalDistributed: 37500000,
      perTokenAmount: 3750
    },
    documents: [
      {
        title: "자산 평가 보고서",
        documentType: "valuation_report",
        fileUrl: "https://example.com/files/valuation_report_2023h1.pdf",
        uploadedBy: "admin1",
        uploadedAt: "2023-07-20T14:20:00.000Z"
      }
    ],
    recordedOnChain: false,
    createdBy: "admin2",
    createdAt: "2023-07-15T11:00:00.000Z",
    updatedAt: "2023-07-20T15:45:00.000Z"
  }
]; 