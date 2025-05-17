const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
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

// 각 테스트 후 사용자 컬렉션 초기화
afterEach(async () => {
  await User.deleteMany({});
});

describe('인증 API 통합 테스트', () => {
  describe('POST /api/auth/register', () => {
    test('유효한 데이터로 회원가입 성공', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // 응답 검증
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('name', 'Test User');

      // 데이터베이스에 사용자가 생성되었는지 확인
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
      expect(user.name).toBe('Test User');
    });

    test('중복 이메일로 회원가입 실패', async () => {
      // 기존 사용자 생성
      await User.create({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      });

      const userData = {
        email: 'existing@example.com',
        password: 'newpassword',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이미 등록된 이메일입니다');
    });

    test('필수 필드 누락 시 회원가입 실패', async () => {
      const userData = {
        // email 필드 누락
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('올바른 자격 증명으로 로그인 성공', async () => {
      // 테스트용 사용자 생성
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({
        email: 'login@example.com',
        password: passwordHash,
        name: 'Login User',
      });

      const loginData = {
        email: 'login@example.com',
        password: password,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
      expect(response.body.user).toHaveProperty('name', 'Login User');
    });

    test('잘못된 비밀번호로 로그인 실패', async () => {
      // 테스트용 사용자 생성
      const passwordHash = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'login@example.com',
        password: passwordHash,
        name: 'Login User',
      });

      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이메일 또는 비밀번호가 일치하지 않습니다');
    });

    test('존재하지 않는 이메일로 로그인 실패', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이메일 또는 비밀번호가 일치하지 않습니다');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('유효한 토큰으로 프로필 조회 성공', async () => {
      // 테스트용 사용자 생성
      const user = await User.create({
        email: 'profile@example.com',
        password: 'password123',
        name: 'Profile User',
        walletAddress: '0x123456789abcdef',
      });

      // JWT 토큰 생성
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'profile@example.com');
      expect(response.body.user).toHaveProperty('name', 'Profile User');
      expect(response.body.user).toHaveProperty('walletAddress', '0x123456789abcdef');
    });

    test('인증 토큰 없이 프로필 조회 실패', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '인증 토큰이 필요합니다');
    });

    test('만료된 토큰으로 프로필 조회 실패', async () => {
      // 테스트용 사용자 생성
      const user = await User.create({
        email: 'expired@example.com',
        password: 'password123',
        name: 'Expired User',
      });

      // 만료된 JWT 토큰 생성 (expiresIn: 0)
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: 0,
      });

      // 토큰이 만료되도록 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '토큰이 만료되었습니다');
    });
  });

  describe('PUT /api/auth/connect-wallet', () => {
    test('유효한 지갑 주소 연결 성공', async () => {
      // 테스트용 사용자 생성
      const user = await User.create({
        email: 'wallet@example.com',
        password: 'password123',
        name: 'Wallet User',
      });

      // JWT 토큰 생성
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const walletData = {
        walletAddress: '0xabcdef1234567890',
      };

      const response = await request(app)
        .put('/api/auth/connect-wallet')
        .set('Authorization', `Bearer ${token}`)
        .send(walletData)
        .expect(200);

      // 응답 검증
      expect(response.body).toHaveProperty('message', '지갑 주소가 성공적으로 업데이트되었습니다');
      expect(response.body).toHaveProperty('walletAddress', '0xabcdef1234567890');

      // 데이터베이스에 사용자 정보가 업데이트되었는지 확인
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.walletAddress).toBe('0xabcdef1234567890');
    });

    test('이미 사용 중인 지갑 주소 연결 실패', async () => {
      // 이미 지갑 주소를 가진 사용자 생성
      await User.create({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        walletAddress: '0xabcdef1234567890',
      });

      // 다른 사용자 생성
      const user = await User.create({
        email: 'wallet@example.com',
        password: 'password123',
        name: 'Wallet User',
      });

      // JWT 토큰 생성
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const walletData = {
        walletAddress: '0xabcdef1234567890', // 이미 사용 중인 지갑 주소
      };

      const response = await request(app)
        .put('/api/auth/connect-wallet')
        .set('Authorization', `Bearer ${token}`)
        .send(walletData)
        .expect(400);

      // 응답 검증
      expect(response.body).toHaveProperty('error', '이미 다른 계정에 연결된 지갑 주소입니다');
    });
  });
}); 