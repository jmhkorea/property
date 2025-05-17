import { http, HttpResponse } from 'msw';
import { users, roles, tokens as authTokens } from '../data/auth.data';

// 서버와 동일한 로직 처리를 위한 유틸리티 함수
let nextId = {
  user: users.length + 1,
  token: authTokens.length + 1
};

const generateId = (type) => `${type}${nextId[type]++}`;

// 간단한 비밀번호 검증 (실제로는 bcrypt 등으로 암호화된 비밀번호를 검증해야 함)
const checkPassword = (inputPassword, hashedPassword) => {
  // 단순화를 위해 "admin123", "investor123", "investor456", "manager789" 패스워드만 허용
  return (
    (inputPassword === "admin123" && hashedPassword === "$2a$10$cXGMFf1mXaXKnQckSZPq8.1KJt0tYAYVOuDn3JpNKjfgqh9zOC2/2") ||
    (inputPassword === "investor123" && hashedPassword === "$2a$10$HPDvqUhZ.kp/qAeNsZ6JTOEmzRKsNTYUK/1JE4OuY9JcJQwW8kYki") ||
    (inputPassword === "investor456" && hashedPassword === "$2a$10$TS9Nw2PHpYYaNLjfF/RjbezzGYf8G8FVwBwCZxfDk9k7PH.u2qp52") ||
    (inputPassword === "manager789" && hashedPassword === "$2a$10$DyyCXf5X8a3uF5MUEuJlquGxvnBBB1yK7K6b0nPZRRnRQM9uvTJKa")
  );
};

// 토큰 생성 (실제로는 JWT 등을 사용해 생성)
const generateTokens = (user) => {
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(now.getDate() + 7); // 7일 후 만료

  // 실제로는 유저 정보와 권한 등을 기반으로 JWT 토큰을 생성해야 함
  // 여기서는 간단하게 모킹
  const accessToken = `msw_access_token_${user._id}_${now.getTime()}`;
  const refreshToken = `msw_refresh_token_${user._id}_${now.getTime()}`;

  const tokenObj = {
    _id: generateId('token'),
    accessToken,
    refreshToken,
    userId: user._id,
    expiresAt: expiresAt.toISOString()
  };

  authTokens.push(tokenObj);

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toISOString()
  };
};

