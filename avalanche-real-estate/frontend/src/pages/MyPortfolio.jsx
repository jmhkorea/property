import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MyPortfolio = () => {
  // 현재 탭 상태 관리
  const [activeTab, setActiveTab] = useState('properties');

  // 보유 부동산 데이터 샘플
  const myProperties = [
    {
      id: 1,
      name: '강남 오피스 빌딩',
      location: '서울 강남구 테헤란로 123',
      type: '상업용',
      ownership: 25, // 소유 지분 퍼센트
      currentValue: 1250000000, // 현재 가치 (원)
      initialValue: 1000000000, // 초기 투자 가치 (원)
      montlyIncome: 2500000, // 월 수익 (원)
      tokenPrice: 120, // 토큰 가격 (AVAX)
      tokenCount: 250, // 보유 토큰 수
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 2,
      name: '해운대 리조트',
      location: '부산 해운대구 해운대해변로 30',
      type: '휴양지',
      ownership: 10,
      currentValue: 500000000,
      initialValue: 450000000,
      montlyIncome: 1200000,
      tokenPrice: 85,
      tokenCount: 100,
      imageUrl: 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 3,
      name: '홍대 상가',
      location: '서울 마포구 와우산로 29',
      type: '상업용',
      ownership: 15,
      currentValue: 320000000,
      initialValue: 300000000,
      montlyIncome: 950000,
      tokenPrice: 65,
      tokenCount: 150,
      imageUrl: 'https://images.unsplash.com/photo-1604014238170-4def1e4e6fcf?q=80&w=1000&auto=format&fit=crop'
    }
  ];

  // 투자 내역 데이터 샘플
  const transactions = [
    {
      id: 1,
      propertyName: '강남 오피스 빌딩',
      type: '매수',
      tokenAmount: 250,
      tokenPrice: 100,
      totalAmount: 25000,
      currency: 'AVAX',
      date: '2023-06-15',
      status: '완료'
    },
    {
      id: 2,
      propertyName: '해운대 리조트',
      type: '매수',
      tokenAmount: 100,
      tokenPrice: 80,
      totalAmount: 8000,
      currency: 'AVAX',
      date: '2023-08-22',
      status: '완료'
    },
    {
      id: 3,
      propertyName: '홍대 상가',
      type: '매수',
      tokenAmount: 150,
      tokenPrice: 60,
      totalAmount: 9000,
      currency: 'AVAX',
      date: '2023-10-05',
      status: '완료'
    },
    {
      id: 4,
      propertyName: '강남 오피스 빌딩',
      type: '수익',
      tokenAmount: null,
      tokenPrice: null,
      totalAmount: 500,
      currency: 'AVAX',
      date: '2023-12-01',
      status: '완료'
    }
  ];

  // 수익 데이터 샘플
  const earnings = [
    {
      id: 1,
      propertyName: '강남 오피스 빌딩',
      type: '임대 수익',
      amount: 500,
      currency: 'AVAX',
      date: '2023-12-01',
      status: '지급 완료'
    },
    {
      id: 2,
      propertyName: '해운대 리조트',
      type: '임대 수익',
      amount: 250,
      currency: 'AVAX',
      date: '2023-12-01',
      status: '지급 완료'
    },
    {
      id: 3,
      propertyName: '홍대 상가',
      type: '임대 수익',
      amount: 185,
      currency: 'AVAX',
      date: '2023-12-01',
      status: '지급 완료'
    },
    {
      id: 4,
      propertyName: '강남 오피스 빌딩',
      type: '토큰 가치 상승',
      amount: 5000,
      currency: 'KRW',
      date: '2023-11-15',
      status: '평가 수익'
    }
  ];

  // 가치 포맷팅
  const formatCurrency = (value, currency = 'KRW') => {
    if (currency === 'AVAX') {
      return `${value.toLocaleString()} AVAX`;
    } else {
      return `${value.toLocaleString()}원`;
    }
  };

  // 월 수익 계산
  const totalMonthlyIncome = myProperties.reduce((sum, property) => sum + property.montlyIncome, 0);
  
  // 총 자산 가치 계산
  const totalAssetValue = myProperties.reduce((sum, property) => sum + property.currentValue, 0);
  
  // 총 수익률 계산
  const totalInitialValue = myProperties.reduce((sum, property) => sum + property.initialValue, 0);
  const totalReturnRate = ((totalAssetValue - totalInitialValue) / totalInitialValue * 100).toFixed(1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">내 포트폴리오</h1>
        <p className="text-gray-600">보유 자산 및 수익 현황을 확인하세요.</p>
      </div>

      {/* 포트폴리오 요약 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">포트폴리오 요약</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">총 자산 가치</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAssetValue)}</p>
            <p className="text-sm text-green-600">수익률 +{totalReturnRate}%</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">월 수익</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</p>
            <p className="text-sm text-gray-600">연 {formatCurrency(totalMonthlyIncome * 12)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">보유 부동산 수</p>
            <p className="text-2xl font-bold text-purple-600">{myProperties.length}개</p>
            <p className="text-sm text-gray-600">총 {myProperties.reduce((sum, property) => sum + property.tokenCount, 0)}개 토큰</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'properties'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            보유 부동산
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            투자 내역
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'earnings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            수익 내역
          </button>
        </nav>
      </div>

      {/* 보유 부동산 탭 */}
      {activeTab === 'properties' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {myProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="h-40 overflow-hidden">
                <img
                  src={property.imageUrl}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{property.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{property.location}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">소유 지분</p>
                    <p className="font-semibold text-blue-600">{property.ownership}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">보유 토큰</p>
                    <p className="font-semibold text-purple-600">{property.tokenCount}개</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">현재 가치</p>
                    <p className="font-semibold text-indigo-600">{formatCurrency(property.currentValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">월 수익</p>
                    <p className="font-semibold text-green-600">{formatCurrency(property.montlyIncome)}</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Link
                    to={`/property/${property.id}`}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    상세 보기
                  </Link>
                  <Link
                    to={`/property/${property.id}/income`}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    수익 관리
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 투자 내역 탭 */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부동산
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래 유형
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  토큰 수량
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래 금액
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.propertyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === '매수' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.tokenAmount ? `${transaction.tokenAmount}개` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.totalAmount} {transaction.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 수익 내역 탭 */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부동산
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수익 유형
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  지급일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {earnings.map((earning) => (
                <tr key={earning.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{earning.propertyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      earning.type === '임대 수익' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {earning.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {earning.amount} {earning.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {earning.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      earning.status === '지급 완료' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {earning.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyPortfolio; 