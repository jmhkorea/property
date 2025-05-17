import axios from 'axios';
import authService from './auth.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 인증 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 부동산 관련 API
const propertyAPI = {
  // 전체 부동산 목록 조회
  getAllProperties: () => apiClient.get('/properties'),
  
  // 부동산 상세 조회
  getProperty: (id) => apiClient.get(`/properties/${id}`),
  
  // 부동산 등록
  createProperty: (propertyData) => apiClient.post('/properties', propertyData),
  
  // 부동산 정보 수정
  updateProperty: (id, propertyData) => apiClient.put(`/properties/${id}`, propertyData),
  
  // 부동산 삭제
  deleteProperty: (id) => apiClient.delete(`/properties/${id}`),
  
  // 부동산 토큰화
  tokenizeProperty: (id, tokenData) => apiClient.post(`/properties/${id}/tokenize`, tokenData),
};

// 지분 관련 API
const shareAPI = {
  // 전체 지분 목록 조회
  getAllShares: () => apiClient.get('/shares'),
  
  // 지분 상세 조회
  getShare: (id) => apiClient.get(`/shares/${id}`),
  
  // 지분 구매
  purchaseShare: (purchaseData) => apiClient.post('/shares/purchase', purchaseData),
  
  // 사용자 보유 지분 조회
  getUserShares: () => apiClient.get('/shares/user/owned'),
  
  // 특정 부동산의 지분 목록 조회
  getSharesByProperty: (propertyId) => apiClient.get(`/shares/property/${propertyId}`),
};

// 토큰 관련 API
const tokenAPI = {
  // 전체 토큰 목록 조회
  getAllTokens: () => apiClient.get('/tokens'),
  
  // 토큰 상세 조회
  getToken: (id) => apiClient.get(`/tokens/${id}`),
  
  // 사용자 보유 토큰 조회
  getUserTokens: () => apiClient.get('/tokens/user/owned'),
  
  // 토큰 지분 구매
  buyTokenShare: (id, buyData) => apiClient.post(`/tokens/${id}/buy-share`, buyData),
  
  // 토큰 지분 판매
  sellTokenShare: (id, sellData) => apiClient.post(`/tokens/${id}/sell-share`, sellData),
  
  // 토큰 거래 내역 조회
  getTokenTransactions: (id) => apiClient.get(`/tokens/${id}/transactions`),
};

// 분석 관련 API
const analyticsAPI = {
  // 플랫폼 통계 조회
  getPlatformStats: () => apiClient.get('/analytics/platform-stats'),
  
  // 부동산 유형별 통계
  getPropertyTypeStats: () => apiClient.get('/analytics/property-types'),
  
  // 거래 트렌드 분석
  getTransactionTrends: (period = 'monthly') => 
    apiClient.get(`/analytics/transaction-trends?period=${period}`),
  
  // 사용자 투자 성과 분석
  getUserInvestmentPerformance: () => apiClient.get('/analytics/user/investment-performance'),
  
  // 지역별 부동산 시장 분석
  getRegionalMarketAnalysis: () => apiClient.get('/analytics/regional-market'),
};

// 알림 관련 API
const notificationAPI = {
  // 사용자 알림 조회
  getUserNotifications: (page = 1, limit = 10, unreadOnly = false) => 
    apiClient.get(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`),
  
  // 알림 읽음 표시
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  
  // 모든 알림 읽음 표시
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  
  // 알림 삭제
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
  
  // 모든 알림 삭제
  deleteAllNotifications: () => apiClient.delete('/notifications'),
};

// 검색 관련 API
const searchAPI = {
  // 통합 검색
  globalSearch: (query, type) => 
    apiClient.get(`/search/global?query=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`),
  
  // 부동산 고급 검색
  advancedPropertySearch: (searchParams) => 
    apiClient.get('/search/properties/advanced', { params: searchParams }),
  
  // 위치 기반 부동산 검색
  searchPropertiesByLocation: (lat, lng, radius) => 
    apiClient.get(`/search/properties/location?lat=${lat}&lng=${lng}${radius ? `&radius=${radius}` : ''}`),
};

// 모든 API 서비스 내보내기
export {
  propertyAPI,
  shareAPI,
  tokenAPI,
  analyticsAPI,
  notificationAPI,
  searchAPI,
};

export default apiClient; 