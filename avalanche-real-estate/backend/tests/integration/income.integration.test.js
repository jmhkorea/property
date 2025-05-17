const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/index');
const Property = require('../../src/models/property.model');
const IncomeDistribution = require('../../src/models/income-distribution.model');
const User = require('../../src/models/user.model');
const Token = require('../../src/models/token.model');
const jwt = require('jsonwebtoken');

describe('수익 분배 API 통합 테스트', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let property;
  let token;
  let incomeDistribution;

  // 테스트 전 설정
  beforeAll(async () => {
    // 테스트 사용자 생성
    adminUser = await User.create({
      name: '관리자',
      email: 'admin@test.com',
      password: await bcrypt.hash('password123', 10),
      walletAddress: '0x1234567890123456789012345678901234567890',
      role: 'admin'
    });

    regularUser = await User.create({
      name: '일반사용자',
      email: 'user@test.com',
      password: await bcrypt.hash('password123', 10),
      walletAddress: '0x2345678901234567890123456789012345678901',
      role: 'user'
    });

    // JWT 토큰 생성
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    userToken = jwt.sign({ id: regularUser._id, role: regularUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 테스트 부동산 생성
    property = await Property.create({
      propertyAddress: '서울시 강남구 테스트로 123',
      propertyType: '아파트',
      squareMeters: 100,
      appraisedValue: '500000000',
      latitude: '37.5665',
      longitude: '126.9780',
      description: '테스트용 부동산입니다.',
      ipfsDocumentURI: 'ipfs://QmTest123',
      ownerAddress: regularUser.walletAddress,
      createdBy: regularUser._id,
      isTokenized: true,
      blockchainStatus: '토큰화완료',
      tokenId: 1
    });

    // 테스트 토큰 생성
    token = await Token.create({
      name: '테스트 부동산 토큰',
      symbol: 'TEST',
      propertyId: property._id,
      tokenId: 1,
      totalSupply: 1000,
      contractAddress: '0x1234567890123456789012345678901234567890',
      createdBy: regularUser._id,
      status: 'active'
    });

    // 테스트 수익 분배 생성
    incomeDistribution = await IncomeDistribution.create({
      property: property._id,
      token: token._id,
      incomeType: 'rental',
      totalAmount: 1000000,
      period: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      },
      description: '1월 임대료',
      createdBy: regularUser._id,
      distributionDate: new Date('2023-02-10'),
      status: 'scheduled',
      receivers: [
        {
          walletAddress: regularUser.walletAddress,
          shares: 800,
          amount: 800000,
          status: 'pending'
        },
        {
          walletAddress: adminUser.walletAddress,
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
            walletAddress: regularUser.walletAddress,
            shares: 800
          },
          {
            walletAddress: adminUser.walletAddress,
            shares: 200
          }
        ]
      }
    });
  });

  // 테스트 후 정리
  afterAll(async () => {
    await User.deleteMany({});
    await Property.deleteMany({});
    await Token.deleteMany({});
    await IncomeDistribution.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/incomes', () => {
    it('관리자는 모든 수익 분배 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/incomes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
      expect(response.body.docs.length).toBeGreaterThan(0);
    });

    it('일반 사용자는 모든 수익 분배 내역을 조회할 수 없어야 함', async () => {
      const response = await request(app)
        .get('/api/incomes')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/incomes/property/:propertyId', () => {
    it('부동산 소유자는 자신의 부동산 수익 분배 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/incomes/property/${property._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
      expect(response.body.docs.length).toBeGreaterThan(0);
    });

    it('관리자는 모든 부동산의 수익 분배 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/incomes/property/${property._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
    });
  });

  describe('GET /api/incomes/token/:tokenId', () => {
    it('토큰 관련 수익 분배 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/incomes/token/${token._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
      expect(response.body.docs.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/incomes/user', () => {
    it('사용자는 자신의 수익 분배 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/incomes/user')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
      expect(response.body.docs.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/incomes/:id', () => {
    it('특정 수익 분배 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/incomes/${incomeDistribution._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(incomeDistribution._id.toString());
    });

    it('존재하지 않는 수익 분배 내역을 조회할 수 없어야 함', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/incomes/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/incomes', () => {
    it('부동산 소유자는 새 수익을 등록할 수 있어야 함', async () => {
      const response = await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          propertyId: property._id,
          tokenId: token._id,
          incomeType: 'rental',
          totalAmount: 1200000,
          period: {
            start: '2023-02-01',
            end: '2023-02-28'
          },
          description: '2월 임대료',
          distributionDate: '2023-03-10'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('성공적으로 등록');
      expect(response.body.distributionId).toBeDefined();
    });

    it('부동산 소유자가 아닌 사용자는 수익을 등록할 수 없어야 함', async () => {
      // 다른 사용자 생성
      const otherUser = await User.create({
        name: '다른사용자',
        email: 'other@test.com',
        password: await bcrypt.hash('password123', 10),
        walletAddress: '0x3456789012345678901234567890123456789012',
        role: 'user'
      });

      const otherToken = jwt.sign({ id: otherUser._id, role: otherUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          propertyId: property._id,
          tokenId: token._id,
          incomeType: 'rental',
          totalAmount: 1200000,
          period: {
            start: '2023-02-01',
            end: '2023-02-28'
          },
          description: '2월 임대료',
          distributionDate: '2023-03-10'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/incomes/:id/snapshot', () => {
    it('부동산 소유자는 소유권 스냅샷을 생성할 수 있어야 함', async () => {
      // 테스트용 수익 분배 생성
      const testIncomeDistribution = await IncomeDistribution.create({
        property: property._id,
        token: token._id,
        incomeType: 'rental',
        totalAmount: 1300000,
        period: {
          start: new Date('2023-03-01'),
          end: new Date('2023-03-31')
        },
        description: '3월 임대료',
        createdBy: regularUser._id,
        distributionDate: new Date('2023-04-10'),
        status: 'scheduled'
      });

      const response = await request(app)
        .post(`/api/incomes/${testIncomeDistribution._id}/snapshot`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ownershipData: {
            totalShares: 1000,
            ownershipDistribution: [
              {
                walletAddress: regularUser.walletAddress,
                shares: 800
              },
              {
                walletAddress: adminUser.walletAddress,
                shares: 200
              }
            ]
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('소유권 스냅샷이 생성');
      expect(response.body.receivers).toBe(2);
    });
  });

  describe('POST /api/incomes/:id/distribute', () => {
    it('부동산 소유자는 수익 분배를 시작할 수 있어야 함', async () => {
      const response = await request(app)
        .post(`/api/incomes/${incomeDistribution._id}/distribute`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('수익 분배가 시작');
    });
  });

  describe('GET /api/incomes/:id/status', () => {
    it('수익 분배 상태를 확인할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/incomes/${incomeDistribution._id}/status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.stats).toBeDefined();
    });
  });

  describe('POST /api/incomes/:id/complete', () => {
    it('관리자는 수익 분배를 수동으로 완료할 수 있어야 함', async () => {
      const response = await request(app)
        .post(`/api/incomes/${incomeDistribution._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('수익 분배가 완료');
    });

    it('일반 사용자는 수익 분배를 수동으로 완료할 수 없어야 함', async () => {
      // 테스트용 수익 분배 생성
      const testIncomeDistribution = await IncomeDistribution.create({
        property: property._id,
        token: token._id,
        incomeType: 'rental',
        totalAmount: 1400000,
        period: {
          start: new Date('2023-04-01'),
          end: new Date('2023-04-30')
        },
        description: '4월 임대료',
        createdBy: regularUser._id,
        distributionDate: new Date('2023-05-10'),
        status: 'in_progress'
      });

      const response = await request(app)
        .post(`/api/incomes/${testIncomeDistribution._id}/complete`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/incomes/schedule', () => {
    it('부동산 소유자는 수익 분배를 예약할 수 있어야 함', async () => {
      const response = await request(app)
        .post('/api/incomes/schedule')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          propertyId: property._id,
          tokenId: token._id,
          incomeType: 'rental',
          totalAmount: 1500000,
          period: {
            start: '2023-05-01',
            end: '2023-05-31'
          },
          description: '5월 임대료',
          distributionDate: '2023-06-10'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('예약');
      expect(response.body.distributionId).toBeDefined();
      expect(response.body.scheduledDate).toBeDefined();
    });
  });

  describe('GET /api/incomes/scheduled', () => {
    it('관리자는 예정된 분배 목록을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/incomes/scheduled')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
    });
  });
}); 