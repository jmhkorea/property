import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropertyList from '../components/PropertyList';
import apiClient from '../services/api.service';

// 샘플 데이터 가져오기
import { properties as sampleProperties } from '../mocks/data/property.data';

// 샘플 거래 데이터
const sampleTransactions = [
  {
    _id: "tx1",
    propertyId: "prop1",
    propertyName: "강남 럭셔리 오피스 빌딩",
    amount: 5,
    price: 10000,
    timestamp: new Date().toISOString()
  },
  {
    _id: "tx2",
    propertyId: "prop2",
    propertyName: "부산 해운대 오션뷰 상업시설",
    amount: 3,
    price: 5600,
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: "tx3",
    propertyId: "prop3", 
    propertyName: "제주 리조트 단지",
    amount: 10,
    price: 28000,
    timestamp: new Date(Date.now() - 172800000).toISOString()
  }
];

// 샘플 통계 데이터
const sampleStats = {
  totalProperties: 3,
  totalVolume: 43600,
  activeInvestors: 128
};

const Home = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [latestTransactions, setLatestTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalVolume: 0,
    activeInvestors: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // GitHub Pages 환경에서는 샘플 데이터 사용
        if (window.location.hostname.includes('github.io')) {
          console.log('GitHub Pages 환경: 샘플 데이터를 사용합니다.');
          setFeaturedProperties(sampleProperties);
          setLatestTransactions(sampleTransactions);
          setStats(sampleStats);
          setLoading(false);
          return;
        }
        
        // 추천 부동산 정보 가져오기
        const propertiesRes = await apiClient.get('/properties/featured');
        setFeaturedProperties(propertiesRes.data);
        
        // 최근 거래 정보 가져오기
        const transactionsRes = await apiClient.get('/analytics/recent-transactions');
        setLatestTransactions(transactionsRes.data);
        
        // 통계 정보 가져오기
        const statsRes = await apiClient.get('/analytics/platform-stats');
        setStats(statsRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error('홈 페이지 데이터 로딩 중 오류 발생:', error);
        // API 요청 실패 시 샘플 데이터 사용
        setFeaturedProperties(sampleProperties);
        setLatestTransactions(sampleTransactions);
        setStats(sampleStats);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* 히어로 섹션 */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              부동산 투자의 미래를 <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">경험하세요</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              아발란체 블록체인을 통한 투명하고 안전한 부동산 토큰화 플랫폼으로<br />부동산 투자의 새로운 패러다임을 만나보세요.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/properties" className="bg-white text-indigo-700 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                부동산 둘러보기
              </Link>
              <Link to="/register-property" className="bg-indigo-600 bg-opacity-30 border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-50 transition duration-300 backdrop-filter backdrop-blur-sm">
                부동산 등록하기
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L48 8.875C96 17.75 192 35.5 288 37.625C384 39.75 480 26.25 576 26.25C672 26.25 768 39.75 864 48.625C960 57.5 1056 61.75 1152 57.5C1248 53.25 1344 39.75 1392 33.375L1440 27V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V0Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* 통계 섹션 */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-blue-900 font-medium">등록된 부동산</h3>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-900">{stats.totalProperties}</p>
              <p className="text-blue-700 text-sm mt-2">토큰화된 부동산 자산</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-purple-900 font-medium">총 거래 볼륨</h3>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-purple-900">{stats.totalVolume} <span className="text-sm">AVAX</span></p>
              <p className="text-purple-700 text-sm mt-2">블록체인에 기록된 거래량</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-indigo-900 font-medium">활성 투자자</h3>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-indigo-900">{stats.activeInvestors}</p>
              <p className="text-indigo-700 text-sm mt-2">블록체인 기반 부동산 투자자</p>
            </div>
          </div>
        </div>
      </div>

      {/* 추천 부동산 섹션 */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-blue-900">주목할 만한 부동산</h2>
            <Link to="/properties" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center group">
              모두 보기 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <PropertyList properties={featuredProperties} />
          )}
        </div>
      </div>

      {/* 최근 거래 섹션 */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-10">최근 거래</h2>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부동산</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래량</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {latestTransactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/property/${tx.propertyId}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                            {tx.propertyName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {tx.amount} 토큰
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{tx.price} AVAX</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 플랫폼 장점 소개 */}
      <div className="py-16 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">아발란체 부동산 토큰화의 장점</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 p-8 rounded-2xl backdrop-filter backdrop-blur-sm hover:bg-opacity-20 transition duration-300 border border-white border-opacity-20">
              <div className="h-14 w-14 rounded-full bg-blue-500 bg-opacity-30 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">빠른 거래</h3>
              <p className="text-blue-100 leading-relaxed">아발란체의 고속 처리 네트워크를 통해 즉각적인 부동산 지분 거래가 가능하며, 복잡한 절차 없이 블록체인 상에서 안전하게 거래가 이루어집니다.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-8 rounded-2xl backdrop-filter backdrop-blur-sm hover:bg-opacity-20 transition duration-300 border border-white border-opacity-20">
              <div className="h-14 w-14 rounded-full bg-purple-500 bg-opacity-30 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">안전한 소유권</h3>
              <p className="text-blue-100 leading-relaxed">블록체인에 기록된 소유권으로 투명하고 변조 불가능한 소유권 증명이 보장되며, 스마트 컨트랙트를 통한 자동화된 거래로 신뢰성을 확보합니다.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-8 rounded-2xl backdrop-filter backdrop-blur-sm hover:bg-opacity-20 transition duration-300 border border-white border-opacity-20">
              <div className="h-14 w-14 rounded-full bg-indigo-500 bg-opacity-30 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">소액 투자 가능</h3>
              <p className="text-blue-100 leading-relaxed">부동산을 작은 단위로 나누어 누구나 적은 금액으로 부동산 투자에 참여할 수 있으며, 분산 투자를 통한 리스크 관리가 가능합니다.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 뉴스레터 구독 섹션 */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">최신 부동산 토큰화 소식 받기</h2>
            <p className="text-gray-600 mb-8">새로운 토큰화 부동산 정보와 투자 기회에 대한 소식을 가장 먼저 받아보세요.</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-0 sm:justify-center">
              <input 
                type="email" 
                placeholder="이메일 주소를 입력하세요" 
                className="px-4 py-3 rounded-l-md border-2 border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-96"
              />
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-r-md font-medium hover:bg-indigo-700 transition duration-300">
                구독하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 