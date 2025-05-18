import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { propertyAPI, shareAPI } from '../services/api.service';
import web3Service from '../services/web3.service';
import { AuthContext } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext.jsx';
import BuySharesForm from '../components/BuySharesForm';
import { ethers } from 'ethers';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const { account, connectWallet } = useWallet();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shares, setShares] = useState(null);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [chainData, setChainData] = useState(null);
  
  // useCallback을 사용하여 함수 메모이제이션
  const fetchPropertyDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // 부동산 정보 조회
      const propertyRes = await propertyAPI.getProperty(id);
      setProperty(propertyRes.data);
      
      // 부동산이 토큰화된 경우 지분 정보 조회
      if (propertyRes.data.isTokenized) {
        const sharesRes = await shareAPI.getSharesByProperty(id);
        setShares(sharesRes.data);
        
        // 블록체인에서 부동산 및 지분 정보 조회
        try {
          const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_AVALANCHE_RPC_URL);
          
          const propertyInfo = await web3Service.getPropertyInfo(provider, propertyRes.data.tokenId);
          const shareInfo = await web3Service.getShareInfo(provider, propertyRes.data.shareId);
          
          if (propertyInfo.success && shareInfo.success) {
            setChainData({
              property: propertyInfo.data,
              share: shareInfo.data
            });
          }
        } catch (chainError) {
          console.error('블록체인 데이터 조회 오류:', chainError);
        }
      }
      
      // 유사한 부동산 조회
      const similarRes = await propertyAPI.getSimilarProperties(id);
      setSimilarProperties(similarRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('부동산 정보 조회 중 오류 발생:', error);
      setError('부동산 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);
  
  const handleBuyClick = () => {
    if (!isAuthenticated) {
      toast.info('지분을 구매하려면 로그인이 필요합니다.');
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    
    if (!account) {
      toast.info('지분을 구매하려면 지갑 연결이 필요합니다.');
      connectWallet();
      return;
    }
    
    setShowBuyForm(true);
  };
  
  const handleTokenizeClick = () => {
    if (!isAuthenticated) {
      toast.info('부동산을 토큰화하려면 로그인이 필요합니다.');
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    
    if (!account) {
      toast.info('부동산을 토큰화하려면 지갑 연결이 필요합니다.');
      connectWallet();
      return;
    }
    
    navigate(`/tokenize-property/${id}`);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mx-4 my-6">
      <p>{error}</p>
      <button 
        onClick={fetchPropertyDetails} 
        className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded transition-all"
      >
        다시 시도
      </button>
    </div>
  );

  if (!property) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 부동산 제목 및 주소 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-fade-in">{property.title}</h1>
        <p className="text-gray-600 mb-4">{property.address}</p>
        
        {/* 로그인 상태에 따른 버튼 */}
        <div className="flex flex-wrap gap-4">
          {isAuthenticated ? (
            <>
              {!property.isTokenized && (
                <button 
                  onClick={handleTokenizeClick}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  토큰화하기
                </button>
              )}
              
              {property.isTokenized && (
                <button 
                  onClick={handleBuyClick}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  지분 구매하기
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/login', { state: { from: `/property/${id}` } })}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                로그인하여 투자하기
              </button>
              <button 
                onClick={() => navigate('/register', { state: { from: `/property/${id}` } })}
                className="bg-white text-blue-600 border border-blue-500 hover:bg-blue-50 px-6 py-2 rounded-lg shadow hover:shadow-md transition-all"
              >
                회원가입하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 부동산 이미지 및 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* 이미지 섹션 */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl shadow-lg group">
          <img 
            src={property.imageUrl || "https://via.placeholder.com/800x600?text=부동산+이미지"} 
            alt={property.title} 
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        
        {/* 부동산 특징 섹션 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">부동산 특징</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg transition-all hover:shadow-md">
                <p className="text-sm text-gray-500">부동산 유형</p>
                <p className="text-lg font-medium">{property.propertyType}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg transition-all hover:shadow-md">
                <p className="text-sm text-gray-500">면적</p>
                <p className="text-lg font-medium">{property.squareFootage}㎡</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg transition-all hover:shadow-md">
                <p className="text-sm text-gray-500">평가 가치</p>
                <p className="text-lg font-medium">{property.evaluationPrice?.toLocaleString()} 원</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg transition-all hover:shadow-md">
                <p className="text-sm text-gray-500">지분 가격</p>
                <p className="text-lg font-medium">{property.tokenPrice?.toLocaleString()} 원</p>
              </div>
            </div>
          </div>
          
          {/* 블록체인 정보 섹션 - 토큰화된 경우만 표시 */}
          {property.isTokenized && chainData && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">블록체인 정보</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-blue-100 text-sm">컨트랙트 주소</p>
                  <p className="font-mono text-sm truncate">{chainData.property?.contractAddress}</p>
                </div>
                
                <div>
                  <p className="text-blue-100 text-sm">토큰 ID</p>
                  <p className="font-mono">{property.tokenId}</p>
                </div>
                
                <div>
                  <p className="text-blue-100 text-sm">총 지분 수</p>
                  <p className="font-mono">{chainData.share?.totalShares}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 지분 정보 섹션 - 토큰화된 경우만 표시 */}
      {property.isTokenized && shares && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">지분 정보</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
              <p className="text-gray-500 mb-1">총 지분 수</p>
              <p className="text-2xl font-semibold">{shares.totalShares}</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
              <p className="text-gray-500 mb-1">판매된 지분</p>
              <p className="text-2xl font-semibold">{shares.soldShares}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full animate-expand-width" 
                  style={{ width: `${(shares.soldShares / shares.totalShares) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
              <p className="text-gray-500 mb-1">지분당 가격</p>
              <p className="text-2xl font-semibold">{shares.pricePerShare?.toLocaleString()} 원</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
              <p className="text-gray-500 mb-1">예상 연간 수익률</p>
              <p className="text-2xl font-semibold text-green-600">{shares.expectedReturn}%</p>
            </div>
          </div>
        </div>
      )}

      {/* 부동산 상세 설명 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">상세 설명</h3>
        <div className="prose max-w-none">
          <p>{property.description}</p>
        </div>
      </div>

      {/* 유사한 부동산 */}
      {similarProperties.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">유사한 부동산</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {similarProperties.map((prop, index) => (
              <Link 
                key={prop.id} 
                to={`/property/${prop.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative overflow-hidden h-48">
                  <img 
                    src={prop.imageUrl || "https://via.placeholder.com/400x300?text=부동산+이미지"} 
                    alt={prop.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {prop.isTokenized && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      토큰화됨
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium text-lg mb-1 truncate">{prop.title}</h4>
                  <p className="text-gray-500 text-sm mb-2 truncate">{prop.address}</p>
                  <p className="text-blue-600 font-semibold">{prop.evaluationPrice?.toLocaleString()} 원</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 지분 구매 폼 */}
      {showBuyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">지분 구매</h3>
              <button 
                onClick={() => setShowBuyForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {shares && (
              <BuySharesForm 
                property={property} 
                shareInfo={shares} 
                onClose={() => setShowBuyForm(false)} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;