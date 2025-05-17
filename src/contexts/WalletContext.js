import React, { createContext, useState, useContext, useEffect } from 'react';

// 지갑 컨텍스트 생성
const WalletContext = createContext(null);

// 지갑 프로바이더 컴포넌트
export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 지갑 연결
  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 여기에는 실제로 MetaMask나 다른 지갑 프로바이더와 연결하는 로직이 들어가야 합니다.
      // 현재는 모의 데이터로 대체합니다.
      
      // MetaMask가 설치되어 있는지 확인
      if (window.ethereum) {
        try {
          // 계정 요청
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          
          // 잔액 조회
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [account, 'latest']
          });
          
          // 16진수 -> 10진수 변환 후 ETH 단위로 변환
          const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
          
          setAccount(account);
          setBalance(ethBalance);
          setConnected(true);
          
          // 계정 변경 이벤트 리스너
          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
              // 연결 해제됨
              disconnectWallet();
            } else {
              // 계정 변경됨
              setAccount(accounts[0]);
            }
          });
          
        } catch (error) {
          setError('지갑 연결을 거부했습니다.');
          console.error('지갑 연결 오류:', error);
        }
      } else {
        // 모의 데이터 (테스트용)
        setTimeout(() => {
          setAccount('0xabc123...');
          setBalance(10.5);
          setConnected(true);
        }, 1000);
        
        setError('MetaMask가 설치되어 있지 않습니다. 모의 지갑으로 연결합니다.');
      }
    } catch (err) {
      setError('지갑 연결 중 오류가 발생했습니다: ' + err.message);
      console.error('지갑 연결 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 지갑 연결 해제
  const disconnectWallet = () => {
    setAccount(null);
    setBalance(0);
    setConnected(false);
  };

  // 토큰 구매 함수 (예시)
  const buyTokens = async (tokenId, amount) => {
    if (!connected) {
      setError('지갑이 연결되어 있지 않습니다.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 실제로는 스마트 컨트랙트와 상호작용하는 코드가 들어갑니다.
      // 현재는 모의 기능으로 대체합니다.
      console.log(`토큰 구매: ${tokenId}, 수량: ${amount}`);
      
      // 구매 성공 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 잔액 업데이트 (예시)
      setBalance(prevBalance => prevBalance - amount * 0.01);
      
      return true;
    } catch (err) {
      setError('토큰 구매 중 오류가 발생했습니다: ' + err.message);
      console.error('토큰 구매 오류:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 컨텍스트 값
  const value = {
    account,
    balance,
    connected,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    buyTokens
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// useWallet 훅
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === null) {
    throw new Error('useWallet은 WalletProvider 내에서 사용해야 합니다.');
  }
  return context;
};

export default WalletContext; 