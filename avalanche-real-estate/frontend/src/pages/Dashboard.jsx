import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext.jsx';
import { propertyAPI, shareAPI, tokenAPI, analyticsAPI } from '../services/api.service';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { account } = useWallet();
  
  const [loading, setLoading] = useState(true);
  const [userProperties, setUserProperties] = useState([]);
  const [userShares, setUserShares] = useState([]);
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalEarnings: 0,
    expectedAnnualReturn: 0,
    propertiesOwned: 0,
    sharesOwned: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, account]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 사용자 소유 부동산 조회
      const userPropertiesRes = await propertyAPI.getUserProperties();
      setUserProperties(userPropertiesRes.data);
      
      // 사용자 보유 지분 조회
      const userSharesRes = await shareAPI.getUserShares();
      setUserShares(userSharesRes.data);
      
      // 사용자 투자 성과 조회
      const performanceRes = await analyticsAPI.getUserInvestmentPerformance();
      setStats({
        totalInvested: performanceRes.data.totalInvested,
        totalEarnings: performanceRes.data.totalEarnings,
        expectedAnnualReturn: performanceRes.data.expectedAnnualReturn,
        propertiesOwned: userPropertiesRes.data.length,
        sharesOwned: userSharesRes.data.length
      });
      
      // 최근 거래 내역 조회
      const transactionsRes = await tokenAPI.getUserTransactions();
      setRecentTransactions(transactionsRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('대시보드 데이터 로딩 중 오류 발생:', error);
      setLoading(false);
    }
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'AVAX',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price).replace('AVAX', '') + ' AVAX';
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 통계 카드 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">투자 개요</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">총 투자 금액</span>
                  <span className="font-bold">{formatPrice(stats.totalInvested)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">총 수익</span>
                  <span className="font-bold text-green-600">{formatPrice(stats.totalEarnings)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">예상 연간 수익률</span>
                  <span className="font-bold text-green-600">{stats.expectedAnnualReturn}%</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">보유 부동산</span>
                  <span className="font-bold">{stats.propertiesOwned}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">보유 지분</span>
                  <span className="font-bold">{stats.sharesOwned}개</span>
                </div>
              </div>
            </div>
            
            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction._id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{transaction.type === 'buy' ? '지분 구매' : '지분 판매'}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.propertyName} - {transaction.amount} 지분
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.type === 'buy' ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.type === 'buy' ? '-' : '+'}{formatPrice(transaction.total)}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">최근 활동이 없습니다.</p>
              )}
              
              {recentTransactions.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    모든 거래 내역 보기
                  </button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'properties':
        return (
          <div className="bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold p-6 border-b">내 부동산</h3>
            {userProperties.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부동산</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주소</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">토큰화 상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userProperties.map((property) => (
                      <tr key={property._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={property.imageUrl || 'https://via.placeholder.com/100?text=Property'}
                                alt={property.title}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {property.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {property.propertyType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {property.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(property.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {property.isTokenized ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              토큰화됨
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              미토큰화
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(property.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link to={`/property/${property._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                            보기
                          </Link>
                          {!property.isTokenized && (
                            <Link to={`/tokenize-property/${property._id}`} className="text-indigo-600 hover:text-indigo-900">
                              토큰화
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">등록한 부동산이 없습니다.</p>
                <Link
                  to="/register-property"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  부동산 등록하기
                </Link>
              </div>
            )}
          </div>
        );
        
      case 'shares':
        return (
          <div className="bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold p-6 border-b">내 지분</h3>
            {userShares.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부동산</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보유 지분</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지분당 가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 투자액</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예상 수익률</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userShares.map((share) => (
                      <tr key={share._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={share.property.imageUrl || 'https://via.placeholder.com/100?text=Property'}
                                alt={share.property.title}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {share.property.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {share.property.location}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {share.amount} / {share.totalShares}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(share.pricePerShare)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(share.amount * share.pricePerShare)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {share.expectedYield}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link to={`/property/${share.property._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                            부동산 보기
                          </Link>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            판매
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">보유한 지분이 없습니다.</p>
                <Link
                  to="/properties"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  부동산 둘러보기
                </Link>
              </div>
            )}
          </div>
        );
        
      case 'transactions':
        return (
          <div className="bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold p-6 border-b">거래 내역</h3>
            {recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부동산</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총액</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === 'buy'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type === 'buy' ? '구매' : '판매'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.propertyName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.amount} 지분
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(transaction.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.type === 'buy' ? 'text-red-600' : 'text-green-600'}>
                            {transaction.type === 'buy' ? '-' : '+'}{formatPrice(transaction.total)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            완료
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">거래 내역이 없습니다.</p>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-600">안녕하세요, {user?.name}님! 투자 현황을 확인하세요.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Link
            to="/register-property"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            부동산 등록
          </Link>
          <Link
            to="/properties"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            투자하기
          </Link>
        </div>
      </div>
      
      {/* 지갑 정보 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">지갑 정보</h2>
            {account ? (
              <>
                <p className="mb-1 text-indigo-100">연결된 지갑: {account}</p>
                <p className="text-sm text-indigo-200">아발란체 퓨지 테스트넷에 연결됨</p>
              </>
            ) : (
              <p className="text-indigo-100">지갑이 연결되어 있지 않습니다.</p>
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-2xl font-bold">{formatPrice(stats.totalInvested)}</div>
            <p className="text-indigo-200">총 투자액</p>
          </div>
        </div>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'properties'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            내 부동산
          </button>
          <button
            onClick={() => setActiveTab('shares')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'shares'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            내 지분
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            거래 내역
          </button>
        </nav>
      </div>
      
      {/* 탭 컨텐츠 */}
      {renderTabContent()}
    </div>
  );
};

export default Dashboard; 