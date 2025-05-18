import React from 'react';
import { Link } from 'react-router-dom';

// properties 데이터를 props로 받는 방식으로 변경
const PropertyList = ({ properties = [] }) => {
  // 부동산 유형 한글화
  const propertyTypes = {
    residential: '주거용',
    commercial: '상업용',
    industrial: '산업용',
    land: '토지',
    hospitality: '숙박시설'
  };

  // 가격 형식 변환 함수
  const formatPrice = (price) => {
    if (!price) return '0 AVAX';
    return price.toLocaleString() + ' 원';
  };

  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">등록된 부동산이 없습니다.</p>
        <Link 
          to="/register-property" 
          className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          부동산 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <Link 
          key={property._id} 
          to={`/property/${property._id}`}
          className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="relative overflow-hidden h-48">
            <img 
              src={property.media?.mainImage || "https://via.placeholder.com/400x300?text=부동산+이미지"} 
              alt={property.title || property.propertyAddress} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {property.status === 'tokenized' && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                토큰화됨
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-medium text-lg mb-1 truncate">{property.title || property.propertyAddress}</h3>
            <p className="text-gray-500 text-sm mb-2 truncate">{property.location?.address || property.propertyAddress}</p>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-semibold">
                {formatPrice(property.financial?.currentValue || property.financial?.purchasePrice || property.appraisedValue || 0)}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                {propertyTypes[property.propertyType] || property.propertyType || '기타'}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default PropertyList; 