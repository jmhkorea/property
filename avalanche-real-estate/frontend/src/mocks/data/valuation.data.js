// 부동산 평가 샘플 데이터
export const valuations = [
  {
    _id: "val1",
    property: "prop1",
    valuationType: "initial",
    currentValue: 500000000,
    methodology: "comparative_market_analysis",
    valuationDate: "2023-01-15T00:00:00.000Z",
    status: "published",
    confidenceScore: 85,
    appraiser: {
      name: "김평가",
      license: "APR-2023-12345",
      company: "한국부동산평가"
    },
    factors: [
      {
        factorName: "위치",
        factorType: "location",
        impact: "positive",
        valueImpact: 8,
        description: "지하철역과 대형마트가 도보 5분 거리에 위치"
      },
      {
        factorName: "건물 상태",
        factorType: "condition",
        impact: "negative",
        valueImpact: -3,
        description: "15년 이상 경과된 건물로 내부 시설 노후화 진행"
      }
    ],
    documents: [
      {
        title: "초기 평가 보고서",
        documentType: "appraisal_report",
        fileUrl: "https://example.com/files/initial_report.pdf",
        uploadedBy: "user1",
        uploadedAt: "2023-01-16T10:30:00.000Z"
      }
    ],
    recordedOnChain: true,
    transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    blockchainValuationId: 1,
    requestedBy: "user1",
    approvedBy: "admin1",
    createdAt: "2023-01-15T09:00:00.000Z",
    updatedAt: "2023-01-17T15:30:00.000Z"
  },
  {
    _id: "val2",
    property: "prop1",
    valuationType: "periodic",
    currentValue: 520000000,
    methodology: "income_approach",
    valuationDate: "2023-07-10T00:00:00.000Z",
    status: "pending_review",
    confidenceScore: 80,
    appraiser: {
      name: "이부동",
      license: "APR-2023-67890",
      company: "서울부동산평가"
    },
    factors: [
      {
        factorName: "임대 수익성",
        factorType: "market",
        impact: "positive",
        valueImpact: 5,
        description: "주변 임대 시세 상승으로 수익률 개선"
      },
      {
        factorName: "주변 개발",
        factorType: "environment",
        impact: "positive",
        valueImpact: 6,
        description: "인근 지역 상업시설 개발로 인한 가치 상승"
      }
    ],
    documents: [],
    recordedOnChain: false,
    requestedBy: "user1",
    createdAt: "2023-07-10T09:00:00.000Z",
    updatedAt: "2023-07-10T09:00:00.000Z"
  },
  {
    _id: "val3",
    property: "prop2",
    valuationType: "initial",
    currentValue: 700000000,
    methodology: "cost_approach",
    valuationDate: "2023-03-20T00:00:00.000Z",
    status: "approved",
    confidenceScore: 90,
    appraiser: {
      name: "박감정",
      license: "APR-2023-54321",
      company: "국제부동산평가"
    },
    factors: [
      {
        factorName: "건물 가치",
        factorType: "condition",
        impact: "positive",
        valueImpact: 9,
        description: "최근 리모델링 완료된 고급 자재 사용"
      }
    ],
    documents: [
      {
        title: "건축물 감정 보고서",
        documentType: "property_inspection",
        fileUrl: "https://example.com/files/building_report.pdf",
        uploadedBy: "user2",
        uploadedAt: "2023-03-22T14:20:00.000Z"
      }
    ],
    recordedOnChain: false,
    requestedBy: "user2",
    approvedBy: "admin1",
    createdAt: "2023-03-20T11:00:00.000Z",
    updatedAt: "2023-03-23T16:45:00.000Z"
  }
]; 