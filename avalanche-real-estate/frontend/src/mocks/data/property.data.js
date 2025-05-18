// 부동산 정보 샘플 데이터
export const properties = [
  {
    _id: "prop1",
    title: "강남 럭셔리 오피스 빌딩",
    description: "서울 강남구 테헤란로에 위치한 프리미엄 오피스 빌딩입니다. 지하철 역에서 도보 5분 거리에 위치하며 다양한 편의 시설이 인접해 있습니다.",
    propertyType: "commercial",
    status: "tokenized",
    location: {
      address: "서울특별시 강남구 테헤란로 123",
      city: "서울",
      state: "강남구",
      zipCode: "06234",
      country: "대한민국",
      coordinates: {
        latitude: 37.5087,
        longitude: 127.0632
      }
    },
    specifications: {
      totalArea: 2500, // 평방미터
      floorCount: 15,
      buildingAge: 8, // 년
      parkingSpaces: 50,
      hasElevator: true,
      features: ["보안 시스템", "중앙 냉난방", "옥상 정원", "회의실"]
    },
    financial: {
      purchasePrice: 15000000000, // 원
      currentValue: 20000000000, // 원
      valuationDate: "2023-07-10T00:00:00.000Z",
      monthlyRentalIncome: 120000000, // 원
      annualizedReturn: 5.8 // 퍼센트
    },
    ownership: {
      tokenized: true,
      tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
      totalTokens: 10000,
      tokenPrice: 2000000 // 원
    },
    media: {
      mainImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1000&auto=format&fit=crop"
      ],
      floorPlans: [
        "https://example.com/properties/p1/floorplan1.pdf",
        "https://example.com/properties/p1/floorplan2.pdf"
      ],
      virtualTour: "https://example.com/properties/p1/virtualtour"
    },
    documents: [
      {
        title: "등기부등본",
        documentType: "legal",
        fileUrl: "https://example.com/properties/p1/docs/registration.pdf",
        uploadedAt: "2023-01-10T09:30:00.000Z"
      },
      {
        title: "건축물대장",
        documentType: "legal",
        fileUrl: "https://example.com/properties/p1/docs/buildingcert.pdf",
        uploadedAt: "2023-01-10T09:35:00.000Z"
      }
    ],
    management: {
      company: "한국부동산관리",
      contactPerson: "김관리",
      contactEmail: "kim@krmanagement.com",
      contactPhone: "02-123-4567"
    },
    createdAt: "2023-01-10T09:00:00.000Z",
    updatedAt: "2023-07-15T15:30:00.000Z"
  },
  {
    _id: "prop2",
    title: "부산 해운대 오션뷰 상업시설",
    description: "부산 해운대 해변에 인접한 프리미엄 상업시설입니다. 관광객 유동인구가 많고 연중 안정적인 수익이 발생합니다.",
    propertyType: "commercial",
    status: "tokenized",
    location: {
      address: "부산광역시 해운대구 해운대로 456",
      city: "부산",
      state: "해운대구",
      zipCode: "48100",
      country: "대한민국",
      coordinates: {
        latitude: 35.1587,
        longitude: 129.1632
      }
    },
    specifications: {
      totalArea: 1800, // 평방미터
      floorCount: 5,
      buildingAge: 3, // 년
      parkingSpaces: 30,
      hasElevator: true,
      features: ["오션뷰", "테라스", "최신 설비", "관광지 인접"]
    },
    financial: {
      purchasePrice: 12000000000, // 원
      currentValue: 15000000000, // 원
      valuationDate: "2023-06-15T00:00:00.000Z",
      monthlyRentalIncome: 95000000, // 원
      annualizedReturn: 6.2 // 퍼센트
    },
    ownership: {
      tokenized: true,
      tokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
      totalTokens: 8000,
      tokenPrice: 1875000 // 원
    },
    media: {
      mainImage: "https://images.unsplash.com/photo-1604014238170-4def1e4e6fcf?q=80&w=1000&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1604014238170-4def1e4e6fcf?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1567366783848-6ea8a155113e?q=80&w=1000&auto=format&fit=crop"
      ],
      floorPlans: [
        "https://example.com/properties/p2/floorplan1.pdf"
      ],
      virtualTour: "https://example.com/properties/p2/virtualtour"
    },
    documents: [
      {
        title: "등기부등본",
        documentType: "legal",
        fileUrl: "https://example.com/properties/p2/docs/registration.pdf",
        uploadedAt: "2023-03-01T10:30:00.000Z"
      },
      {
        title: "임대차 계약서",
        documentType: "contract",
        fileUrl: "https://example.com/properties/p2/docs/lease.pdf",
        uploadedAt: "2023-03-01T10:45:00.000Z"
      }
    ],
    management: {
      company: "부산부동산관리",
      contactPerson: "박관리",
      contactEmail: "park@busanrealestate.com",
      contactPhone: "051-765-4321"
    },
    createdAt: "2023-03-01T10:00:00.000Z",
    updatedAt: "2023-06-20T11:45:00.000Z"
  },
  {
    _id: "prop3",
    title: "제주 리조트 단지",
    description: "제주도 서귀포시에 위치한 프라이빗 리조트 단지입니다. 연중 관광객 수요가 높고 자연환경이 뛰어납니다.",
    propertyType: "hospitality",
    status: "pending_tokenization",
    location: {
      address: "제주특별자치도 서귀포시 중문관광로 789",
      city: "제주",
      state: "서귀포시",
      zipCode: "63535",
      country: "대한민국",
      coordinates: {
        latitude: 33.2487,
        longitude: 126.4132
      }
    },
    specifications: {
      totalArea: 5000, // 평방미터
      floorCount: 3,
      buildingAge: 2, // 년
      parkingSpaces: 80,
      hasElevator: true,
      features: ["수영장", "스파", "레스토랑", "프라이빗 비치", "골프장 인접"]
    },
    financial: {
      purchasePrice: 25000000000, // 원
      currentValue: 28000000000, // 원
      valuationDate: "2023-08-01T00:00:00.000Z",
      monthlyRentalIncome: 210000000, // 원
      annualizedReturn: 7.5 // 퍼센트
    },
    ownership: {
      tokenized: false,
      tokenAddress: "",
      totalTokens: 0,
      tokenPrice: 0
    },
    media: {
      mainImage: "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=1000&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600607687644-c7841a4a2a01?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526786220381-1d21eedf92bf?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=1000&auto=format&fit=crop"
      ],
      floorPlans: [
        "https://example.com/properties/p3/floorplan1.pdf",
        "https://example.com/properties/p3/floorplan2.pdf",
        "https://example.com/properties/p3/floorplan3.pdf"
      ],
      virtualTour: "https://example.com/properties/p3/virtualtour"
    },
    documents: [
      {
        title: "등기부등본",
        documentType: "legal",
        fileUrl: "https://example.com/properties/p3/docs/registration.pdf",
        uploadedAt: "2023-05-15T11:20:00.000Z"
      },
      {
        title: "사업계획서",
        documentType: "business",
        fileUrl: "https://example.com/properties/p3/docs/businessplan.pdf",
        uploadedAt: "2023-05-15T11:30:00.000Z"
      }
    ],
    management: {
      company: "제주리조트관리",
      contactPerson: "이관리",
      contactEmail: "lee@jejuresort.com",
      contactPhone: "064-321-7654"
    },
    createdAt: "2023-05-15T11:00:00.000Z",
    updatedAt: "2023-08-05T16:15:00.000Z"
  }
]; 