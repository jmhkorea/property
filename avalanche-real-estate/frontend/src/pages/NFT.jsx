import React, { useState } from 'react';

const NFT = () => {
  // 필터링 상태
  const [filter, setFilter] = useState('all');
  
  // NFT 컬렉션 데이터
  const nftCollections = [
    {
      id: 1,
      name: '프리미엄 부동산 컬렉션',
      description: '서울 강남구 및 주요 도시 랜드마크 부동산 NFT 컬렉션',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
      category: 'premium',
      items: 28,
      floorPrice: 120,
      volume: 4580
    },
    {
      id: 2,
      name: '제주도 리조트 NFT',
      description: '제주도 해안가 프리미엄 리조트 부동산 NFT',
      imageUrl: 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=1000&auto=format&fit=crop',
      category: 'resort',
      items: 15,
      floorPrice: 85,
      volume: 1250
    },
    {
      id: 3,
      name: '상업용 부동산 시리즈',
      description: '주요 상권 상업용 부동산 NFT 시리즈',
      imageUrl: 'https://images.unsplash.com/photo-1604014238170-4def1e4e6fcf?q=80&w=1000&auto=format&fit=crop',
      category: 'commercial',
      items: 42,
      floorPrice: 65,
      volume: 3150
    },
    {
      id: 4,
      name: '주거용 아파트 컬렉션',
      description: '서울 및 수도권 주요 아파트 단지 NFT 컬렉션',
      imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1000&auto=format&fit=crop',
      category: 'residential',
      items: 56,
      floorPrice: 45,
      volume: 2870
    },
    {
      id: 5,
      name: '역사적 건물 시리즈',
      description: '한국의 역사적 건축물과 문화재 기반 NFT 시리즈',
      imageUrl: 'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?q=80&w=1000&auto=format&fit=crop',
      category: 'historic',
      items: 12,
      floorPrice: 230,
      volume: 980
    },
    {
      id: 6,
      name: '미래형 스마트시티 NFT',
      description: '미래 스마트시티 디자인 기반 가상 부동산 NFT',
      imageUrl: 'https://images.unsplash.com/photo-1582485440878-bb48d1b05fd3?q=80&w=1000&auto=format&fit=crop',
      category: 'future',
      items: 20,
      floorPrice: 95,
      volume: 1550
    }
  ];
  
  // 필터링된 NFT 컬렉션
  const filteredCollections = filter === 'all' 
    ? nftCollections 
    : nftCollections.filter(collection => collection.category === filter);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">부동산 NFT 마켓플레이스</h1>
        <p className="text-lg text-gray-600">희소성 높은 부동산 자산에 투자하고 소유권을 증명하세요.</p>
      </div>
      
      {/* 필터 버튼 */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <button 
          onClick={() => setFilter('all')} 
          className={`px-4 py-2 rounded-full transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          전체
        </button>
        <button 
          onClick={() => setFilter('premium')} 
          className={`px-4 py-2 rounded-full transition-colors ${filter === 'premium' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          프리미엄
        </button>
        <button 
          onClick={() => setFilter('commercial')} 
          className={`px-4 py-2 rounded-full transition-colors ${filter === 'commercial' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          상업용
        </button>
        <button 
          onClick={() => setFilter('residential')} 
          className={`px-4 py-2 rounded-full transition-colors ${filter === 'residential' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          주거용
        </button>
        <button 
          onClick={() => setFilter('resort')} 
          className={`px-4 py-2 rounded-full transition-colors ${filter === 'resort' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          리조트
        </button>
        <button 
          onClick={() => setFilter('historic')} 
          className={`px-4 py-2 rounded-full transition-colors ${filter === 'historic' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          역사적 건물
        </button>
        <button 
          onClick={() => setFilter('future')} 
          className={`px-4 py-2 rounded-full transition-colors ${filter === 'future' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          미래형
        </button>
      </div>
      
      {/* NFT 컬렉션 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCollections.map(collection => (
          <div key={collection.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="h-60 overflow-hidden">
              <img 
                src={collection.imageUrl} 
                alt={collection.name} 
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{collection.name}</h2>
              <p className="text-gray-600 mb-4">{collection.description}</p>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">아이템</p>
                  <p className="font-bold text-blue-600">{collection.items}개</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">최저가</p>
                  <p className="font-bold text-purple-600">{collection.floorPrice} AVAX</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">거래량</p>
                  <p className="font-bold text-green-600">{collection.volume} AVAX</p>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  컬렉션 보기
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                  민팅하기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* NFT 특징 섹션 */}
      <div className="mt-16 bg-gray-100 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">AVAX Estate NFT의 특징</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">검증된 소유권</h3>
            <p className="text-gray-600">블록체인에 기록된 명확하고 투명한 소유권으로 법적 분쟁을 예방합니다.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a4 4 0 00-4-4H8.8a4 4 0 00-4 4v7.5M12 8a4 4 0 014 4v6m0 0v-6a4 4 0 014-4h.8a4 4 0 014 4v.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">분할 소유권</h3>
            <p className="text-gray-600">고가의 부동산도 작은 단위로 나누어 투자할 수 있는 기회를 제공합니다.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">수익 창출</h3>
            <p className="text-gray-600">임대 수익, 자산 가치 상승, 2차 판매 로열티 등 다양한 수익 모델을 제공합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFT; 