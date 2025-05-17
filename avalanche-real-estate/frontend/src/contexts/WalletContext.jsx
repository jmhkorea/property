import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// 지갑 컨텍스트 생성
const WalletContext = createContext();

// 지갑 컨텍스트 훅
export const useWallet = () => useContext(WalletContext);

// 아발란체 네트워크 정보
const avalancheNetworks = {
  mainnet: {
    chainId: '0xA86A',
    chainName: 'Avalanche C-Chain',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io/'],
  },
  fuji: {
    chainId: '0xA869',
    chainName: 'Avalanche Fuji Testnet',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://testnet.snowtrace.io/'],
  },
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  // 개발 환경 또는 프로덕션 환경에 따라 사용할 네트워크 설정
  const networkInfo = process.env.REACT_APP_NETWORK === 'mainnet' 
    ? avalancheNetworks.mainnet 
    : avalancheNetworks.fuji;
  
  const targetChainId = parseInt(networkInfo.chainId, 16);
  
  // 저장된 계정 확인 함수를
  // useCallback으로 메모이제이션
  const checkIfWalletIsConnected = useCallback(async (ethersProvider) => {
    try {
      // 현재 체인 ID 확인
      const { chainId: currentChainId } = await ethersProvider.getNetwork();
      setChainId(currentChainId);
      setIsCorrectNetwork(currentChainId === targetChainId);
      
      // 연결된 계정 확인
      const accounts = await ethersProvider.listAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (err) {
      console.error(err);
      setError('지갑 연결 상태를 확인하는 중 오류가 발생했습니다.');
    }
  }, [targetChainId]);
  
  // 지갑 연결 초기화
  useEffect(() => {
    // MetaMask 설치 확인
    if (window.ethereum) {
      // 이더리움 공급자 생성
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      setProvider(ethersProvider);
      
      // 저장된 계정 확인
      checkIfWalletIsConnected(ethersProvider);
      
      // 계정 변경 이벤트 리스너
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });
      
      // 체인 변경 이벤트 리스너
      window.ethereum.on('chainChanged', (chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        setIsCorrectNetwork(newChainId === targetChainId);
      });
    } else {
      setError('MetaMask가 설치되어 있지 않습니다.');
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [targetChainId, checkIfWalletIsConnected]);
  
  // 지갑 연결
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask가 설치되어 있지 않습니다.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 계정 요청
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        
        // 체인 ID 확인
        const currentChainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        
        const parsedChainId = parseInt(currentChainId, 16);
        setChainId(parsedChainId);
        
        // 올바른 네트워크인지 확인
        if (parsedChainId !== targetChainId) {
          setIsCorrectNetwork(false);
        } else {
          setIsCorrectNetwork(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError('지갑 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 네트워크 전환
  const switchNetwork = async () => {
    if (!window.ethereum) {
      setError('MetaMask가 설치되어 있지 않습니다.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 네트워크 전환 요청
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkInfo.chainId }],
      });
      
      // 성공적으로 전환되면 체인 ID 업데이트
      setChainId(targetChainId);
      setIsCorrectNetwork(true);
    } catch (err) {
      // 네트워크가 메타마스크에 추가되어 있지 않은 경우
      if (err.code === 4902) {
        try {
          // 네트워크 추가 요청
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkInfo],
          });
          
          // 성공적으로 추가되면 체인 ID 업데이트
          setChainId(targetChainId);
          setIsCorrectNetwork(true);
        } catch (addError) {
          console.error(addError);
          setError('네트워크 추가에 실패했습니다.');
        }
      } else {
        console.error(err);
        setError('네트워크 전환에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 지갑 연결 해제
  const disconnectWallet = () => {
    setAccount(null);
  };
  
  // 컨텍스트 값
  const value = {
    account,
    chainId,
    provider,
    error,
    loading,
    isCorrectNetwork,
    networkInfo,
    connectWallet,
    switchNetwork,
    disconnectWallet,
  };
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext; 