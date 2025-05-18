import React from 'react';

const DeFi = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">DeFi 서비스</h1>
        <p className="text-lg text-gray-600">아발란체 블록체인 기반 부동산 DeFi 서비스를 이용해보세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 스테이킹 카드 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">부동산 토큰 스테이킹</h2>
            <p className="text-gray-600 mb-4">소유한 부동산 토큰을 스테이킹하고 추가 수익을 얻으세요.</p>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-bold">연 수익률: 5.8%</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                스테이킹하기
              </button>
            </div>
          </div>
        </div>

        {/* 유동성 풀 카드 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
            <svg className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">유동성 풀 참여</h2>
            <p className="text-gray-600 mb-4">부동산 토큰과 AVAX의 유동성 풀에 참여하고 교환 수수료를 받으세요.</p>
            <div className="flex justify-between items-center">
              <span className="text-purple-600 font-bold">예상 APR: 8.2%</span>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                유동성 추가
              </button>
            </div>
          </div>
        </div>

        {/* 대출 카드 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="h-48 bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
            <svg className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">부동산 담보 대출</h2>
            <p className="text-gray-600 mb-4">부동산 토큰을 담보로 AVAX를 대출받으세요.</p>
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-bold">대출 이자: 3.5%</span>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                대출 신청
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-gray-100 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">DeFi 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">총 락업 금액</h3>
            <p className="text-3xl font-bold text-blue-600">125,490 AVAX</p>
            <p className="text-sm text-gray-500">지난 주 대비 +12.5%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">일일 거래량</h3>
            <p className="text-3xl font-bold text-purple-600">8,723 AVAX</p>
            <p className="text-sm text-gray-500">지난 주 대비 +5.8%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">활성 사용자</h3>
            <p className="text-3xl font-bold text-green-600">1,243명</p>
            <p className="text-sm text-gray-500">지난 주 대비 +18.2%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeFi; 