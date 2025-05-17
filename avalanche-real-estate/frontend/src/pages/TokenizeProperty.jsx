import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TokenizePropertyForm from '../components/TokenizePropertyForm';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

const TokenizeProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { account } = useWallet();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/properties/${id}`);
        setProperty(response.data);
        
        // 사용자가 부동산 소유자인지 확인
        if (response.data.ownerAddress !== account) {
          setError('이 부동산의 소유자만 토큰화할 수 있습니다.');
        }
        
        // 이미 토큰화되었는지 확인
        if (response.data.isTokenized) {
          setError('이 부동산은 이미 토큰화되었습니다.');
        }
      } catch (err) {
        console.error('부동산 정보 로드 오류:', err);
        setError('부동산 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id, account]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">부동산 토큰화</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">오류!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => navigate(`/property/${id}`)}
          >
            부동산 정보로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          className="text-blue-500 hover:text-blue-700 flex items-center"
          onClick={() => navigate(`/property/${id}`)}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          부동산 정보로 돌아가기
        </button>
      </div>
      
      <TokenizePropertyForm />
    </div>
  );
};

export default TokenizeProperty; 