export const authHandlers = [
  // 로그인
  http.post('/api/auth/login', async ({ request }) => {
    const { usernameOrEmail, password } = await request.json();
    
    // 이메일 또는 사용자명으로 사용자 찾기
    const user = users.find(
      u => u.email === usernameOrEmail || u.username === usernameOrEmail
    );
    
    if (!user) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 비밀번호 검증
    if (!checkPassword(password, user.password)) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '잘못된 비밀번호입니다.'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 토큰 생성
    const tokens = generateTokens(user);
    
    // 민감한 정보 제외
    const safeUser = { ...user };
    delete safeUser.password;
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: {
          user: safeUser,
          tokens
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 회원가입
  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json();
    
    // 이메일 또는 사용자명 중복 체크
    const userExists = users.some(
      u => u.email === userData.email || u.username === userData.username
    );
    
    if (userExists) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '이미 사용 중인 이메일 또는 사용자명입니다.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 새 사용자 생성
    const now = new Date().toISOString();
    
    const newUser = {
      _id: generateId('user'),
      ...userData,
      role: userData.role || 'investor', // 기본 역할은
      tokenBalance: [],
      createdAt: now,
      updatedAt: now
    };
    
    users.push(newUser);
    
    // 토큰 생성
    const tokens = generateTokens(newUser);
    
    // 민감한 정보 제외
    const safeUser = { ...newUser };
    delete safeUser.password;
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: {
          user: safeUser,
          tokens
        }
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 로그아웃
  http.post('/api/auth/logout', () => {
    return new HttpResponse(
      JSON.stringify({
        success: true,
        message: '성공적으로 로그아웃되었습니다.'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 현재 로그인된 사용자 정보 조회
  http.get('/api/auth/me', (req, res, ctx) => {
    // 인증 헤더에서 토큰 추출
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: '인증이 필요합니다.'
        })
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰으로 사용자 찾기
    const authToken = authTokens.find(t => t.accessToken === token);
    
    if (!authToken) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: '유효하지 않은 토큰입니다.'
        })
      );
    }
    
    // 토큰 만료 확인
    if (new Date(authToken.expiresAt) < new Date()) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: '토큰이 만료되었습니다.'
        })
      );
    }
    
    // 사용자 찾기
    const user = users.find(u => u._id === authToken.userId);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        })
      );
    }
    
    // 민감한 정보 제외
    const safeUser = { ...user };
    delete safeUser.password;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: safeUser
      })
    );
  }),
  
  // 토큰 갱신
  http.post('/api/auth/refresh-token', async (req, res, ctx) => {
    const { refreshToken } = await req.json();
    
    // 리프레시 토큰으로 인증 토큰 찾기
    const authToken = authTokens.find(t => t.refreshToken === refreshToken);
    
    if (!authToken) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: '유효하지 않은 리프레시 토큰입니다.'
        })
      );
    }
    
    // 사용자 찾기
    const user = users.find(u => u._id === authToken.userId);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        })
      );
    }
    
    // 새 토큰 생성
    const newTokens = generateTokens(user);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: newTokens
      })
    );
  }),
  
  // 사용자 정보 업데이트
  http.put('/api/users/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const userData = await req.json();
    
    const index = users.findIndex(u => u._id === id);
    
    if (index === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        })
      );
    }
    
    // 수정된 사용자 정보
    const updatedUser = {
      ...users[index],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    // 비밀번호가 있으면 원래 비밀번호로 유지
    if (!userData.password) {
      updatedUser.password = users[index].password;
    }
    
    users[index] = updatedUser;
    
    // 민감한 정보 제외
    const safeUser = { ...updatedUser };
    delete safeUser.password;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: safeUser
      })
    );
  }),
  
  // 사용자 권한 및 기능 조회
  http.get('/api/auth/permissions', (req, res, ctx) => {
    // 인증 헤더에서 토큰 추출
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: '인증이 필요합니다.'
        })
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰으로 사용자 찾기
    const authToken = authTokens.find(t => t.accessToken === token);
    
    if (!authToken) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: '유효하지 않은 토큰입니다.'
        })
      );
    }
    
    // 사용자 찾기
    const user = users.find(u => u._id === authToken.userId);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        })
      );
    }
    
    // 사용자 역할 찾기
    const role = roles.find(r => r.name === user.role);
    
    if (!role) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '역할을 찾을 수 없습니다.'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          role: role.name,
          permissions: role.permissions
        }
      })
    );
  }),
  
  // 사용자 토큰 잔액 조회
  http.get('/api/users/:id/tokens', (req, res, ctx) => {
    const { id } = req.params;
    
    const user = users.find(u => u._id === id);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: user.tokenBalance
      })
    );
  }),
  
  // 비밀번호 변경
  http.post('/api/auth/change-password', async (req, res, ctx) => {
    const { userId, currentPassword, newPassword } = await req.json();
    
    const userIndex = users.findIndex(u => u._id === userId);
    
    if (userIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        })
      );
    }
    
    // 현재 비밀번호 검증
    if (!checkPassword(currentPassword, users[userIndex].password)) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: '현재 비밀번호가 일치하지 않습니다.'
        })
      );
    }
    
    // 비밀번호 업데이트 (실제로는 해싱 처리 필요)
    users[userIndex].password = `new_hashed_${newPassword}`;
    users[userIndex].updatedAt = new Date().toISOString();
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.'
      })
    );
  }),
  
  // 비밀번호 재설정 요청
  http.post('/api/auth/forgot-password', async (req, res, ctx) => {
    const { email } = await req.json();
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '해당 이메일로 등록된 사용자를 찾을 수 없습니다.'
        })
      );
    }
    
    // 실제 구현에서는 이메일로 비밀번호 재설정 링크 전송
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
        // 모킹을 위한 테스트 코드
        resetToken: `reset_token_${user._id}_${new Date().getTime()}`
      })
    );
  }),
  
  // 비밀번호 재설정
  http.post('/api/auth/reset-password', async (req, res, ctx) => {
    const { resetToken, newPassword } = await req.json();
    
    // 간단한 모킹을 위해 리셋 토큰에서 사용자 ID 추출
    // 실제로는 DB에 저장된 유효한 리셋 토큰을 검증해야 함
    const tokenParts = resetToken.split('_');
    
    if (tokenParts.length < 3 || tokenParts[0] !== 'reset' || tokenParts[1] !== 'token') {
      return res(
        ctx.status(400),
        ctx.json({
          success: false,
          message: '유효하지 않은 재설정 토큰입니다.'
        })
      );
    }
    
    const userId = tokenParts[2];
    const userIndex = users.findIndex(u => u._id === userId);
    
    if (userIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        })
      );
    }
    
    // 비밀번호 업데이트 (실제로는 해싱 처리 필요)
    users[userIndex].password = `new_hashed_${newPassword}`;
    users[userIndex].updatedAt = new Date().toISOString();
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: '비밀번호가 성공적으로 재설정되었습니다.'
      })
    );
  })
]; 