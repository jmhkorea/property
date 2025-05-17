const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Token = require('../../src/models/token.model');
const User = require('../../src/models/user.model');
const Property = require('../../src/models/property.model');
const Transaction = require('../../src/models/transaction.model');

// 테스트 시작 전 mongoose 연결
beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key';
  await mongoose.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// 테스트 종료 후 mongoose 연결 해제
afterAll(async () => {
  await mongoose.connection.close();
});

// 각 테스트 후 데이터베이스 초기화
afterEach(async () => {
  await Token.deleteMany({});
  await User.deleteMany({});
  await Property.deleteMany({});
  await Transaction.deleteMany({});
});

describe('토큰 API 통합 테스트', () => {
  let user;
  let token;
  let property;
  let propertyToken;

  // 각 테스트 전에 사용자, 부동산, 토큰 생성 및 JWT 토큰 발급
  beforeEach(async () => {
    // 사용자 생성
    user = await User.create({
      email: 'token@example.com',
      password: 'password123',
      name: 'Token User',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    });

    // JWT 토큰 생성
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // 부동산 생성
    property = await Property.create({
      owner: user._id,
      title: '서울 아파트',
      address: '서울시 강남구 테헤란로 123',
      propertyType: '아파트',
      size: 85.5,
      price: 1000000000,
      description: '강남 중심부의 현대적인 아파트',
      images: ['image1.jpg', 'image2.jpg'],
      isTokenized: true,
      tokenContractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    });

    // 토큰 생성
    propertyToken = await Token.create({
      property: property._id,
      contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      totalShares: 1000,
      availableShares: 1000,
      pricePerShare: 1000000,
      minPurchase: 10,
      ownerAddress: user.walletAddress,
      ownershipDistribution: [{
        address: user.walletAddress,
        shares: 1000,
      }],
      createdBy: user._id,
    });
  });

  describe('GET /api/tokens', () => {
    test('토큰 목록 조회 성공', async () => {
      // 추가 토큰 생성
      const anotherProperty = await Property.create({
        owner: user._id,
        title: '부산 빌라',
        address: '부산시 해운대구 해운대로 456',
        propertyType: '빌라',
        size: 120.3,
        price: 750000000,
        isTokenized: true,
        tokenContractAddress: '0x9876543210fedcba9876543210fedcba98765432',
      });

      await Token.create({
        property: anotherProperty._id,
        contractAddress: '0x9876543210fedcba9876543210fedcba98765432',
        totalShares: 750,
        availableShares: 750,
        pricePerShare: 1000000,
        minPurchase: 5,
        ownerAddress: user.walletAddress,
        ownershipDistribution: [{
          address: user.walletAddress,
          shares: 750,
        }],
        createdBy: user._id,
      });

      const response = await request(app)
        .get('/api/tokens')
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveLength(2);
      expect(response.body.tokens[0]).toHaveProperty('totalShares');
      expect(response.body.tokens[1]).toHaveProperty('totalShares');
    });

    test('토큰이 없을 때 빈 배열 반환', async () => {
      // 기존 토큰 삭제
      await Token.deleteMany({});

      const response = await request(app)
        .get('/api/tokens')
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveLength(0);
    });
  });

  describe('GET /api/tokens/:id', () => {
    test('유효한 ID로 토큰 조회 성공', async () => {
      const response = await request(app)
        .get(`/api/tokens/${propertyToken._id}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toHaveProperty('contractAddress', '0xabcdef1234567890abcdef1234567890abcdef12');
      expect(response.body.token).toHaveProperty('totalShares', 1000);
      expect(response.body.token).toHaveProperty('property');
    });

    test('존재하지 않는 ID로 토큰 조회 실패', async () => {
      const nonExistingId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tokens/${nonExistingId}`)
        .expect(404);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '토큰을 찾을 수 없습니다');
    });

    test('유효하지 않은 ID 형식으로 토큰 조회 실패', async () => {
      const response = await request(app)
        .get('/api/tokens/invalid-id')
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '유효하지 않은 토큰 ID입니다');
    });
  });

  describe('GET /api/tokens/user/owned', () => {
    test('사용자가 소유한 토큰 목록 조회 성공', async () => {
      const response = await request(app)
        .get('/api/tokens/user/owned')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveLength(1);
      expect(response.body.tokens[0]).toHaveProperty('contractAddress', '0xabcdef1234567890abcdef1234567890abcdef12');
    });

    test('소유한 토큰이 없을 때 빈 배열 반환', async () => {
      // 다른 사용자 생성
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      // 다른 사용자의 JWT 토큰 생성
      const otherUserToken = jwt.sign({ id: otherUser._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const response = await request(app)
        .get('/api/tokens/user/owned')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveLength(0);
    });

    test('인증 없이 소유 토큰 조회 실패', async () => {
      const response = await request(app)
        .get('/api/tokens/user/owned')
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '인증 토큰이 필요합니다');
    });
  });

  describe('POST /api/tokens/:id/fractionalize', () => {
    test('토큰 분할 요청 성공', async () => {
      // 새 부동산 생성 (토큰화되지 않은)
      const newProperty = await Property.create({
        owner: user._id,
        title: '경기 아파트',
        address: '경기도 성남시, 분당구 456-789',
        propertyType: '아파트',
        size: 105.0,
        price: 850000000,
        isTokenized: true,
        tokenContractAddress: '0x1122334455667788990011223344556677889900',
      });

      // 토큰 생성 (아직 분할되지 않은)
      const newToken = await Token.create({
        property: newProperty._id,
        contractAddress: '0x1122334455667788990011223344556677889900',
        totalShares: 1000,
        availableShares: 1000,
        pricePerShare: 850000,
        minPurchase: 1,
        ownerAddress: user.walletAddress,
        ownershipDistribution: [{
          address: user.walletAddress,
          shares: 1000,
        }],
        createdBy: user._id,
        isFractionalized: false,
      });

      const fractionalizeData = {
        fractionCount: 10000,
        pricePerFraction: 85000,
        minPurchase: 10,
      };

      const response = await request(app)
        .post(`/api/tokens/${newToken._id}/fractionalize`)
        .set('Authorization', `Bearer ${token}`)
        .send(fractionalizeData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toHaveProperty('isFractionalized', true);
      expect(response.body.token).toHaveProperty('fractionCount', 10000);
      expect(response.body.token).toHaveProperty('pricePerFraction', 85000);

      // 데이터베이스에 업데이트되었는지 확인
      const updatedToken = await Token.findById(newToken._id);
      expect(updatedToken.isFractionalized).toBe(true);
      expect(updatedToken.fractionCount).toBe(10000);
    });

    test('이미 분할된 토큰 재분할 실패', async () => {
      // propertyToken을 분할된 상태로 업데이트
      await Token.findByIdAndUpdate(propertyToken._id, {
        isFractionalized: true,
        fractionCount: 5000,
        pricePerFraction: 200000,
        minFractionPurchase: 5,
      });

      const fractionalizeData = {
        fractionCount: 10000,
        pricePerFraction: 100000,
        minPurchase: 10,
      };

      const response = await request(app)
        .post(`/api/tokens/${propertyToken._id}/fractionalize`)
        .set('Authorization', `Bearer ${token}`)
        .send(fractionalizeData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이미 분할된 토큰입니다');
    });

    test('타인 소유 토큰 분할 실패', async () => {
      // 다른 사용자 생성
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      // 다른 사용자의 JWT 토큰 생성
      const otherUserToken = jwt.sign({ id: otherUser._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const fractionalizeData = {
        fractionCount: 10000,
        pricePerFraction: 100000,
        minPurchase: 10,
      };

      const response = await request(app)
        .post(`/api/tokens/${propertyToken._id}/fractionalize`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(fractionalizeData)
        .expect(403);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이 토큰을 분할할 권한이 없습니다');
    });
  });

  describe('POST /api/tokens/:id/buy-share', () => {
    test('토큰 지분 구매 성공', async () => {
      // 다른 사용자 생성 (구매자)
      const buyer = await User.create({
        email: 'buyer@example.com',
        password: 'password123',
        name: 'Buyer User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      // 구매자의 JWT 토큰 생성
      const buyerToken = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const buyData = {
        shares: 100,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post(`/api/tokens/${propertyToken._id}/buy-share`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(buyData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction).toHaveProperty('buyer', buyer._id.toString());
      expect(response.body.transaction).toHaveProperty('seller', user._id.toString());
      expect(response.body.transaction).toHaveProperty('token', propertyToken._id.toString());
      expect(response.body.transaction).toHaveProperty('shares', 100);

      // 토큰 소유권 분포 업데이트 확인
      const updatedToken = await Token.findById(propertyToken._id);
      expect(updatedToken.availableShares).toBe(900); // 1000 - 100
      expect(updatedToken.ownershipDistribution).toHaveLength(2);
      
      // 구매자의 소유권 확인
      const buyerOwnership = updatedToken.ownershipDistribution.find(
        o => o.address === buyer.walletAddress
      );
      expect(buyerOwnership).toBeDefined();
      expect(buyerOwnership.shares).toBe(100);
      
      // 판매자의 소유권 확인
      const sellerOwnership = updatedToken.ownershipDistribution.find(
        o => o.address === user.walletAddress
      );
      expect(sellerOwnership).toBeDefined();
      expect(sellerOwnership.shares).toBe(900);
    });

    test('구매 가능한 지분보다 많은 지분 구매 실패', async () => {
      // 다른 사용자 생성 (구매자)
      const buyer = await User.create({
        email: 'buyer@example.com',
        password: 'password123',
        name: 'Buyer User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      // 구매자의 JWT 토큰 생성
      const buyerToken = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const buyData = {
        shares: 1100, // 총 지분(1000)보다 많음
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post(`/api/tokens/${propertyToken._id}/buy-share`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(buyData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '구매 가능한 지분보다 많은 지분을 요청했습니다');
    });

    test('인증 없이 지분 구매 실패', async () => {
      const buyData = {
        shares: 100,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post(`/api/tokens/${propertyToken._id}/buy-share`)
        .send(buyData)
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '인증 토큰이 필요합니다');
    });
  });

  describe('POST /api/tokens/:id/sell-share', () => {
    test('토큰 지분 판매 성공', async () => {
      // 구매자 생성 및 초기 지분 부여
      const buyer = await User.create({
        email: 'buyer@example.com',
        password: 'password123',
        name: 'Buyer User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      // 토큰 소유권 분포 업데이트
      await Token.findByIdAndUpdate(propertyToken._id, {
        availableShares: 800,
        ownershipDistribution: [
          {
            address: user.walletAddress,
            shares: 800,
          },
          {
            address: buyer.walletAddress,
            shares: 200,
          }
        ]
      });

      // 구매자의 JWT 토큰 생성
      const buyerToken = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const sellData = {
        shares: 100, // 200개 중 100개 판매
        price: 110000000, // 프리미엄 가격
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fedcba',
      };

      const response = await request(app)
        .post(`/api/tokens/${propertyToken._id}/sell-share`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(sellData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction).toHaveProperty('seller', buyer._id.toString());
      expect(response.body.transaction).toHaveProperty('token', propertyToken._id.toString());
      expect(response.body.transaction).toHaveProperty('shares', 100);
      expect(response.body.transaction).toHaveProperty('price', 110000000);

      // 토큰 소유권 분포 업데이트 확인
      const updatedToken = await Token.findById(propertyToken._id);
      expect(updatedToken.availableShares).toBe(900); // 800 + 100
      
      // 판매자의 소유권 확인
      const sellerOwnership = updatedToken.ownershipDistribution.find(
        o => o.address === buyer.walletAddress
      );
      expect(sellerOwnership).toBeDefined();
      expect(sellerOwnership.shares).toBe(100); // 200 - 100
      
      // 원래 소유자의 소유권 확인
      const ownerOwnership = updatedToken.ownershipDistribution.find(
        o => o.address === user.walletAddress
      );
      expect(ownerOwnership).toBeDefined();
      expect(ownerOwnership.shares).toBe(900); // 800 + 100
    });

    test('소유한 지분보다 많은 지분 판매 실패', async () => {
      // 구매자 생성 및 초기 지분 부여
      const buyer = await User.create({
        email: 'buyer@example.com',
        password: 'password123',
        name: 'Buyer User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      // 토큰 소유권 분포 업데이트
      await Token.findByIdAndUpdate(propertyToken._id, {
        availableShares: 800,
        ownershipDistribution: [
          {
            address: user.walletAddress,
            shares: 800,
          },
          {
            address: buyer.walletAddress,
            shares: 200,
          }
        ]
      });

      // 구매자의 JWT 토큰 생성
      const buyerToken = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const sellData = {
        shares: 300, // 소유한 지분(200)보다 많음
        price: 330000000,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fedcba',
      };

      const response = await request(app)
        .post(`/api/tokens/${propertyToken._id}/sell-share`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(sellData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '판매 가능한 지분보다 많은 지분을 판매하려고 합니다');
    });

    test('지분을 소유하지 않은 사용자의 판매 시도 실패', async () => {
      // 소유권이 없는 사용자 생성
      const nonOwner = await User.create({
        email: 'nonowner@example.com',
        password: 'password123',
        name: 'Non Owner User',
        walletAddress: '0x9988776655443322119988776655443322119988',
      });

      // 비소유자의 JWT 토큰 생성
      const nonOwnerToken = jwt.sign({ id: nonOwner._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const sellData = {
        shares: 100,
        price: 110000000,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fedcba',
      };

      const response = await request(app)
        .post(`/api/tokens/${propertyToken._id}/sell-share`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send(sellData)
        .expect(403);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이 토큰의 지분을 소유하고 있지 않습니다');
    });
  });

  describe('GET /api/tokens/:id/transactions', () => {
    test('토큰 거래 내역 조회 성공', async () => {
      // 거래 내역 생성
      const buyer = await User.create({
        email: 'buyer@example.com',
        password: 'password123',
        name: 'Buyer User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      await Transaction.create([
        {
          token: propertyToken._id,
          property: property._id,
          seller: user._id,
          buyer: buyer._id,
          shares: 50,
          price: 55000000,
          transactionHash: '0xaaaa67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          transactionType: 'PURCHASE',
          status: 'COMPLETED',
        },
        {
          token: propertyToken._id,
          property: property._id,
          seller: user._id,
          buyer: buyer._id,
          shares: 100,
          price: 110000000,
          transactionHash: '0xbbbb67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          transactionType: 'PURCHASE',
          status: 'COMPLETED',
        },
      ]);

      const response = await request(app)
        .get(`/api/tokens/${propertyToken._id}/transactions`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.transactions[0]).toHaveProperty('shares');
      expect(response.body.transactions[0]).toHaveProperty('price');
      expect(response.body.transactions[0]).toHaveProperty('status', 'COMPLETED');
    });

    test('거래 내역이 없을 때 빈 배열 반환', async () => {
      const response = await request(app)
        .get(`/api/tokens/${propertyToken._id}/transactions`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(0);
    });

    test('존재하지 않는 토큰 ID로 거래 내역 조회 실패', async () => {
      const nonExistingId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tokens/${nonExistingId}/transactions`)
        .expect(404);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '토큰을 찾을 수 없습니다');
    });
  });
}); 