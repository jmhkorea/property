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
};

export default PropertyDetail;