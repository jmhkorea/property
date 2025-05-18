import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 컨텍스트 제공자
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext.jsx';

// 레이아웃 컴포넌트
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// 페이지 컴포넌트
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import PropertiesList from './pages/PropertiesList';
import PropertyDetail from './pages/PropertyDetail';
import RegisterProperty from './pages/RegisterProperty';
import TokenizeProperty from './pages/TokenizeProperty';
import PropertyValuation from './pages/PropertyValuation';
import IncomeDistribution from './pages/IncomeDistribution';
import DeFi from './pages/DeFi';
import NFT from './pages/NFT';
import MyPortfolio from './pages/MyPortfolio';
import Learn from './pages/Learn';
import NotFound from './pages/NotFound';

// 인증이 필요한 라우트를 위한 래퍼 컴포넌트
const PrivateRoute = ({ children }) => {
  // localStorage에서 토큰 확인
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    // 인증되지 않은 경우 로그인 페이지로 리디렉션
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router basename="/property">
      <AuthProvider>
        <WalletProvider>
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <Navbar />
            
            <main className="flex-grow">
              <Routes>
                {/* 공개 라우트 */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/properties" element={<PropertiesList />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/learn" element={<Learn />} />
                
                {/* 인증이 필요한 라우트 */}
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/my-portfolio" 
                  element={
                    <PrivateRoute>
                      <MyPortfolio />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/register-property" 
                  element={
                    <PrivateRoute>
                      <RegisterProperty />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/tokenize-property/:id" 
                  element={
                    <PrivateRoute>
                      <TokenizeProperty />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/property/:propertyId/valuation" 
                  element={
                    <PrivateRoute>
                      <PropertyValuation />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/property/:propertyId/income" 
                  element={
                    <PrivateRoute>
                      <IncomeDistribution />
                    </PrivateRoute>
                  } 
                />
                
                {/* DeFi와 NFT 페이지 */}
                <Route path="/defi" element={<DeFi />} />
                <Route path="/nft" element={<NFT />} />
                
                {/* 404 페이지 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            <Footer />
          </div>
          
          {/* 토스트 알림 컨테이너 */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 