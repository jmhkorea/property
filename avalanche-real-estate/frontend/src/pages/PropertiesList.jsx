import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { propertyAPI, searchAPI } from '../services/api.service';

const PropertiesList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 검색 및 필터링
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    tokenized: ''
  });
  
  // 정렬
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // 필터 패널 토글
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    // 처음 로드 시 모든 부동산 목록 가져오기
    fetchProperties();
  }, [filters, searchTerm, currentPage, fetchProperties]);
  
  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // 검색어가 있는 경우 검색 API 사용
      if (searchTerm.trim()) {
        const searchParams = {
          query: searchTerm,
          ...filters,
          page: currentPage,
          limit: 12,
          sortBy,
          sortOrder
        };
        
        const response = await searchAPI.advancedPropertySearch(searchParams);
        setProperties(response.data.properties);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.totalCount);
      } else {
        // 검색어가 없는 경우 일반 목록 API 사용
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 12,
          sortBy,
          sortOrder,
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
        });
        
        const response = await propertyAPI.getAllProperties(queryParams.toString());
        setProperties(response.data.properties);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.totalCount);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('부동산 목록 조회 중 오류 발생:', error);
      setError('부동산 목록을 불러오는 데 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 1페이지로 이동
    fetchProperties();
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSortChange = (e) => {
    const value = e.target.value;
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'AVAX',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price).replace('AVAX', '') + ' AVAX';
  };
  
  const propertyTypes = {
    residential: '주거용',
    commercial: '상업용',
    industrial: '산업용',
    land: '토지'
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen pb-12">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 py-10 mb-8 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white">
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-bold mb-2">부동산 목록</h1>
              <p className="text-blue-100">아발란체 블록체인으로 토큰화된 부동산 자산을 찾아보세요</p>
            </div>
            <Link 
              to="/register-property" 
              className="mt-4 md:mt-0 bg-white text-indigo-700 px-6 py-2 rounded-full font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              부동산 등록하기
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        {/* 검색바 */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="부동산명, 주소로 검색..."
                  className="w-full py-3 pl-5 pr-12 rounded-lg border border-gray-300 shadow-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white hover:shadow-lg"
                />
                <button 
                  type="submit"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
            </div>
            
            <div className="flex gap-2">
              <div className="relative min-w-[160px]">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={handleSortChange}
                  className="appearance-none bg-white w-full py-3 pl-4 pr-10 rounded-lg border border-gray-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="createdAt-desc">최신 등록순</option>
                  <option value="createdAt-asc">오래된 등록순</option>
                  <option value="price-asc">가격 낮은순</option>
                  <option value="price-desc">가격 높은순</option>
                  <option value="size-asc">면적 작은순</option>
                  <option value="size-desc">면적 큰순</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-5 py-3 rounded-lg border text-sm font-medium flex items-center transition-all duration-300 shadow-md ${
                  showFilters 
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } hover:shadow-lg transform hover:-translate-y-px`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                필터
                {Object.values(filters).some(value => value !== '') && (
                  <span className="ml-1 flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* 필터 패널 */}
          {showFilters && (
            <div className="mt-4 bg-white p-6 rounded-lg shadow-lg border border-gray-200 animate-fadeIn transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                <div className="transition-all duration-200 hover:bg-gray-50 p-3 rounded-md">
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1.5">부동산 유형</label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={filters.propertyType}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">전체</option>
                    <option value="residential">주거용</option>
                    <option value="commercial">상업용</option>
                    <option value="industrial">산업용</option>
                    <option value="land">토지</option>
                  </select>
                </div>
                
                <div className="transition-all duration-200 hover:bg-gray-50 p-3 rounded-md">
                  <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1.5">최소 가격 (AVAX)</label>
                  <input
                    type="number"
                    id="minPrice"
                    name="minPrice"
                    min="0"
                    step="0.01"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="최소 가격"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="transition-all duration-200 hover:bg-gray-50 p-3 rounded-md">
                  <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1.5">최대 가격 (AVAX)</label>
                  <input
                    type="number"
                    id="maxPrice"
                    name="maxPrice"
                    min="0"
                    step="0.01"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="최대 가격"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="transition-all duration-200 hover:bg-gray-50 p-3 rounded-md">
                  <label htmlFor="tokenized" className="block text-sm font-medium text-gray-700 mb-1.5">토큰화 여부</label>
                  <select
                    id="tokenized"
                    name="tokenized"
                    value={filters.tokenized}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">전체</option>
                    <option value="true">토큰화됨</option>
                    <option value="false">토큰화되지 않음</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({
                      propertyType: '',
                      minPrice: '',
                      maxPrice: '',
                      tokenized: ''
                    });
                  }}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    fetchProperties();
                    setShowFilters(false);
                  }}
                  className="px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  필터 적용
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 검색 결과 요약 */}
        <div className="flex justify-between items-center mb-6 text-gray-600">
          <p className="animate-fadeIn">
            총 <span className="font-semibold text-indigo-700">{totalCount}</span>개의 부동산
          </p>
          <p className="animate-fadeIn">
            {currentPage} / {totalPages} 페이지
          </p>
        </div>
        
        {/* 부동산 목록 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 mb-6 rounded-r shadow-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 py-16 px-4 text-center animate-fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">조건에 맞는 부동산이 없습니다</h3>
            <p className="mt-2 text-base text-gray-500">검색 조건을 변경하거나 새로운 부동산을 등록해보세요.</p>
            <div className="mt-6">
              <Link
                to="/register-property" 
                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-1"
              >
                부동산 등록하기
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property, index) => (
                <div 
                  key={property._id} 
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full transform hover:-translate-y-1 animate-fadeIn" 
                  style={{animationDelay: `${index * 50}ms`}}
                >
                  <div className="relative group">
                    <img 
                      src={property.imageUrl || 'https://via.placeholder.com/400x240?text=No+Image'} 
                      alt={property.title}
                      className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {property.isTokenized && (
                      <div className="absolute top-0 right-0 mt-3 mr-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                        토큰화됨
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1.5 line-clamp-1">{property.title}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {property.location}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
                        {propertyTypes[property.propertyType] || property.propertyType}
                      </span>
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full border border-indigo-200">
                        {property.size} m²
                      </span>
                    </div>
                    <div className="text-xl font-bold text-indigo-600 mb-3">
                      {formatPrice(property.price)}
                    </div>
                  </div>
                  <div className="px-5 pb-5 mt-auto">
                    <Link
                      to={`/property/${property._id}`}
                      className="block w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 text-center transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      상세 정보 보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <nav className="inline-flex items-center rounded-md shadow-md" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2.5 rounded-l-md border ${
                      currentPage === 1
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors duration-200'
                    }`}
                  >
                    <span className="sr-only">이전</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* 페이지 번호들 */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // 현재 페이지를 중심으로 페이지 번호 계산
                    const pageNumbers = [];
                    const lowerBound = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    const upperBound = Math.min(totalPages, lowerBound + 4);
                    
                    for (let j = lowerBound; j <= upperBound; j++) {
                      pageNumbers.push(j);
                    }
                    
                    return pageNumbers.map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2.5 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors duration-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ));
                  })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2.5 rounded-r-md border ${
                      currentPage === totalPages
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors duration-200'
                    }`}
                  >
                    <span className="sr-only">다음</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PropertiesList; 