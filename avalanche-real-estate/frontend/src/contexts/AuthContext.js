import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth.service';

export const AuthContext = createContext();

// useAuth 훅 추가
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다.');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 사용자 정보 초기화
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          
          // 최신 프로필 정보 조회
          try {
            const profile = await authService.getProfile();
            setUser(profile);
          } catch (error) {
            console.error('프로필 조회 오류:', error);
          }
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 회원가입
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const data = await authService.register(userData);
      setUser(data.user);
      toast.success('회원가입이 완료되었습니다.');
      navigate('/');
      return data;
    } catch (error) {
      toast.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // 로그인
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const data = await authService.login(email, password);
      setUser(data.user);
      toast.success('로그인이 완료되었습니다.');
      navigate('/');
      return data;
    } catch (error) {
      toast.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // 로그아웃
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    toast.info('로그아웃되었습니다.');
    navigate('/login');
  }, [navigate]);

  // 비밀번호 변경
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const data = await authService.changePassword(currentPassword, newPassword);
      toast.success('비밀번호가 변경되었습니다.');
      return data;
    } catch (error) {
      toast.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 지갑 연결
  const connectWallet = useCallback(async (walletAddress) => {
    try {
      setLoading(true);
      const data = await authService.connectWallet(walletAddress);
      
      // 사용자 정보 업데이트
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        currentUser.walletAddress = walletAddress;
        setUser(currentUser);
      }
      
      toast.success('지갑이 연결되었습니다.');
      return data;
    } catch (error) {
      toast.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 컨텍스트 값
  const value = {
    user,
    loading,
    isAuthenticated: !!user, // user 객체가 있으면 인증된 상태
    register,
    login,
    logout,
    changePassword,
    connectWallet,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 