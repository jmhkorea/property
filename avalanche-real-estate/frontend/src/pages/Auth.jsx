import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../contexts/AuthContext';

const Auth = () => {
  const { login, register, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // 이전 페이지로 돌아가기 위한 정보
  const from = location.state?.from || '/';
  
  // 이미 인증된 사용자는 리디렉션
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from);
    }
  }, [isAuthenticated, navigate, from]);
  
  // URL 경로가 변경되면 로그인/회원가입 모드 업데이트
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('유효한 이메일 주소를 입력해주세요.');
      return false;
    }
    
    // 비밀번호 길이 검증
    if (formData.password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    
    // 회원가입 시 추가 검증
    if (!isLogin) {
      // 이름 입력 확인
      if (!formData.name.trim()) {
        toast.error('이름을 입력해주세요.');
        return false;
      }
      
      // 비밀번호 일치 확인
      if (formData.password !== formData.confirmPassword) {
        toast.error('비밀번호가 일치하지 않습니다.');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 유효성 검증
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (isLogin) {
        // 로그인 처리
        await login(formData.email, formData.password);
        // 로그인 성공 시 원래 접근하려던 페이지로 이동
        navigate(from);
      } else {
        // 회원가입 처리
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        // 회원가입 성공 시 원래 접근하려던 페이지로 이동
        navigate(from);
      }
    } catch (error) {
      // 오류는 AuthContext에서 이미 처리됨
      setLoading(false);
    }
  };
  
  // 로그인/회원가입 모드 전환(이전 페이지 정보 유지)
  const toggleAuthMode = () => {
    navigate(isLogin ? '/register' : '/login', { state: { from } });
  };
  
  // 로그인 없이 둘러보기
  const handleSkipAuth = () => {
    navigate('/properties');
  };
  
  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 패널: 인증 폼 */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">AVAX Estate</h1>
            </Link>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? '로그인' : '회원가입'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 
              '블록체인 기반 부동산 토큰화 플랫폼에 오신 것을 환영합니다.' : 
              '계정을 생성하고 아발란체 부동산 시장에 참여하세요.'}
          </p>

          <div className="mt-8">
            <div className="mt-6">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* 이름 필드 (회원가입 시에만 표시) */}
                {!isLogin && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      이름
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-3 sm:text-sm border-gray-300 rounded-md"
                        placeholder="홍길동"
                      />
                    </div>
                  </div>
                )}

                {/* 이메일 필드 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    이메일
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-3 sm:text-sm border-gray-300 rounded-md"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                {/* 비밀번호 필드 */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    비밀번호
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-3 sm:text-sm border-gray-300 rounded-md"
                      placeholder="********"
                      minLength={6}
                    />
                  </div>
                </div>

                {/* 비밀번호 확인 필드 (회원가입 시에만 표시) */}
                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      비밀번호 확인
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-3 sm:text-sm border-gray-300 rounded-md"
                        placeholder="********"
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {/* 로그인 상태 유지 체크박스 (로그인 시에만 표시) */}
                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                        로그인 상태 유지
                      </label>
                    </div>

                    <div className="text-sm">
                      <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                        비밀번호를 잊으셨나요?
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
                  >
                    {loading ? (
                      <>
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                        <span className="opacity-0">{isLogin ? '로그인' : '회원가입'}</span>
                      </>
                    ) : (
                      isLogin ? '로그인' : '회원가입'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      또는
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    onClick={handleSkipAuth}
                    className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>회원가입 없이 둘러보기</span>
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                >
                  {isLogin ? '회원가입' : '로그인'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 오른쪽 패널: 부동산 투자 정보 */}
      <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-blue-500 to-indigo-700 relative">
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold mb-6 animate-fade-in">블록체인 기술로 혁신적인 부동산 투자를 경험하세요</h2>
            <div className="space-y-8">
              <div className="flex items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="rounded-full bg-white bg-opacity-20 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold mb-1">안전한 블록체인 기술</h3>
                  <p className="text-blue-100">소액으로도 전문적인 부동산 투자를 시작하세요.</p>
                </div>
              </div>
              
              <div className="flex items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="rounded-full bg-white bg-opacity-20 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold mb-1">소액으로 시작하는 투자</h3>
                  <p className="text-blue-100">원하는 만큼만 투자하고 수익을 창출하세요.</p>
                </div>
              </div>
              
              <div className="flex items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="rounded-full bg-white bg-opacity-20 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold mb-1">투명한 거래 기록</h3>
                  <p className="text-blue-100">모든 거래가 블록체인에 기록되어 안전하게 보관됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 