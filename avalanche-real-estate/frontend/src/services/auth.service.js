import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';

// axios 인스턴스 생성 (인증 토큰 제외)
const authClient = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 회원가입 요청
 * @param {Object} userData - 사용자 등록 정보 객체
 * @returns {Promise} - 회원가입 요청 결과
 */
const register = async (userData) => {
  try {
    const response = await authClient.post('/register', userData);
    if (response.data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || '회원가입 중 오류가 발생했습니다.';
  }
};

/**
 * 로그인 요청
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise} - 로그인 요청 결과
 */
const login = async (email, password) => {
  try {
    const response = await authClient.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || '로그인 중 오류가 발생했습니다.';
  }
};

/**
 * 로그아웃
 */
const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};

/**
 * 현재 저장된 인증 토큰 반환
 * @returns {string|null} - 저장된 인증 토큰 또는 null
 */
const getToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * 저장된 사용자 정보 반환
 * @returns {Object|null} - 저장된 사용자 정보 객체 또는 null
 */
const getCurrentUser = () => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * 사용자 인증 여부 확인
 * @returns {boolean} - 인증된 사용자인지 여부
 */
const isAuthenticated = () => {
  const token = getToken();
  
  if (!token) {
    return false;
  }
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // 토큰이 만료되었는지 확인
    if (decoded.exp < currentTime) {
      logout(); // 만료된 토큰 제거
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 사용자 프로필 정보 조회
 * @returns {Promise} - 프로필 조회 요청 결과
 */
const getProfile = async () => {
  const token = getToken();
  
  if (!token) {
    throw new Error('인증 토큰이 없습니다.');
  }
  
  try {
    const response = await authClient.get('/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 사용자 정보 업데이트
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.user));
    
    return response.data.user;
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    }
    throw error.response?.data?.error || '프로필 조회 중 오류가 발생했습니다.';
  }
};

/**
 * 비밀번호 변경
 * @param {string} currentPassword - 현재 비밀번호
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise} - 비밀번호 변경 요청 결과
 */
const changePassword = async (currentPassword, newPassword) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('인증 토큰이 없습니다.');
  }
  
  try {
    const response = await authClient.put('/change-password', 
      { currentPassword, newPassword },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || '비밀번호 변경 중 오류가 발생했습니다.';
  }
};

/**
 * 지갑 주소 연결
 * @param {string} walletAddress - 연결할 지갑 주소
 * @returns {Promise} - 지갑 연결 요청 결과
 */
const connectWallet = async (walletAddress) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('인증 토큰이 없습니다.');
  }
  
  try {
    const response = await authClient.put('/connect-wallet', 
      { walletAddress },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // 사용자 정보 업데이트
    const currentUser = getCurrentUser();
    if (currentUser) {
      currentUser.walletAddress = walletAddress;
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(currentUser));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || '지갑 연결 중 오류가 발생했습니다.';
  }
};

// 인증 서비스 내보내기
const authService = {
  register,
  login,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated,
  getProfile,
  changePassword,
  connectWallet,
};

export default authService; 