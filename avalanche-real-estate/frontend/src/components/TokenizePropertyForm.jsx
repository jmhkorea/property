import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import { useWallet } from '../contexts/WalletContext';
import { toast } from 'react-toastify';
import RealEstateNFTABI from '../contracts/RealEstateNFT.json';
import FractionalOwnershipABI from '../contracts/FractionalOwnership.json';

const TokenizePropertyForm = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { account, provider, isCorrectNetwork, switchNetwork } = useWallet();
  
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    totalShares: '100',
    pricePerShare: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState('notApproved');
  const [isApproved, setIsApproved] = useState(false);
  
  // 부동산 정보 로드
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/properties/${propertyId}`);
        setProperty(response.data);
        
        // 초기 지분 가격 설정 (부동산 가치 / 지분 수)
        const appraisedValue = ethers.utils.formatEther(response.data.appraisedValue);
        const initialPricePerShare = (parseFloat(appraisedValue) / 100).toFixed(2);
        
        setFormData(prev => ({
          ...prev,
          pricePerShare: initialPricePerShare
        }));
        
        // 승인 상태 확인
        if (account && provider) {
          checkApprovalStatus();
        }
      } catch (err) {
        console.error('부동산 정보 로드 오류:', err);
        setError('부동산 정보를 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId, account, provider]);
  
  useEffect(() => {
    if (account && provider) {
      checkApprovalStatus();
    }
  }, [account, provider, checkApprovalStatus]);
  
  // 승인 상태 확인
  const checkApprovalStatus = useCallback(async () => {
    try {
      const realEstateNFTContract = new ethers.Contract(
        process.env.REACT_APP_REAL_ESTATE_NFT_ADDRESS,
        RealEstateNFTABI.abi,
        provider
      );
      
      const isApproved = await realEstateNFTContract.isApprovedForAll(
        account,
        process.env.REACT_APP_FRACTIONAL_OWNERSHIP_ADDRESS
      );
      
      setIsApproved(isApproved);
    } catch (err) {
      console.error('승인 상태 확인 오류:', err);
    }
  }, [account, provider]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleApprove = async () => {
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
      
      const signer = provider.getSigner();
      const realEstateNFTContract = new ethers.Contract(
        process.env.REACT_APP_REAL_ESTATE_NFT_ADDRESS,
        RealEstateNFTABI.abi,
        signer
      );
      
      // 토큰화 컨트랙트에 NFT 승인
      const tx = await realEstateNFTContract.approve(
        process.env.REACT_APP_FRACTIONAL_OWNERSHIP_ADDRESS,
        propertyId
      );
      
      // 트랜잭션 확인 대기
      const receipt = await tx.wait();
      console.log('승인 트랜잭션 완료:', receipt);
      
      setApprovalStatus('approved');
    } catch (err) {
      console.error('NFT 승인 오류:', err);
      setError(err.message || 'NFT 승인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account) {
      setError('지갑이 연결되어 있지 않습니다. 먼저 지갑을 연결해주세요.');
      return;
    }
    
    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }
    
    if (approvalStatus !== 'approved') {
      setError('먼저 NFT 승인이 필요합니다.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 입력값 검증
      const totalShares = parseInt(formData.totalShares);
      const pricePerShare = ethers.utils.parseEther(formData.pricePerShare);
      
      if (isNaN(totalShares) || totalShares <= 0) {
        throw new Error('유효한 지분 수를 입력해주세요.');
      }
      
      if (pricePerShare.lte(0)) {
        throw new Error('유효한 지분 가격을 입력해주세요.');
      }
      
      // 계약 인스턴스 생성
      const signer = provider.getSigner();
      const fractionalOwnershipContract = new ethers.Contract(
        process.env.REACT_APP_FRACTIONAL_OWNERSHIP_ADDRESS,
        FractionalOwnershipABI.abi,
        signer
      );
      
      // 토큰화 트랜잭션 실행
      const tx = await fractionalOwnershipContract.tokenizeProperty(
        propertyId,
        totalShares,
        pricePerShare
      );
      
      // 트랜잭션 확인 대기
      const receipt = await tx.wait();
      console.log('토큰화 트랜잭션 완료:', receipt);
      
      // 이벤트에서 shareId 추출
      const event = receipt.events.find(e => e.event === 'PropertyTokenized');
      const shareId = event.args.shareId.toNumber();
      
      // 백엔드 업데이트
      await axios.post(`${process.env.REACT_APP_API_URL}/properties/tokenize`, {
        propertyId: propertyId,
        shareId: shareId,
        totalShares: totalShares,
        pricePerShare: ethers.utils.formatEther(pricePerShare),
        ownerAddress: account
      });
      
      // 성공 후 지분 구매 페이지로 이동
      navigate(`/buy-shares/${shareId}`);
      
    } catch (err) {
      console.error('부동산 토큰화 오류:', err);
      setError(err.message || '부동산 토큰화 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!property) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">부동산 토큰화</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">오류!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">부동산 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">주소:</p>
            <p className="font-medium">{property.propertyAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">유형:</p>
            <p className="font-medium">{property.propertyType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">면적:</p>
            <p className="font-medium">{property.squareMeters} m²</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">평가 가치:</p>
            <p className="font-medium text-green-600">{ethers.utils.formatEther(property.appraisedValue)} AVAX</p>
          </div>
        </div>
      </div>
      
      {account !== property.ownerAddress ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">알림!</strong>
          <span className="block sm:inline"> 해당 부동산의 소유자만 토큰화할 수 있습니다.</span>
        </div>
      ) : (
        <>
          {approvalStatus !== 'approved' && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">NFT 승인</h3>
              <p className="mb-4 text-gray-600">
                부동산을 토큰화하기 위해서는 먼저 분할 소유권 컨트랙트가 부동산 NFT를 사용할 수 있도록 승인해야 합니다.
              </p>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={handleApprove}
                disabled={loading}
              >
                {loading ? '처리 중...' : 'NFT 승인하기'}
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">토큰화 설정</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="totalShares">
                총 지분 수
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="totalShares"
                name="totalShares"
                type="number"
                min="1"
                placeholder="100"
                value={formData.totalShares}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                부동산을 몇 개의 지분으로 나눌지 설정합니다.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pricePerShare">
                지분당 가격 (AVAX)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="pricePerShare"
                name="pricePerShare"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="5"
                value={formData.pricePerShare}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                각 지분의 판매 가격을 AVAX로 설정합니다.
              </p>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-700 mb-2">요약 정보</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-600">총 지분 수:</div>
                <div className="text-sm font-medium text-right">{formData.totalShares}</div>
                
                <div className="text-sm text-gray-600">지분당 가격:</div>
                <div className="text-sm font-medium text-right">{formData.pricePerShare} AVAX</div>
                
                <div className="text-sm text-gray-600">총 토큰화 가치:</div>
                <div className="text-sm font-medium text-green-600 text-right">
                  {parseFloat(formData.totalShares || 0) * parseFloat(formData.pricePerShare || 0)} AVAX
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                disabled={loading || approvalStatus !== 'approved'}
              >
                {loading ? '처리 중...' : '토큰화하기'}
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={() => navigate(`/property/${propertyId}`)}
                disabled={loading}
              >
                취소
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default TokenizePropertyForm; 