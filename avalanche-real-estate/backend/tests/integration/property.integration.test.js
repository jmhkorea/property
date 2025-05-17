const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Property = require('../../src/models/property.model');
const User = require('../../src/models/user.model');

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
  await Property.deleteMany({});
  await User.deleteMany({});
});

describe('부동산 API 통합 테스트', () => {
  let user;
  let token;

  // 각 테스트 전에 사용자 생성 및 토큰 발급
  beforeEach(async () => {
    user = await User.create({
      email: 'property@example.com',
      password: 'password123',
      name: 'Property User',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    });

    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  });

  describe('GET /api/properties', () => {
    test('부동산 목록 조회 성공', async () => {
      // 테스트용 부동산 데이터 생성
      await Property.create([
        {
          owner: user._id,
          title: '서울 아파트',
          address: '서울시 강남구 테헤란로 123',
          propertyType: '아파트',
          size: 85.5,
          price: 1000000000,
          description: '강남 중심부의 현대적인 아파트',
          images: ['image1.jpg', 'image2.jpg'],
        },
        {
          owner: user._id,
          title: '부산 빌라',
          address: '부산시 해운대구 해운대로 456',
          propertyType: '빌라',
          size: 120.3,
          price: 750000000,
          description: '해운대 바다가 보이는 넓은 빌라',
          images: ['image3.jpg', 'image4.jpg'],
        },
      ]);

      const response = await request(app)
        .get('/api/properties')
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('properties');
      expect(response.body.properties).toHaveLength(2);
      expect(response.body.properties[0]).toHaveProperty('title', '서울 아파트');
      expect(response.body.properties[1]).toHaveProperty('title', '부산 빌라');
    });

    test('부동산이 없을 때 빈 배열 반환', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('properties');
      expect(response.body.properties).toHaveLength(0);
    });
  });

  describe('GET /api/properties/:id', () => {
    test('유효한 ID로 부동산 조회 성공', async () => {
      // 테스트용 부동산 데이터 생성
      const property = await Property.create({
        owner: user._id,
        title: '제주 단독주택',
        address: '제주시 애월읍 애월로 789',
        propertyType: '단독주택',
        size: 150.8,
        price: 550000000,
        description: '제주 바다가 보이는 단독주택',
        images: ['image5.jpg', 'image6.jpg'],
      });

      const response = await request(app)
        .get(`/api/properties/${property._id}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('property');
      expect(response.body.property).toHaveProperty('title', '제주 단독주택');
      expect(response.body.property).toHaveProperty('address', '제주시 애월읍 애월로 789');
      expect(response.body.property).toHaveProperty('propertyType', '단독주택');
    });

    test('존재하지 않는 ID로 부동산 조회 실패', async () => {
      const nonExistingId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/properties/${nonExistingId}`)
        .expect(404);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '부동산을 찾을 수 없습니다');
    });

    test('유효하지 않은 ID 형식으로 부동산 조회 실패', async () => {
      const response = await request(app)
        .get('/api/properties/invalid-id')
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '유효하지 않은 부동산 ID입니다');
    });
  });

  describe('POST /api/properties', () => {
    test('인증된 사용자가 부동산 등록 성공', async () => {
      const propertyData = {
        title: '인천 오피스텔',
        address: '인천시 연수구 송도동 123-456',
        propertyType: '오피스텔',
        size: 62.8,
        price: 350000000,
        description: '송도 신도시 중심부의 깨끗한 오피스텔',
        images: ['image7.jpg', 'image8.jpg'],
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send(propertyData)
        .expect(201);

      // 응답 검증
      expect(response.body).toHaveProperty('property');
      expect(response.body.property).toHaveProperty('title', '인천 오피스텔');
      expect(response.body.property).toHaveProperty('owner', user._id.toString());

      // 데이터베이스에 저장되었는지 확인
      const savedProperty = await Property.findOne({ title: '인천 오피스텔' });
      expect(savedProperty).not.toBeNull();
      expect(savedProperty.address).toBe('인천시 연수구 송도동 123-456');
    });

    test('필수 필드 누락 시 부동산 등록 실패', async () => {
      const incompleteData = {
        // title 필드 누락
        address: '경기도 성남시 분당구 456-789',
        propertyType: '아파트',
        // size 필드 누락
        price: 600000000,
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error');
    });

    test('인증 없이 부동산 등록 실패', async () => {
      const propertyData = {
        title: '인천 오피스텔',
        address: '인천시 연수구 송도동 123-456',
        propertyType: '오피스텔',
        size: 62.8,
        price: 350000000,
      };

      const response = await request(app)
        .post('/api/properties')
        .send(propertyData)
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '인증 토큰이 필요합니다');
    });
  });

  describe('PUT /api/properties/:id', () => {
    test('소유자가 부동산 정보 수정 성공', async () => {
      // 테스트용 부동산 생성
      const property = await Property.create({
        owner: user._id,
        title: '대전 아파트',
        address: '대전시 유성구 123-456',
        propertyType: '아파트',
        size: 95.5,
        price: 450000000,
        description: '대전 중심부의 넓은 아파트',
        images: ['image9.jpg', 'image10.jpg'],
      });

      const updateData = {
        title: '대전 리모델링 아파트',
        price: 480000000,
        description: '대전 중심부의 넓은 아파트, 최근 리모델링 완료',
      };

      const response = await request(app)
        .put(`/api/properties/${property._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('property');
      expect(response.body.property).toHaveProperty('title', '대전 리모델링 아파트');
      expect(response.body.property).toHaveProperty('price', 480000000);
      expect(response.body.property).toHaveProperty('description', '대전 중심부의 넓은 아파트, 최근 리모델링 완료');

      // 데이터베이스에 업데이트되었는지 확인
      const updatedProperty = await Property.findById(property._id);
      expect(updatedProperty.title).toBe('대전 리모델링 아파트');
    });

    test('다른 사용자의 부동산 정보 수정 실패', async () => {
      // 다른 사용자 생성
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
      });

      // 다른 사용자의 부동산 생성
      const property = await Property.create({
        owner: otherUser._id,
        title: '광주 주택',
        address: '광주시 서구 123-456',
        propertyType: '단독주택',
        size: 120.0,
        price: 380000000,
      });

      const updateData = {
        title: '광주 고급 주택',
        price: 400000000,
      };

      const response = await request(app)
        .put(`/api/properties/${property._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이 부동산을 수정할 권한이 없습니다');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    test('소유자가 부동산 삭제 성공', async () => {
      // 테스트용 부동산 생성
      const property = await Property.create({
        owner: user._id,
        title: '울산 아파트',
        address: '울산시 남구 123-456',
        propertyType: '아파트',
        size: 85.5,
        price: 380000000,
      });

      const response = await request(app)
        .delete(`/api/properties/${property._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('message', '부동산이 성공적으로 삭제되었습니다');

      // 데이터베이스에서 삭제되었는지 확인
      const deletedProperty = await Property.findById(property._id);
      expect(deletedProperty).toBeNull();
    });

    test('다른 사용자의 부동산 삭제 실패', async () => {
      // 다른 사용자 생성
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
      });

      // 다른 사용자의 부동산 생성
      const property = await Property.create({
        owner: otherUser._id,
        title: '세종 아파트',
        address: '세종시 어진동 123-456',
        propertyType: '아파트',
        size: 105.0,
        price: 520000000,
      });

      const response = await request(app)
        .delete(`/api/properties/${property._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이 부동산을 삭제할 권한이 없습니다');
      
      // 데이터베이스에서 삭제되지 않았는지 확인
      const notDeletedProperty = await Property.findById(property._id);
      expect(notDeletedProperty).not.toBeNull();
    });
  });

  describe('POST /api/properties/:id/tokenize', () => {
    test('부동산 소유자가 토큰화 요청 성공', async () => {
      // 테스트용 부동산 생성
      const property = await Property.create({
        owner: user._id,
        title: '강원 리조트',
        address: '강원도 평창군 123-456',
        propertyType: '리조트',
        size: 200.0,
        price: 950000000,
        isTokenized: false,
      });

      const tokenizeData = {
        totalShares: 1000,
        pricePerShare: 950000,
        minPurchase: 10,
      };

      const response = await request(app)
        .post(`/api/properties/${property._id}/tokenize`)
        .set('Authorization', `Bearer ${token}`)
        .send(tokenizeData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('property');
      expect(response.body.property).toHaveProperty('isTokenized', true);
      expect(response.body).toHaveProperty('tokenInfo');
      expect(response.body.tokenInfo).toHaveProperty('totalShares', 1000);
      expect(response.body.tokenInfo).toHaveProperty('pricePerShare', 950000);

      // 데이터베이스에 업데이트되었는지 확인
      const tokenizedProperty = await Property.findById(property._id);
      expect(tokenizedProperty.isTokenized).toBe(true);
    });

    test('이미 토큰화된 부동산 재토큰화 실패', async () => {
      // 이미 토큰화된 부동산 생성
      const property = await Property.create({
        owner: user._id,
        title: '제주 호텔',
        address: '제주도 서귀포시 123-456',
        propertyType: '상업시설',
        size: 800.0,
        price: 2500000000,
        isTokenized: true,
        tokenContractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      });

      const tokenizeData = {
        totalShares: 2500,
        pricePerShare: 1000000,
        minPurchase: 5,
      };

      const response = await request(app)
        .post(`/api/properties/${property._id}/tokenize`)
        .set('Authorization', `Bearer ${token}`)
        .send(tokenizeData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이미 토큰화된 부동산입니다');
    });

    test('타인 소유 부동산 토큰화 실패', async () => {
      // 다른 사용자 생성
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
      });

      // 다른 사용자의 부동산 생성
      const property = await Property.create({
        owner: otherUser._id,
        title: '부산 상가',
        address: '부산시 중구 123-456',
        propertyType: '상업시설',
        size: 150.0,
        price: 750000000,
        isTokenized: false,
      });

      const tokenizeData = {
        totalShares: 750,
        pricePerShare: 1000000,
        minPurchase: 10,
      };

      const response = await request(app)
        .post(`/api/properties/${property._id}/tokenize`)
        .set('Authorization', `Bearer ${token}`)
        .send(tokenizeData)
        .expect(403);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이 부동산을 토큰화할 권한이 없습니다');
    });
  });
}); 