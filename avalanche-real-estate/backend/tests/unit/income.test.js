const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const IncomeDistribution = require('../../src/models/income-distribution.model');
const Property = require('../../src/models/property.model');
const User = require('../../src/models/user.model');
const Token = require('../../src/models/token.model');

// 모듈 모킹
jest.mock('../../src/services/blockchain.service', () => ({
  createIncomeDistribution: jest.fn(),
  executeIncomeDistribution: jest.fn(),
  cancelIncomeDistribution: jest.fn(),
  getIncomeDistribution: jest.fn(),
  getIncomeDistributionHistory: jest.fn(),
  depositFunds: jest.fn()
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

describe('수익 분배 모델 단위 테스트', () => {
  let property;
  let user1;
  let user2;
  let token;
  
  beforeEach(async () => {
    // 테스트 데이터 초기화
    await User.deleteMany({});
    await Property.deleteMany({});
    await Token.deleteMany({});
    await IncomeDistribution.deleteMany({});
    
    // Jest 모킹 초기화
    jest.clearAllMocks();
    
    // 테스트용 사용자 생성
    user1 = new User({
      name: '사용자1',
      email: 'user1@example.com',
      password: 'password123',
      walletAddress: '0x1234567890123456789012345678901234567890',
      role: 'user'
    });
    await user1.save();
    
    user2 = new User({
      name: '사용자2',
      email: 'user2@example.com',
      password: 'password123',
      walletAddress: '0x2345678901234567890123456789012345678901',
      role: 'user'
    });
    await user2.save();
    
    // 테스트용 부동산 생성
    property = new Property({
      propertyAddress: '서울시 강남구 테스트로 123',
      propertyType: '아파트',
      squareMeters: 100,
      appraisedValue: '500000000',
      latitude: '37.5665',
      longitude: '126.9780',
      ipfsDocumentURI: 'ipfs://test',
      ownerAddress: user1.walletAddress,
      createdBy: user1._id,
      isTokenized: true,
      tokenId: 1
    });
    await property.save();
    
    // 테스트용 토큰 생성
    token = new Token({
      name: '테스트 부동산 토큰',
      symbol: 'TEST',
      propertyId: property._id,
      tokenId: 1,
      totalSupply: 1000,
      contractAddress: '0x1234567890123456789012345678901234567890',
      createdBy: user1._id,
      ownerAddress: user1.walletAddress,
      status: 'active'
    });
    await token.save();
  });
  
  test('수익 분배 생성 테스트', async () => {
    const distributionData = {
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-02-10'),
      status: 'scheduled',
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'pending'
        }
      ],
      ownershipSnapshot: {
        snapshotDate: new Date(),
        totalShares: 1000,
        ownershipDistribution: [
          {
            walletAddress: user1.walletAddress,
            shares: 800
          },
          {
            walletAddress: user2.walletAddress,
            shares: 200
          }
        ]
      }
    };
    
    const distribution = new IncomeDistribution(distributionData);
    await distribution.save();
    
    const savedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(savedDistribution).toBeTruthy();
    expect(savedDistribution.incomeType).toBe('rental');
    expect(savedDistribution.totalAmount).toBe(1000000);
    expect(savedDistribution.status).toBe('scheduled');
    expect(savedDistribution.receivers.length).toBe(2);
    expect(savedDistribution.receivers[0].shares).toBe(800);
    expect(savedDistribution.receivers[1].shares).toBe(200);
  });
  
  test('수익 분배 상태 변경 테스트', async () => {
    const distribution = new IncomeDistribution({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-02-10'),
      status: 'scheduled',
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'pending'
        }
      ]
    });
    await distribution.save();
    
    // 상태 변경: scheduled -> in_progress
    distribution.status = 'in_progress';
    await distribution.save();
    
    let updatedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(updatedDistribution.status).toBe('in_progress');
    
    // 상태 변경: in_progress -> completed
    distribution.status = 'completed';
    distribution.completedAt = new Date();
    await distribution.save();
    
    updatedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(updatedDistribution.status).toBe('completed');
    expect(updatedDistribution.completedAt).toBeDefined();
  });
  
  test('수익 분배 수령인 상태 변경 테스트', async () => {
    const distribution = new IncomeDistribution({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-02-10'),
      status: 'scheduled',
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'pending'
        }
      ]
    });
    await distribution.save();
    
    // 첫 번째 수령인 상태 변경
    distribution.receivers[0].status = 'processing';
    await distribution.save();
    
    let updatedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(updatedDistribution.receivers[0].status).toBe('processing');
    expect(updatedDistribution.receivers[1].status).toBe('pending');
    
    // 모든 수령인 상태 변경
    distribution.receivers.forEach(receiver => {
      receiver.status = 'completed';
      receiver.distributedAt = new Date();
      receiver.transactionHash = '0x' + receiver.walletAddress.substring(2, 10);
    });
    await distribution.save();
    
    updatedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(updatedDistribution.receivers[0].status).toBe('completed');
    expect(updatedDistribution.receivers[1].status).toBe('completed');
    expect(updatedDistribution.receivers[0].distributedAt).toBeDefined();
    expect(updatedDistribution.receivers[1].distributedAt).toBeDefined();
    expect(updatedDistribution.receivers[0].transactionHash).toBeDefined();
    expect(updatedDistribution.receivers[1].transactionHash).toBeDefined();
  });
  
  test('수익 분배 취소 테스트', async () => {
    const distribution = new IncomeDistribution({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-02-10'),
      status: 'scheduled',
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'pending'
        }
      ]
    });
    await distribution.save();
    
    // 분배 취소 처리
    distribution.status = 'cancelled';
    await distribution.save();
    
    const updatedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(updatedDistribution.status).toBe('cancelled');
  });
  
  test('블록체인 트랜잭션 정보 추가 테스트', async () => {
    const distribution = new IncomeDistribution({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-02-10'),
      status: 'scheduled',
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'pending'
        }
      ]
    });
    await distribution.save();
    
    // 블록체인 트랜잭션 정보 추가
    distribution.contractCallTransactionHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    await distribution.save();
    
    const updatedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(updatedDistribution.contractCallTransactionHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
  });
  
  test('수익 분배 조회 테스트', async () => {
    // 여러 수익 분배 생성
    const distribution1 = new IncomeDistribution({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-02-10'),
      status: 'completed',
      completedAt: new Date('2023-02-10'),
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'completed'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'completed'
        }
      ]
    });
    
    const distribution2 = new IncomeDistribution({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-02-01'),
        end: new Date('2023-02-28')
      },
      description: '2월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-03-10'),
      status: 'scheduled',
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'pending'
        }
      ]
    });
    
    await distribution1.save();
    await distribution2.save();
    
    // 부동산별 수익 분배 조회
    const propertyDistributions = await IncomeDistribution.find({ property: property._id });
    expect(propertyDistributions.length).toBe(2);
    
    // 상태별 수익 분배 조회
    const completedDistributions = await IncomeDistribution.find({ status: 'completed' });
    expect(completedDistributions.length).toBe(1);
    
    const scheduledDistributions = await IncomeDistribution.find({ status: 'scheduled' });
    expect(scheduledDistributions.length).toBe(1);
    
    // 사용자별 수익 분배 조회
    const user1Distributions = await IncomeDistribution.find({ 'receivers.walletAddress': user1.walletAddress });
    expect(user1Distributions.length).toBe(2);
  });
  
  test('블록체인 수익 분배 생성 테스트(모킹)', async () => {
    // 블록체인 서비스 mock 설정
    blockchainService.createIncomeDistribution.mockResolvedValue({
      success: true,
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      distributionId: 1
    });
    
    const distribution = new IncomeDistribution({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-02-10'),
      status: 'scheduled',
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'pending'
        }
      ]
    });
    await distribution.save();
    
    // 블록체인 서비스 호출 (모킹)
    const periodStart = Math.floor(new Date(distribution.period.start).getTime() / 1000);
    const periodEnd = Math.floor(new Date(distribution.period.end).getTime() / 1000);
    
    const result = await blockchainService.createIncomeDistribution(
      1, // tokenId
      '1000000', // totalAmount
      0, // incomeTypeId (rental)
      'ipfs://test',
      periodStart,
      periodEnd
    );
    
    expect(result.success).toBe(true);
    expect(result.transactionHash).toBeDefined();
    expect(blockchainService.createIncomeDistribution).toHaveBeenCalledTimes(1);
    
    // 수익 분배 정보 업데이트
    distribution.contractCallTransactionHash = result.transactionHash;
    distribution.blockchainDistributionId = 1;
    await distribution.save();
    
    const updatedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(updatedDistribution.contractCallTransactionHash).toBe(result.transactionHash);
    expect(updatedDistribution.blockchainDistributionId).toBe(1);
  });
  
  test('블록체인 수익 분배 실행 테스트(모킹)', async () => {
    // 블록체인 서비스 mock 설정
    blockchainService.executeIncomeDistribution.mockResolvedValue({
      success: true,
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    });
    
    // 블록체인 자금 입금 mock 설정
    blockchainService.depositFunds.mockResolvedValue({
      success: true,
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    });
    
    const distribution = new IncomeDistribution({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: user1._id,
      distributionDate: new Date('2023-02-10'),
      status: 'scheduled',
      blockchainDistributionId: 1,
      receivers: [
        {
          walletAddress: user1.walletAddress,
          user: user1._id,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: user2.walletAddress,
          user: user2._id,
          shares: 200,
          amount: 200000,
          status: 'pending'
        }
      ]
    });
    await distribution.save();
    
    // 블록체인 자금 입금 (모킹)
    const depositResult = await blockchainService.depositFunds('1000000');
    expect(depositResult.success).toBe(true);
    
    // 블록체인 서비스 호출 (모킹)
    const result = await blockchainService.executeIncomeDistribution(distribution.blockchainDistributionId);
    
    expect(result.success).toBe(true);
    expect(result.transactionHash).toBeDefined();
    expect(blockchainService.executeIncomeDistribution).toHaveBeenCalledTimes(1);
    
    // 수익 분배 정보 업데이트
    distribution.status = 'completed';
    distribution.contractCallTransactionHash = result.transactionHash;
    distribution.completedAt = new Date();
    
    // 수령인 상태 업데이트
    distribution.receivers.forEach(receiver => {
      receiver.status = 'completed';
      receiver.distributedAt = new Date();
    });
    
    await distribution.save();
    
    const updatedDistribution = await IncomeDistribution.findById(distribution._id);
    expect(updatedDistribution.status).toBe('completed');
    expect(updatedDistribution.contractCallTransactionHash).toBe(result.transactionHash);
    expect(updatedDistribution.completedAt).toBeDefined();
    expect(updatedDistribution.receivers[0].status).toBe('completed');
    expect(updatedDistribution.receivers[1].status).toBe('completed');
  });
}); 