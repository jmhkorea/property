const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const Token = require('../../src/models/token.model');
const Property = require('../../src/models/property.model');
const Share = require('../../src/models/share.model');
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
  await User.deleteMany({});
  await Property.deleteMany({});
  await Token.deleteMany({});
  await Share.deleteMany({});
  await Transaction.deleteMany({});
});

describe('지분 관리 API 통합 테스트', () => {
  let user;
  let token;
  let property;
  let propertyToken;

  // 각 테스트 전에 사용자, 부동산, 토큰 생성 및 JWT 토큰 발급
  beforeEach(async () => {
    // 사용자 생성
    user = await User.create({
      email: 'share@example.com',
      password: 'password123',
      name: 'Share User',
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
      isFractionalized: true,
      fractionCount: 10000,
      pricePerFraction: 100000,
      minFractionPurchase: 10,
    });
  });

  describe('GET /api/shares/user', () => {
    test('사용자의 지분 목록 조회 성공', async () => {
      // 사용자 지분 생성
      await Share.create({
        user: user._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 500,
        purchasePrice: 500000000,
        purchaseDate: new Date(),
        walletAddress: user.walletAddress,
      });

      const response = await request(app)
        .get('/api/shares/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('shares');
      expect(response.body.shares).toHaveLength(1);
      expect(response.body.shares[0]).toHaveProperty('shareAmount', 500);
      expect(response.body.shares[0]).toHaveProperty('property');
      expect(response.body.shares[0]).toHaveProperty('token');
    });

    test('지분이 없을 때 빈 배열 반환', async () => {
      const response = await request(app)
        .get('/api/shares/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('shares');
      expect(response.body.shares).toHaveLength(0);
    });

    test('인증 없이 지분 목록 조회 실패', async () => {
      const response = await request(app)
        .get('/api/shares/user')
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '인증 토큰이 필요합니다');
    });
  });

  describe('GET /api/shares/token/:tokenId', () => {
    test('특정 토큰의 지분 목록 조회 성공', async () => {
      // 첫 번째 사용자의 지분 생성
      await Share.create({
        user: user._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 600,
        purchasePrice: 600000000,
        purchaseDate: new Date(),
        walletAddress: user.walletAddress,
      });

      // 두 번째 사용자 생성 및 지분 생성
      const user2 = await User.create({
        email: 'share2@example.com',
        password: 'password123',
        name: 'Share User 2',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      await Share.create({
        user: user2._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 400,
        purchasePrice: 400000000,
        purchaseDate: new Date(),
        walletAddress: user2.walletAddress,
      });

      const response = await request(app)
        .get(`/api/shares/token/${propertyToken._id}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('shares');
      expect(response.body.shares).toHaveLength(2);
      expect(response.body.shares[0]).toHaveProperty('shareAmount');
      expect(response.body.shares[1]).toHaveProperty('shareAmount');
      expect(response.body.shares.map(s => s.shareAmount).reduce((a, b) => a + b)).toBe(1000);
    });

    test('지분 소유자가 없을 때 빈 배열 반환', async () => {
      const response = await request(app)
        .get(`/api/shares/token/${propertyToken._id}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('shares');
      expect(response.body.shares).toHaveLength(0);
    });

    test('존재하지 않는 토큰 ID로 지분 목록 조회 실패', async () => {
      const nonExistingId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/shares/token/${nonExistingId}`)
        .expect(404);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '토큰을 찾을 수 없습니다');
    });
  });

  describe('GET /api/shares/:id', () => {
    test('유효한 ID로 지분 조회 성공', async () => {
      // 지분 생성
      const share = await Share.create({
        user: user._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 500,
        purchasePrice: 500000000,
        purchaseDate: new Date(),
        walletAddress: user.walletAddress,
      });

      const response = await request(app)
        .get(`/api/shares/${share._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('share');
      expect(response.body.share).toHaveProperty('shareAmount', 500);
      expect(response.body.share).toHaveProperty('walletAddress', user.walletAddress);
      expect(response.body.share).toHaveProperty('property');
      expect(response.body.share).toHaveProperty('token');
    });

    test('존재하지 않는 ID로 지분 조회 실패', async () => {
      const nonExistingId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/shares/${nonExistingId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '지분을 찾을 수 없습니다');
    });

    test('다른 사용자의 지분 조회 실패', async () => {
      // 다른 사용자 생성
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      // 다른 사용자의 지분 생성
      const otherShare = await Share.create({
        user: otherUser._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 200,
        purchasePrice: 200000000,
        purchaseDate: new Date(),
        walletAddress: otherUser.walletAddress,
      });

      const response = await request(app)
        .get(`/api/shares/${otherShare._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이 지분에 접근할 권한이 없습니다');
    });
  });

  describe('POST /api/shares/transfer', () => {
    test('지분 전송 성공', async () => {
      // 지분 생성
      await Share.create({
        user: user._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 500,
        purchasePrice: 500000000,
        purchaseDate: new Date(),
        walletAddress: user.walletAddress,
      });

      // 수신자 생성
      const receiver = await User.create({
        email: 'receiver@example.com',
        password: 'password123',
        name: 'Receiver User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      const transferData = {
        tokenId: propertyToken._id,
        shareAmount: 200,
        receiverAddress: receiver.walletAddress,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post('/api/shares/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send(transferData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction).toHaveProperty('sender', user._id.toString());
      expect(response.body.transaction).toHaveProperty('receiver', receiver._id.toString());
      expect(response.body.transaction).toHaveProperty('shareAmount', 200);
      expect(response.body.transaction).toHaveProperty('transactionType', 'TRANSFER');

      // 송신자 지분 확인
      const senderShare = await Share.findOne({ user: user._id, token: propertyToken._id });
      expect(senderShare.shareAmount).toBe(300); // 500 - 200

      // 수신자 지분 확인
      const receiverShare = await Share.findOne({ user: receiver._id, token: propertyToken._id });
      expect(receiverShare).not.toBeNull();
      expect(receiverShare.shareAmount).toBe(200);
    });

    test('소유한 지분보다 많은 지분 전송 실패', async () => {
      // 지분 생성
      await Share.create({
        user: user._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 500,
        purchasePrice: 500000000,
        purchaseDate: new Date(),
        walletAddress: user.walletAddress,
      });

      // 수신자 생성
      const receiver = await User.create({
        email: 'receiver@example.com',
        password: 'password123',
        name: 'Receiver User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      const transferData = {
        tokenId: propertyToken._id,
        shareAmount: 600, // 소유한 지분(500)보다 많음
        receiverAddress: receiver.walletAddress,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post('/api/shares/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send(transferData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '전송할 지분이 충분하지 않습니다');
    });

    test('지분을 소유하지 않은 사용자의 전송 시도 실패', async () => {
      // 지분 없이 토큰만 생성

      // 수신자 생성
      const receiver = await User.create({
        email: 'receiver@example.com',
        password: 'password123',
        name: 'Receiver User',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      const transferData = {
        tokenId: propertyToken._id,
        shareAmount: 200,
        receiverAddress: receiver.walletAddress,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post('/api/shares/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send(transferData)
        .expect(404);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '지분을 찾을 수 없습니다');
    });
  });

  describe('POST /api/shares/dividend', () => {
    test('지분에 대한 배당금 지급 성공', async () => {
      // 첫 번째 사용자의 지분 생성
      await Share.create({
        user: user._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 600,
        purchasePrice: 600000000,
        purchaseDate: new Date(),
        walletAddress: user.walletAddress,
      });

      // 두 번째 사용자 생성 및 지분 생성
      const user2 = await User.create({
        email: 'share2@example.com',
        password: 'password123',
        name: 'Share User 2',
        walletAddress: '0x5432109876abcdef5432109876abcdef54321098',
      });

      await Share.create({
        user: user2._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 400,
        purchasePrice: 400000000,
        purchaseDate: new Date(),
        walletAddress: user2.walletAddress,
      });

      // 배당금 정보
      const dividendData = {
        tokenId: propertyToken._id,
        totalAmount: 10000000, // 총 1000만원 배당
        description: '2023년 1분기 임대 수익 배당',
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post('/api/shares/dividend')
        .set('Authorization', `Bearer ${token}`)
        .send(dividendData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('dividendDistribution');
      expect(response.body.dividendDistribution).toHaveProperty('totalAmount', 10000000);
      expect(response.body.dividendDistribution).toHaveProperty('distributions');
      expect(response.body.dividendDistribution.distributions).toHaveLength(2);
      
      // 배당금 분배 확인
      const firstUserDividend = response.body.dividendDistribution.distributions.find(
        d => d.walletAddress === user.walletAddress
      );
      const secondUserDividend = response.body.dividendDistribution.distributions.find(
        d => d.walletAddress === user2.walletAddress
      );
      
      expect(firstUserDividend).toBeDefined();
      expect(secondUserDividend).toBeDefined();
      expect(firstUserDividend.amount).toBe(6000000); // 60% * 1000만원
      expect(secondUserDividend.amount).toBe(4000000); // 40% * 1000만원
    });

    test('토큰 소유자가 아닌 사용자의 배당금 지급 시도 실패', async () => {
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

      // 배당금 정보
      const dividendData = {
        tokenId: propertyToken._id,
        totalAmount: 10000000,
        description: '2023년 1분기 임대 수익 배당',
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post('/api/shares/dividend')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(dividendData)
        .expect(403);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이 토큰에 대한 배당금을 지급할 권한이 없습니다');
    });

    test('지분 소유자가 없을 때 배당금 지급 실패', async () => {
      // 배당금 정보
      const dividendData = {
        tokenId: propertyToken._id,
        totalAmount: 10000000,
        description: '2023년 1분기 임대 수익 배당',
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const response = await request(app)
        .post('/api/shares/dividend')
        .set('Authorization', `Bearer ${token}`)
        .send(dividendData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '지분 소유자가 없어 배당금을 지급할 수 없습니다');
    });
  });

  describe('GET /api/shares/dividends/user', () => {
    test('사용자의 배당금 내역 조회 성공', async () => {
      // 지분 생성
      await Share.create({
        user: user._id,
        token: propertyToken._id,
        property: property._id,
        shareAmount: 500,
        purchasePrice: 500000000,
        purchaseDate: new Date(),
        walletAddress: user.walletAddress,
      });

      // 배당금 내역 생성
      await Transaction.create([
        {
          token: propertyToken._id,
          property: property._id,
          recipient: user._id,
          amount: 1000000,
          transactionHash: '0xaaaa67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          transactionType: 'DIVIDEND',
          status: 'COMPLETED',
          description: '2023년 1분기 임대 수익 배당',
        },
        {
          token: propertyToken._id,
          property: property._id,
          recipient: user._id,
          amount: 1200000,
          transactionHash: '0xbbbb67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          transactionType: 'DIVIDEND',
          status: 'COMPLETED',
          description: '2023년 2분기 임대 수익 배당',
        },
      ]);

      const response = await request(app)
        .get('/api/shares/dividends/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('dividends');
      expect(response.body.dividends).toHaveLength(2);
      expect(response.body.dividends[0]).toHaveProperty('amount');
      expect(response.body.dividends[0]).toHaveProperty('transactionType', 'DIVIDEND');
      expect(response.body.dividends[0]).toHaveProperty('property');
      expect(response.body.dividends[0]).toHaveProperty('token');
    });

    test('배당금 내역이 없을 때 빈 배열 반환', async () => {
      const response = await request(app)
        .get('/api/shares/dividends/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('dividends');
      expect(response.body.dividends).toHaveLength(0);
    });

    test('인증 없이 배당금 내역 조회 실패', async () => {
      const response = await request(app)
        .get('/api/shares/dividends/user')
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '인증 토큰이 필요합니다');
    });
  });
}); 