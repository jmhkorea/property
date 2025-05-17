const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const PropertyValuation = require('../../src/models/property-valuation.model');
const Property = require('../../src/models/property.model');
const User = require('../../src/models/user.model');

// 모듈 모킹
jest.mock('../../src/services/blockchain.service', () => ({
  recordPropertyValuation: jest.fn(),
  approvePropertyValuation: jest.fn(),
  getPropertyValuation: jest.fn(),
  getLatestValuationId: jest.fn(),
  getValuationHistory: jest.fn()
}));

// 불러올 모듈 모킹
const blockchainService = require('../../src/services/blockchain.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('부동산 평가 모델 단위 테스트', () => {
  let property;
  let user;
  
  beforeEach(async () => {
    // 테스트 데이터 초기화
    await User.deleteMany({});
    await Property.deleteMany({});
    await PropertyValuation.deleteMany({});
    
    // Jest 모킹 초기화
    jest.clearAllMocks();
    
    // 테스트용 사용자 생성
    user = new User({
      name: '테스트 사용자',
      email: 'test@example.com',
      password: 'password123',
      walletAddress: '0x1234567890123456789012345678901234567890',
      role: 'admin'
    });
    await user.save();
    
    // 테스트용 부동산 생성
    property = new Property({
      propertyAddress: '서울시 강남구 테스트로 123',
      propertyType: '아파트',
      squareMeters: 100,
      appraisedValue: '500000000',
      latitude: '37.5665',
      longitude: '126.9780',
      ipfsDocumentURI: 'ipfs://test',
      ownerAddress: user.walletAddress,
      createdBy: user._id,
      isTokenized: true,
      tokenId: 1
    });
    await property.save();
  });
  
  test('부동산 평가 생성 테스트', async () => {
    const valuationData = {
      property: property._id,
      valuationType: 'initial',
      currentValue: 500000000,
      methodology: 'comparative_market_analysis',
      valuationDate: new Date(),
      status: 'draft',
      appraiser: {
        name: '평가사',
        license: 'TEST-123',
        company: '테스트 부동산 평가'
      },
      requestedBy: user._id,
      confidenceScore: 85,
      factors: [
        {
          factorName: '위치',
          factorType: 'location',
          impact: 'positive',
          valueImpact: 5,
          description: '역세권 위치'
        }
      ]
    };
    
    const valuation = new PropertyValuation(valuationData);
    await valuation.save();
    
    const savedValuation = await PropertyValuation.findById(valuation._id);
    expect(savedValuation).toBeTruthy();
    expect(savedValuation.currentValue).toBe(500000000);
    expect(savedValuation.methodology).toBe('comparative_market_analysis');
    expect(savedValuation.factors.length).toBe(1);
    expect(savedValuation.factors[0].factorName).toBe('위치');
  });
  
  test('평가 상태 변경 테스트', async () => {
    const valuation = new PropertyValuation({
      property: property._id,
      valuationType: 'initial',
      currentValue: 500000000,
      methodology: 'comparative_market_analysis',
      status: 'draft',
      requestedBy: user._id
    });
    await valuation.save();
    
    // 상태 변경: draft -> pending_review
    valuation.status = 'pending_review';
    await valuation.save();
    
    const updatedValuation = await PropertyValuation.findById(valuation._id);
    expect(updatedValuation.status).toBe('pending_review');
  });
  
  test('평가 문서 추가 테스트', async () => {
    const valuation = new PropertyValuation({
      property: property._id,
      valuationType: 'initial',
      currentValue: 500000000,
      methodology: 'comparative_market_analysis',
      status: 'draft',
      requestedBy: user._id,
      documents: []
    });
    await valuation.save();
    
    // 문서 추가
    const document = {
      title: '테스트 문서',
      documentType: 'appraisal_report',
      fileUrl: 'https://example.com/test-doc.pdf',
      uploadedBy: user._id,
      uploadedAt: new Date()
    };
    
    valuation.documents.push(document);
    await valuation.save();
    
    const updatedValuation = await PropertyValuation.findById(valuation._id);
    expect(updatedValuation.documents.length).toBe(1);
    expect(updatedValuation.documents[0].title).toBe('테스트 문서');
    expect(updatedValuation.documents[0].documentType).toBe('appraisal_report');
  });
  
  test('블록체인 기록 상태 변경 테스트', async () => {
    const valuation = new PropertyValuation({
      property: property._id,
      valuationType: 'initial',
      currentValue: 500000000,
      methodology: 'comparative_market_analysis',
      status: 'approved',
      requestedBy: user._id,
      approvedBy: user._id,
      recordedOnChain: false
    });
    await valuation.save();
    
    // 블록체인에 기록 완료로 상태 변경
    valuation.recordedOnChain = true;
    valuation.transactionHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    valuation.status = 'published';
    await valuation.save();
    
    const updatedValuation = await PropertyValuation.findById(valuation._id);
    expect(updatedValuation.recordedOnChain).toBe(true);
    expect(updatedValuation.transactionHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    expect(updatedValuation.status).toBe('published');
  });
  
  test('평가 승인 프로세스 테스트', async () => {
    const valuation = new PropertyValuation({
      property: property._id,
      valuationType: 'initial',
      currentValue: 500000000,
      methodology: 'comparative_market_analysis',
      status: 'pending_review',
      requestedBy: user._id
    });
    await valuation.save();
    
    // 승인 처리
    valuation.status = 'approved';
    valuation.approvedBy = user._id;
    await valuation.save();
    
    const updatedValuation = await PropertyValuation.findById(valuation._id);
    expect(updatedValuation.status).toBe('approved');
    expect(updatedValuation.approvedBy.toString()).toBe(user._id.toString());
  });
  
  test('평가 요소(Factor) 추가 테스트', async () => {
    const valuation = new PropertyValuation({
      property: property._id,
      valuationType: 'initial',
      currentValue: 500000000,
      methodology: 'comparative_market_analysis',
      status: 'draft',
      requestedBy: user._id,
      factors: []
    });
    await valuation.save();
    
    // 평가 요소 추가
    const factors = [
      {
        factorName: '위치',
        factorType: 'location',
        impact: 'positive',
        valueImpact: 5,
        description: '역세권 위치'
      },
      {
        factorName: '건물 상태',
        factorType: 'condition',
        impact: 'negative',
        valueImpact: -2,
        description: '오래된 건물'
      }
    ];
    
    valuation.factors = factors;
    await valuation.save();
    
    const updatedValuation = await PropertyValuation.findById(valuation._id);
    expect(updatedValuation.factors.length).toBe(2);
    expect(updatedValuation.factors[0].factorName).toBe('위치');
    expect(updatedValuation.factors[0].impact).toBe('positive');
    expect(updatedValuation.factors[1].factorName).toBe('건물 상태');
    expect(updatedValuation.factors[1].impact).toBe('negative');
  });
  
  test('블록체인 기록 테스트(모킹)', async () => {
    // 블록체인 서비스 mock 설정
    blockchainService.recordPropertyValuation.mockResolvedValue({
      success: true,
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      valuationId: 1
    });
    
    const valuation = new PropertyValuation({
      property: property._id,
      valuationType: 'initial',
      currentValue: 500000000,
      methodology: 'comparative_market_analysis',
      status: 'approved',
      requestedBy: user._id,
      approvedBy: user._id
    });
    await valuation.save();
    
    // 블록체인 서비스 호출 (모킹)
    const result = await blockchainService.recordPropertyValuation(
      1, // tokenId
      '500000000', // currentValue
      0, // methodologyId (comparative_market_analysis)
      'ipfs://test'
    );
    
    expect(result.success).toBe(true);
    expect(result.transactionHash).toBeDefined();
    expect(blockchainService.recordPropertyValuation).toHaveBeenCalledTimes(1);
    
    // 평가 정보 업데이트
    valuation.recordedOnChain = true;
    valuation.transactionHash = result.transactionHash;
    valuation.status = 'published';
    await valuation.save();
    
    const updatedValuation = await PropertyValuation.findById(valuation._id);
    expect(updatedValuation.recordedOnChain).toBe(true);
    expect(updatedValuation.transactionHash).toBe(result.transactionHash);
  });
}); 