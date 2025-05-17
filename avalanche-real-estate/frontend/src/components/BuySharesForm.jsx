import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import { useWallet } from '../contexts/WalletContext';
import FractionalOwnershipABI from '../contracts/FractionalOwnership.json';

const BuySharesForm = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { account, provider, isCorrectNetwork, switchNetwork } = useWallet();
  
  const [shareInfo, setShareInfo] = useState(null);
  const [propertyInfo, setPropertyInfo] = useState(null);
  const [availableShares, setAvailableShares] = useState(0);
  const [sharesToBuy, setSharesToBuy] = useState(1);
  const [totalPrice, setTotalPrice] = useState('0');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 지분 및 부동산 정보 로드
  useEffect(() => {
    const fetchShareDetails = async () => {
      try {
        setLoading(true);
        
        // 지분 정보 로드
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/shares/${shareId}`);
        setShareInfo(response.data);
        
        // 부동산 정보 로드
        const propertyResponse = await axios.get(`${process.env.REACT_APP_API_URL}/properties/${response.data.propertyId}`);
        setPropertyInfo(propertyResponse.data);
        
        // 컨트랙트에서 가용 지분 수 확인
        if (provider) {
          const fractionalOwnershipContract = new ethers.Contract(
            process.env.REACT_APP_FRACTIONAL_OWNERSHIP_ADDRESS,
            FractionalOwnershipABI.abi,
            provider
          );
          
          const shareInfoFromContract = await fractionalOwnershipContract.getShareInfo(shareId);
          setAvailableShares(shareInfoFromContract.availableShares.toNumber());
          
          // 초기 지분 설정
          setSharesToBuy(Math.min(1, shareInfoFromContract.availableShares.toNumber()));
          
          // 초기 가격 계산
          const price = ethers.utils.formatEther(
            shareInfoFromContract.pricePerShare.mul(Math.min(1, shareInfoFromContract.availableShares.toNumber()))
          );
          setTotalPrice(price);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('지분 정보 로드 오류:', err);
        setError('지분 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    if (shareId && provider) {
      fetchShareDetails();
    }
  }, [shareId, provider]);
  
  // 구매할 지분 수 변경 시 총 가격 업데이트
  useEffect(() => {
    if (shareInfo && sharesToBuy) {
      const price = ethers.utils.parseEther(shareInfo.pricePerShare).mul(sharesToBuy);
      setTotalPrice(ethers.utils.formatEther(price));
    }
  }, [shareInfo, sharesToBuy]);
  
  const handleSharesChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= availableShares) {
      setSharesToBuy(value);
    }
  };
  
  const handleMaxShares = () => {
    setSharesToBuy(availableShares);
  };
  
  const handleBuyShares = async () => {
    if (!account) {
      setError('지갑이 연결되어 있지 않습니다. 먼저 지갑을 연결해주세요.');
      return;
    }
    
    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // 구매할 지분 수 검증
      if (sharesToBuy <= 0 || sharesToBuy > availableShares) {
        throw new Error('유효한 지분 수를 입력해주세요.');
      }
      
      // 계약 인스턴스 생성
      const signer = provider.getSigner();
      const fractionalOwnershipContract = new ethers.Contract(
        process.env.REACT_APP_FRACTIONAL_OWNERSHIP_ADDRESS,
        FractionalOwnershipABI.abi,
        signer
      );
      
      // 지분 정보 가져오기
      const shareInfoFromContract = await fractionalOwnershipContract.getShareInfo(shareId);
      
      // 총 가격 계산
      const totalPriceWei = shareInfoFromContract.pricePerShare.mul(sharesToBuy);
      
      // 구매 트랜잭션 실행
      const tx = await fractionalOwnershipContract.buyShares(
        shareId,
        sharesToBuy,
        { value: totalPriceWei }
      );
      
      // 트랜잭션 확인 대기
      const receipt = await tx.wait();
      console.log('지분 구매 트랜잭션 완료:', receipt);
      
      // 이벤트 확인
      receipt.events.find(e => e.event === 'SharesPurchased');
      
      // 백엔드 업데이트
      await axios.post(`${process.env.REACT_APP_API_URL}/shares/purchase`, {
        shareId: shareId,
        buyer: account,
        amount: sharesToBuy,
        totalPrice: ethers.utils.formatEther(totalPriceWei)
      });
      
      // 가용 지분 수 업데이트
      const newShareInfo = await fractionalOwnershipContract.getShareInfo(shareId);
      setAvailableShares(newShareInfo.availableShares.toNumber());
      
      // 성공 메시지 표시
      setSuccess(`${sharesToBuy}개의 지분을 성공적으로 구매했습니다.`);
      
      // 구매 지분 수 초기화
      setSharesToBuy(Math.min(1, newShareInfo.availableShares.toNumber()));
      
    } catch (err) {
      console.error('지분 구매 오류:', err);
      setError(err.message || '지분 구매 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !shareInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!shareInfo || !propertyInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">오류!</strong>
          <span className="block sm:inline"> 지분 정보를 불러올 수 없습니다.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 왼쪽: 부동산 정보 */}
        <div className="lg:w-1/2">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">부동산 정보</h2>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">{propertyInfo.propertyAddress}</h3>
            
            <div className="mb-4">
              {propertyInfo.imageUrl ? (
                <img 
                  src={propertyInfo.imageUrl} 
                  alt={propertyInfo.propertyAddress} 
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md mb-4">
                  <span className="text-gray-500">이미지 없음</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">유형:</p>
                <p className="font-medium">{propertyInfo.propertyType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">면적:</p>
                <p className="font-medium">{propertyInfo.squareMeters} m²</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">평가 가치:</p>
                <p className="font-medium text-green-600">{ethers.utils.formatEther(propertyInfo.appraisedValue)} AVAX</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">위치:</p>
                <p className="font-medium">{propertyInfo.latitude}, {propertyInfo.longitude}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 오른쪽: 지분 구매 폼 */}
        <div className="lg:w-1/2">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">지분 구매</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">오류!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">성공!</strong>
              <span className="block sm:inline"> {success}</span>
            </div>
          )}
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">지분 정보</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">총 지분 수:</p>
                <p className="font-medium">{shareInfo.totalShares}개</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">남은 지분 수:</p>
                <p className="font-medium">{availableShares}개</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">지분당 가격:</p>
                <p className="font-medium text-green-600">{shareInfo.pricePerShare} AVAX</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">토큰화 주소:</p>
                <p className="font-medium truncate">{shareInfo.tokenizer}</p>
              </div>
            </div>
            
            {availableShares > 0 ? (
              <>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sharesToBuy">
                    구매할 지분 수
                  </label>
                  <div className="flex">
                    <input
                      className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="sharesToBuy"
                      type="number"
                      min="1"
                      max={availableShares}
                      value={sharesToBuy}
                      onChange={handleSharesChange}
                      disabled={loading}
                    />
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r"
                      type="button"
                      onClick={handleMaxShares}
                      disabled={loading}
                    >
                      최대
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    최대 {availableShares}개까지 구매 가능합니다.
                  </p>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2">구매 요약</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-gray-600">구매 지분 수:</div>
                    <div className="text-sm font-medium text-right">{sharesToBuy}개</div>
                    
                    <div className="text-sm text-gray-600">지분당 가격:</div>
                    <div className="text-sm font-medium text-right">{shareInfo.pricePerShare} AVAX</div>
                    
                    <div className="text-sm text-gray-600">총 구매 가격:</div>
                    <div className="text-sm font-medium text-green-600 text-right">{totalPrice} AVAX</div>
                  </div>
                </div>
                
                <button
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button"
                  onClick={handleBuyShares}
                  disabled={loading || !account || sharesToBuy <= 0 || sharesToBuy > availableShares}
                >
                  {loading ? '처리 중...' : '지분 구매하기'}
                </button>
              </>
            ) : (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
                <strong className="font-bold">알림!</strong>
                <span className="block sm:inline"> 현재 구매 가능한 지분이 없습니다.</span>
              </div>
            )}
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">내 보유 지분</h3>
            
            {account ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button
                    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={() => navigate('/my-shares')}
                  >
                    내 지분 관리하기
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">지갑을 연결하여 보유 지분을 확인하세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuySharesForm; 