import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/properties`);
        setProperties(response.data);
        setLoading(false);
      } catch (err) {
        setError('부동산 목록을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchProperties();
  }, []);

  // AVAX 가격 형식 변환 함수
  const formatPrice = (price) => {
    return ethers.utils.formatEther(price) + ' AVAX';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">오류!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">부동산 목록</h2>
      
      {properties.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">등록된 부동산이 없습니다.</p>
          <Link 
            to="/register-property" 
            className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            부동산 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.tokenId} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="h-48 bg-gray-300 relative">
                {property.imageUrl ? (
                  <img 
                    src={property.imageUrl} 
                    alt={property.propertyAddress} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <span className="text-gray-500">이미지 없음</span>
                  </div>
                )}
                {property.isTokenized && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                    토큰화 완료
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{property.propertyAddress}</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">유형:</span>
                    <span className="font-medium">{property.propertyType}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">면적:</span>
                    <span className="font-medium">{property.squareMeters} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">평가 가치:</span>
                    <span className="font-medium text-green-600">{formatPrice(property.appraisedValue)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Link 
                    to={`/property/${property.tokenId}`} 
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-1 px-3 rounded"
                  >
                    상세 정보
                  </Link>
                  {!property.isTokenized ? (
                    <Link 
                      to={`/tokenize/${property.tokenId}`} 
                      className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold py-1 px-3 rounded"
                    >
                      토큰화하기
                    </Link>
                  ) : (
                    <Link 
                      to={`/buy-shares/${property.shareId}`} 
                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-1 px-3 rounded"
                    >
                      지분 구매
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyList; 