const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/index');
const Property = require('../../src/models/property.model');
const PropertyValuation = require('../../src/models/property-valuation.model');
const User = require('../../src/models/user.model');
const jwt = require('jsonwebtoken');

describe('부동산 평가 API 통합 테스트', () => {
  let adminToken;
  let userToken;
  let appraiserToken;
  let adminUser;
  let regularUser;
  let appraiserUser;
  let property;
  let valuation;

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

    appraiserUser = await User.create({
      name: '평가사',
      email: 'appraiser@test.com',
      password: await bcrypt.hash('password123', 10),
      walletAddress: '0x3456789012345678901234567890123456789012',
      role: 'appraiser'
    });

    // JWT 토큰 생성
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    userToken = jwt.sign({ id: regularUser._id, role: regularUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    appraiserToken = jwt.sign({ id: appraiserUser._id, role: appraiserUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
      blockchainStatus: '등록완료'
    });

    // 테스트 평가 데이터 생성
    valuation = await PropertyValuation.create({
      property: property._id,
      valuationType: 'initial',
      currentValue: 500000000,
      methodology: 'comparative_market_analysis',
      status: 'published',
      appraiser: {
        name: appraiserUser.name,
        user: appraiserUser._id
      },
      requestedBy: regularUser._id,
      approvedBy: adminUser._id
    });
  });

  // 테스트 후 정리
  afterAll(async () => {
    await User.deleteMany({});
    await Property.deleteMany({});
    await PropertyValuation.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/valuations', () => {
    it('관리자는 모든 평가 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/valuations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
      expect(response.body.docs.length).toBeGreaterThan(0);
    });

    it('평가사는 모든 평가 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/valuations')
        .set('Authorization', `Bearer ${appraiserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
    });

    it('일반 사용자는 모든 평가 내역을 조회할 수 없어야 함', async () => {
      const response = await request(app)
        .get('/api/valuations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/valuations/property/:propertyId', () => {
    it('부동산 소유자는 자신의 부동산 평가 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/valuations/property/${property._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
      expect(response.body.docs.length).toBeGreaterThan(0);
    });

    it('관리자는 모든 부동산의 평가 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/valuations/property/${property._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.docs).toBeDefined();
    });
  });

  describe('GET /api/valuations/:id', () => {
    it('특정 평가 내역을 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get(`/api/valuations/${valuation._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(valuation._id.toString());
    });

    it('존재하지 않는 평가 내역을 조회할 수 없어야 함', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/valuations/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/valuations/request', () => {
    it('부동산 소유자는 평가를 요청할 수 있어야 함', async () => {
      const response = await request(app)
        .post('/api/valuations/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          propertyId: property._id,
          reason: '시장 가치 재평가 필요'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('성공적으로 등록');
      expect(response.body.valuationId).toBeDefined();
    });

    it('부동산 소유자가 아닌 사용자는 평가를 요청할 수 없어야 함', async () => {
      // 다른 사용자 생성
      const otherUser = await User.create({
        name: '다른사용자',
        email: 'other@test.com',
        password: await bcrypt.hash('password123', 10),
        walletAddress: '0x4567890123456789012345678901234567890123',
        role: 'user'
      });

      const otherToken = jwt.sign({ id: otherUser._id, role: otherUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .post('/api/valuations/request')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          propertyId: property._id,
          reason: '시장 가치 재평가 필요'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/valuations', () => {
    it('평가사는 새 평가를 생성할 수 있어야 함', async () => {
      const response = await request(app)
        .post('/api/valuations')
        .set('Authorization', `Bearer ${appraiserToken}`)
        .send({
          propertyId: property._id,
          currentValue: 520000000,
          methodology: 'income_approach',
          notes: '임대 수익 증가로 인한 가치 상승'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('성공적으로 등록');
    });

    it('일반 사용자는 평가를 생성할 수 없어야 함', async () => {
      const response = await request(app)
        .post('/api/valuations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          propertyId: property._id,
          currentValue: 520000000,
          methodology: 'income_approach',
          notes: '임대 수익 증가로 인한 가치 상승'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/valuations/:id/review', () => {
    it('관리자는 평가를 승인할 수 있어야 함', async () => {
      // 테스트용 평가 생성
      const testValuation = await PropertyValuation.create({
        property: property._id,
        valuationType: 'periodic',
        currentValue: 550000000,
        methodology: 'comparative_market_analysis',
        status: 'pending_review',
        appraiser: {
          name: appraiserUser.name,
          user: appraiserUser._id
        }
      });

      const response = await request(app)
        .patch(`/api/valuations/${testValuation._id}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approved: true
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('승인');
    });

    it('관리자가 아닌 사용자는 평가를 승인할 수 없어야 함', async () => {
      // 테스트용 평가 생성
      const testValuation = await PropertyValuation.create({
        property: property._id,
        valuationType: 'periodic',
        currentValue: 560000000,
        methodology: 'comparative_market_analysis',
        status: 'pending_review',
        appraiser: {
          name: appraiserUser.name,
          user: appraiserUser._id
        }
      });

      const response = await request(app)
        .patch(`/api/valuations/${testValuation._id}/review`)
        .set('Authorization', `Bearer ${appraiserToken}`)
        .send({
          approved: true
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/valuations/:id/record-on-chain', () => {
    it('관리자는 승인된 평가를 블록체인에 기록할 수 있어야 함', async () => {
      // 테스트용 승인된 평가 생성
      const testValuation = await PropertyValuation.create({
        property: property._id,
        valuationType: 'periodic',
        currentValue: 570000000,
        methodology: 'comparative_market_analysis',
        status: 'approved',
        appraiser: {
          name: appraiserUser.name,
          user: appraiserUser._id
        },
        approvedBy: adminUser._id
      });

      const response = await request(app)
        .post(`/api/valuations/${testValuation._id}/record-on-chain`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          metadataURI: 'ipfs://QmTest456'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('블록체인에 기록');
    });

    it('승인되지 않은 평가는 블록체인에 기록할 수 없어야 함', async () => {
      // 테스트용 미승인 평가 생성
      const testValuation = await PropertyValuation.create({
        property: property._id,
        valuationType: 'periodic',
        currentValue: 580000000,
        methodology: 'comparative_market_analysis',
        status: 'pending_review',
        appraiser: {
          name: appraiserUser.name,
          user: appraiserUser._id
        }
      });

      const response = await request(app)
        .post(`/api/valuations/${testValuation._id}/record-on-chain`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          metadataURI: 'ipfs://QmTest789'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/valuations/comparable-properties', () => {
    it('유사 부동산을 조회할 수 있어야 함', async () => {
      // 비교를 위한 추가 부동산 생성
      await Property.create([
        {
          propertyAddress: '서울시 강남구 유사로 1',
          propertyType: '아파트',
          squareMeters: 95,
          appraisedValue: '480000000',
          latitude: '37.5660',
          longitude: '126.9770',
          description: '유사 부동산 1',
          ipfsDocumentURI: 'ipfs://QmCompare1',
          ownerAddress: adminUser.walletAddress,
          createdBy: adminUser._id
        },
        {
          propertyAddress: '서울시 강남구 유사로 2',
          propertyType: '아파트',
          squareMeters: 105,
          appraisedValue: '520000000',
          latitude: '37.5670',
          longitude: '126.9790',
          description: '유사 부동산 2',
          ipfsDocumentURI: 'ipfs://QmCompare2',
          ownerAddress: adminUser.walletAddress,
          createdBy: adminUser._id
        }
      ]);

      const response = await request(app)
        .get('/api/valuations/comparable-properties')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          propertyId: property._id,
          limit: 5
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
}); 