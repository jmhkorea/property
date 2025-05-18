import React, { useState } from 'react';

const Learn = () => {
  // 현재 선택된 문서 상태 관리
  const [selectedDoc, setSelectedDoc] = useState('intro');

  // 교육 콘텐츠 카테고리
  const categories = [
    {
      id: 'basics',
      title: '기본 개념',
      items: [
        { id: 'intro', title: '부동산 토큰화란?' },
        { id: 'blockchain', title: '블록체인 기술 이해하기' },
        { id: 'tokenization', title: '토큰화 프로세스' }
      ]
    },
    {
      id: 'investment',
      title: '투자 가이드',
      items: [
        { id: 'strategy', title: '부동산 토큰 투자 전략' },
        { id: 'analysis', title: '부동산 시장 분석 방법' },
        { id: 'risks', title: '리스크 관리와 다각화' }
      ]
    },
    {
      id: 'technical',
      title: '기술 문서',
      items: [
        { id: 'smartcontracts', title: '스마트 컨트랙트 이해하기' },
        { id: 'avalanche', title: '아발란체 프로토콜 소개' },
        { id: 'wallet', title: '암호화폐 지갑 설정 가이드' }
      ]
    },
    {
      id: 'legal',
      title: '법률 정보',
      items: [
        { id: 'regulations', title: '암호화폐 규제 현황' },
        { id: 'compliance', title: '부동산 토큰화 법적 고려사항' },
        { id: 'tax', title: '세금 및 회계 처리' }
      ]
    }
  ];

  // 콘텐츠 매핑
  const contentMap = {
    intro: {
      title: '부동산 토큰화란?',
      content: (
        <>
          <h2 className="text-2xl font-bold mb-4">부동산 토큰화 소개</h2>
          <p className="mb-4">
            부동산 토큰화는 물리적 부동산 자산을 블록체인 상의 디지털 토큰으로 변환하는 과정입니다. 이를 통해 기존에는 거래가 어려웠던 고가의 부동산 자산을 작은 단위로 나누어 투자자들이 부분적으로 소유하고 거래할 수 있게 됩니다.
          </p>
          <h3 className="text-xl font-semibold mb-2 mt-6">주요 장점</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>접근성 향상:</strong> 소액 투자자도 프리미엄 부동산에 투자할 수 있습니다.
            </li>
            <li>
              <strong>유동성 증가:</strong> 기존 부동산보다 쉽고 빠르게 사고 팔 수 있습니다.
            </li>
            <li>
              <strong>투명성:</strong> 블록체인 기술을 통해 모든 거래와 소유권이 투명하게 기록됩니다.
            </li>
            <li>
              <strong>비용 절감:</strong> 중개인과 법적 절차를 간소화하여 거래 비용을 줄일 수 있습니다.
            </li>
            <li>
              <strong>글로벌 투자:</strong> 지리적 제약 없이 전 세계의 부동산에 투자할 수 있습니다.
            </li>
          </ul>
          <h3 className="text-xl font-semibold mb-2 mt-6">작동 방식</h3>
          <p className="mb-4">
            부동산 토큰화는 다음과 같은 과정으로 이루어집니다:
          </p>
          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>부동산 자산의 법적 평가 및 가치 산정</li>
            <li>법적 구조 설정 (SPV 또는 신탁)</li>
            <li>토큰 발행 및 블록체인에 기록</li>
            <li>투자자들에게 토큰 배포 또는 거래소를 통한 판매</li>
            <li>지속적인 수익 분배 및 관리</li>
          </ol>
          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <h4 className="font-semibold text-blue-800 mb-2">AVAX Estate의 접근 방식</h4>
            <p className="text-blue-800">
              AVAX Estate는 아발란체 블록체인을 활용하여 고품질 부동산 자산을 토큰화하고, 투자자들에게 안전하고 투명한 투자 기회를 제공합니다. 우리 플랫폼은 법적 규정을 준수하며, 사용자 친화적인 인터페이스를 통해 누구나 쉽게 부동산 투자에 참여할 수 있도록 돕고 있습니다.
            </p>
          </div>
        </>
      )
    },
    blockchain: {
      title: '블록체인 기술 이해하기',
      content: (
        <>
          <h2 className="text-2xl font-bold mb-4">블록체인 기술 기초</h2>
          <p className="mb-4">
            블록체인은 분산 원장 기술의 한 형태로, 정보가 여러 컴퓨터에 분산 저장되어 투명성과 보안성을 제공합니다. 이 기술은 암호화폐의 기반 기술로 널리 알려졌지만, 부동산 토큰화를 포함한 다양한 산업에서 응용되고 있습니다.
          </p>
          <h3 className="text-xl font-semibold mb-2 mt-6">블록체인의 핵심 개념</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>분산 시스템:</strong> 중앙 기관 없이 네트워크의 참여자들이 공동으로 시스템을 유지합니다.
            </li>
            <li>
              <strong>암호화 보안:</strong> 암호학적 기법으로 데이터와 거래를 보호합니다.
            </li>
            <li>
              <strong>변경 불가능성:</strong> 한번 기록된 정보는 수정이나 삭제가 매우 어렵습니다.
            </li>
            <li>
              <strong>합의 메커니즘:</strong> 네트워크 참여자들이 거래의 유효성을 검증하는 방법입니다.
            </li>
          </ul>
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-2">블록체인과 기존 시스템의 비교</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">특성</th>
                  <th className="px-4 py-2 text-left">기존 중앙화 시스템</th>
                  <th className="px-4 py-2 text-left">블록체인</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 font-medium">제어</td>
                  <td className="px-4 py-2">중앙 기관</td>
                  <td className="px-4 py-2">분산 네트워크</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">투명성</td>
                  <td className="px-4 py-2">제한적</td>
                  <td className="px-4 py-2">완전 공개 (퍼블릭 블록체인)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">변조 위험</td>
                  <td className="px-4 py-2">상대적으로 높음</td>
                  <td className="px-4 py-2">매우 낮음</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">속도/효율성</td>
                  <td className="px-4 py-2">일반적으로 빠름</td>
                  <td className="px-4 py-2">블록체인에 따라 다름</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 className="text-xl font-semibold mb-2 mt-6">아발란체 블록체인</h3>
          <p className="mb-4">
            아발란체(Avalanche)는 높은 처리량, 빠른 완결성, 낮은 수수료를 제공하는 고성능 블록체인 플랫폼입니다. 이러한 특성은 부동산 토큰화와 같은 복잡한 응용 프로그램에 적합합니다.
          </p>
          <p className="mb-4">
            아발란체의 특징:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>초당 4,500개 이상의 트랜잭션 처리 능력</li>
            <li>1초 이내의 트랜잭션 완결성</li>
            <li>이더리움 가상 머신(EVM) 호환성</li>
            <li>지속 가능한 에너지 효율적인 합의 메커니즘</li>
            <li>다중 체인 아키텍처로 확장성 제공</li>
          </ul>
          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <h4 className="font-semibold text-blue-800 mb-2">AVAX Estate와 블록체인</h4>
            <p className="text-blue-800">
              AVAX Estate는 아발란체 블록체인의 장점을 활용하여 부동산 거래의 속도, 비용, 투명성을 획기적으로 개선합니다. 우리의 스마트 컨트랙트는 소유권 이전, 수익 분배, 투표 등의 프로세스를 자동화하여 투자자들에게 더 나은 경험을 제공합니다.
            </p>
          </div>
        </>
      )
    },
    tokenization: {
      title: '토큰화 프로세스',
      content: (
        <>
          <h2 className="text-2xl font-bold mb-4">부동산 토큰화 프로세스</h2>
          <p className="mb-4">
            부동산 토큰화는 물리적 부동산 자산을 디지털 토큰으로 변환하는 여러 단계의 복합적인 과정입니다. 이 과정을 통해 투자자들은 부동산의 일부분에 대한 권리를 나타내는 토큰을 소유할 수 있게 됩니다.
          </p>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="bg-blue-600 text-white text-center py-3">
              <h3 className="text-lg font-medium">토큰화 프로세스 단계</h3>
            </div>
            <div className="p-4">
              <ol className="relative border-l border-gray-300 ml-3 space-y-6">
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white">
                    <span className="text-blue-800 font-bold">1</span>
                  </span>
                  <h4 className="font-semibold text-lg mb-1">부동산 자산 선정 및 실사</h4>
                  <p className="text-gray-600">토큰화할 부동산의 법적 상태, 가치, 수익성 등을 철저히 조사합니다.</p>
                </li>
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white">
                    <span className="text-blue-800 font-bold">2</span>
                  </span>
                  <h4 className="font-semibold text-lg mb-1">법적 구조 설정</h4>
                  <p className="text-gray-600">일반적으로 특수목적법인(SPV) 또는 신탁 구조를 설립하여 부동산 소유권을 보유합니다.</p>
                </li>
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white">
                    <span className="text-blue-800 font-bold">3</span>
                  </span>
                  <h4 className="font-semibold text-lg mb-1">스마트 컨트랙트 개발</h4>
                  <p className="text-gray-600">토큰의 발행, 소유권 이전, 수익 분배 등의 규칙을 정의하는 스마트 컨트랙트를 개발합니다.</p>
                </li>
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white">
                    <span className="text-blue-800 font-bold">4</span>
                  </span>
                  <h4 className="font-semibold text-lg mb-1">토큰 생성 및 발행</h4>
                  <p className="text-gray-600">부동산 가치를 대표하는 디지털 토큰을 블록체인에 발행합니다.</p>
                </li>
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white">
                    <span className="text-blue-800 font-bold">5</span>
                  </span>
                  <h4 className="font-semibold text-lg mb-1">투자자 모집 및 판매</h4>
                  <p className="text-gray-600">규제 준수를 확인한 후 투자자들에게 토큰을 판매합니다.</p>
                </li>
                <li className="ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white">
                    <span className="text-blue-800 font-bold">6</span>
                  </span>
                  <h4 className="font-semibold text-lg mb-1">자산 관리 및 수익 분배</h4>
                  <p className="text-gray-600">부동산 관리와 임대 수익 분배를 지속적으로 수행합니다.</p>
                </li>
              </ol>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-2 mt-6">토큰 표준</h3>
          <p className="mb-4">
            부동산 토큰은 주로 다음과 같은 블록체인 토큰 표준을 사용하여 발행됩니다:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>ERC-20:</strong> 가장 일반적인 토큰 표준으로, 대체 가능한 토큰에 적합합니다.
            </li>
            <li>
              <strong>ERC-721:</strong> 비대체 토큰(NFT) 표준으로, 각 부동산의 고유성을 표현할 때 사용됩니다.
            </li>
            <li>
              <strong>ERC-1400:</strong> 증권형 토큰에 특화된 표준으로, 규제 준수 기능을 포함합니다.
            </li>
            <li>
              <strong>아발란체 네이티브 토큰:</strong> 아발란체 블록체인의 자체 토큰 표준을 활용할 수 있습니다.
            </li>
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <h4 className="font-semibold text-blue-800 mb-2">AVAX Estate의 토큰화 방식</h4>
            <p className="text-blue-800 mb-3">
              AVAX Estate는 아발란체 블록체인을 기반으로 안전하고 투명한 부동산 토큰화 프로세스를 제공합니다. 우리의 접근 방식은 다음과 같은 특징이 있습니다:
            </p>
            <ul className="list-disc pl-6 text-blue-800">
              <li>법적 규정 준수를 최우선으로 한 토큰 발행</li>
              <li>철저한 실사를 통한 고품질 부동산 선정</li>
              <li>투명한 가치 평가 및 토큰 가격 책정</li>
              <li>자동화된 수익 분배 시스템</li>
              <li>투자자 보호를 위한 다중 서명 보안 구조</li>
            </ul>
          </div>
        </>
      )
    }
    // 다른 콘텐츠들도 필요에 따라 추가
  };

  // 선택된 문서의 내용을 가져오기
  const getContent = () => {
    return contentMap[selectedDoc] || { 
      title: '문서를 찾을 수 없습니다', 
      content: <p>선택한 문서를 찾을 수 없습니다. 다른 문서를 선택해주세요.</p> 
    };
  };

  const currentContent = getContent();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">학습하기</h1>
        <p className="text-gray-600">부동산 토큰화와 블록체인에 대한 포괄적인 교육 자료를 확인하세요.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* 사이드바 */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">학습 자료</h2>
            
            {categories.map(category => (
              <div key={category.id} className="mb-4">
                <h3 className="text-md font-semibold text-gray-700 mb-2">{category.title}</h3>
                <ul className="space-y-1">
                  {category.items.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => setSelectedDoc(item.id)}
                        className={`text-left w-full px-3 py-2 rounded-md text-sm ${
                          selectedDoc === item.id
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">도움이 더 필요하신가요?</h3>
              <p className="text-xs text-blue-700 mb-3">
                부동산 토큰화에 대해 더 알아보고 싶으시면 우리의 무료 웨비나에 참여하세요.
              </p>
              <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                웨비나 신청하기
              </button>
            </div>
          </div>
        </div>
        
        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
              {currentContent.title}
            </h2>
            <div className="prose max-w-none">
              {currentContent.content}
            </div>
          </div>
          
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">추천 자료</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-medium text-blue-600 bg-blue-100 rounded-full px-2 py-1">E-BOOK</span>
                <h4 className="font-medium text-gray-800 mt-2">부동산 토큰화 완벽 가이드</h4>
                <p className="text-sm text-gray-600 mt-1">부동산 투자의 새로운 시대를 여는 종합 가이드</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-1">VIDEO</span>
                <h4 className="font-medium text-gray-800 mt-2">아발란체 블록체인 기초</h4>
                <p className="text-sm text-gray-600 mt-1">아발란체 생태계와 기술 구조 이해하기</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-medium text-purple-600 bg-purple-100 rounded-full px-2 py-1">COURSE</span>
                <h4 className="font-medium text-gray-800 mt-2">디지털 부동산 투자자 과정</h4>
                <p className="text-sm text-gray-600 mt-1">토큰화된 부동산에 투자하는 방법 배우기</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn; 