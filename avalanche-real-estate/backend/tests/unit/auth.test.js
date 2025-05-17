const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user.model');
const authController = require('../../src/controllers/auth.controller');

// mock 사용자 응답 객체 설정
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

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

describe('Auth Controller Unit Tests', () => {
  describe('회원가입 기능', () => {
    test('유효한 사용자 정보로 회원가입 성공', async () => {
      // 테스트용 요청 객체 설정
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
      };
      const res = mockResponse();

      // 회원가입 컨트롤러 실행
      await authController.register(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '회원가입이 완료되었습니다',
          token: expect.any(String),
          user: expect.objectContaining({
            email: 'test@example.com',
            name: 'Test User',
          }),
        })
      );

      // 데이터베이스에 사용자가 생성되었는지 확인
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
    });

    test('이미 등록된 이메일로 회원가입 실패', async () => {
      // 기존 사용자 생성
      await User.create({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      });

      // 동일한 이메일로 회원가입 시도
      const req = {
        body: {
          email: 'existing@example.com',
          password: 'newpassword',
          name: 'New User',
        },
      };
      const res = mockResponse();

      // 회원가입 컨트롤러 실행
      await authController.register(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '이미 등록된 이메일입니다',
        })
      );
    });
  });

  describe('로그인 기능', () => {
    test('올바른 자격 증명으로 로그인 성공', async () => {
      // 테스트용 사용자 생성
      const passwordHash = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'login@example.com',
        password: passwordHash,
        name: 'Login User',
      });

      // 로그인 요청 객체 설정
      const req = {
        body: {
          email: 'login@example.com',
          password: 'password123',
        },
      };
      const res = mockResponse();

      // 로그인 컨트롤러 실행
      await authController.login(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '로그인이 성공적으로 완료되었습니다',
          token: expect.any(String),
        })
      );
    });

    test('잘못된 비밀번호로 로그인 실패', async () => {
      // 테스트용 사용자 생성
      const passwordHash = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'login@example.com',
        password: passwordHash,
        name: 'Login User',
      });

      // 잘못된 비밀번호로 로그인 시도
      const req = {
        body: {
          email: 'login@example.com',
          password: 'wrongpassword',
        },
      };
      const res = mockResponse();

      // 로그인 컨트롤러 실행
      await authController.login(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '이메일 또는 비밀번호가 일치하지 않습니다',
        })
      );
    });

    test('존재하지 않는 이메일로 로그인 실패', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      };
      const res = mockResponse();

      // 로그인 컨트롤러 실행
      await authController.login(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '이메일 또는 비밀번호가 일치하지 않습니다',
        })
      );
    });
  });

  describe('사용자 프로필 조회', () => {
    test('유효한 토큰으로 프로필 조회 성공', async () => {
      // 테스트용 사용자 생성
      const user = await User.create({
        email: 'profile@example.com',
        password: 'password123',
        name: 'Profile User',
        walletAddress: '0x123456789abcdef',
      });

      // 요청 객체 설정 (미들웨어를 통과한 후의 상태를 시뮬레이션)
      const req = {
        user,
      };
      const res = mockResponse();

      // 프로필 조회 컨트롤러 실행
      await authController.getProfile(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: 'profile@example.com',
            name: 'Profile User',
            walletAddress: '0x123456789abcdef',
          }),
        })
      );
    });
  });
}); 