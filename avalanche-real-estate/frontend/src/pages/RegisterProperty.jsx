import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { propertyAPI } from '../services/api.service';
import { AuthContext } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext.jsx';

const RegisterProperty = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { account, connectWallet } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    propertyType: 'residential',
    size: '',
    price: '',
    rooms: '',
    bathrooms: '',
    buildYear: '',
    imageFile: null,
    imagePreview: null,
    latitude: '',
    longitude: ''
  });
  
  const propertyTypes = [
    { value: 'residential', label: '주거용' },
    { value: 'commercial', label: '상업용' },
    { value: 'industrial', label: '산업용' },
    { value: 'land', label: '토지' }
  ];
  
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result
        }));
      };
      
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleLocationSearch = async () => {
    if (!formData.location) {
      toast.error('주소를 입력해주세요.');
      return;
    }
    
    try {
      // 여기서 실제로는 지도 API를 사용하여 좌표를 가져옵니다.
      // 예: Google Maps Geocoding API, Kakao Maps API 등
      
      // 임시로 랜덤한 좌표 생성 (실제 구현에서는 제대로 된 API 호출 필요)
      const latitude = (37.5 + (Math.random() * 0.1)).toFixed(6);
      const longitude = (127.0 + (Math.random() * 0.1)).toFixed(6);
      
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude
      }));
      
      toast.success('위치 정보가 갱신되었습니다.');
    } catch (error) {
      toast.error('위치 정보를 가져오는데 실패했습니다.');
    }
  };
  
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('부동산 제목을 입력해주세요.');
      return false;
    }
    
    if (!formData.location.trim()) {
      toast.error('부동산 위치를 입력해주세요.');
      return false;
    }
    
    if (!formData.size || formData.size <= 0) {
      toast.error('올바른 면적을 입력해주세요.');
      return false;
    }
    
    if (!formData.price || formData.price <= 0) {
      toast.error('올바른 가격을 입력해주세요.');
      return false;
    }
    
    if (!formData.imageFile) {
      toast.error('부동산 이미지를 업로드해주세요.');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!account) {
      toast.info('부동산을 등록하려면 지갑 연결이 필요합니다.');
      connectWallet();
      return;
    }
    
    try {
      setLoading(true);
      
      // FormData 객체 생성 (이미지 파일 전송을 위해)
      const formDataToSend = new FormData();
      
      // 기본 정보 추가
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('propertyType', formData.propertyType);
      formDataToSend.append('size', formData.size);
      formDataToSend.append('price', formData.price);
      
      // 선택적 정보 추가
      if (formData.rooms) formDataToSend.append('rooms', formData.rooms);
      if (formData.bathrooms) formDataToSend.append('bathrooms', formData.bathrooms);
      if (formData.buildYear) formDataToSend.append('buildYear', formData.buildYear);
      if (formData.latitude) formDataToSend.append('latitude', formData.latitude);
      if (formData.longitude) formDataToSend.append('longitude', formData.longitude);
      
      // 이미지 파일 추가
      formDataToSend.append('image', formData.imageFile);
      
      // 지갑 주소 추가
      formDataToSend.append('walletAddress', account);
      
      // API 호출
      const response = await propertyAPI.createProperty(formDataToSend);
      
      toast.success('부동산이 성공적으로 등록되었습니다.');
      
      // 등록된 부동산 상세 페이지로 이동
      navigate(`/property/${response.data._id}`);
    } catch (error) {
      console.error('부동산 등록 중 오류 발생:', error);
      toast.error('부동산 등록에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">새 부동산 등록</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 섹션 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    부동산 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="서울 강남구 고급 아파트"
                  />
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    상세 설명
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="부동산에 대한 상세 설명을 입력해주세요."
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    위치 (주소) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="서울특별시 강남구 테헤란로 123"
                    />
                    <button
                      type="button"
                      onClick={handleLocationSearch}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                    부동산 유형 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {propertyTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                    면적 (㎡) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    가격 (AVAX) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>
            
            {/* 추가 정보 섹션 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">추가 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-1">
                    방 개수
                  </label>
                  <input
                    type="number"
                    id="rooms"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleChange}
                    min="0"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="3"
                  />
                </div>
                
                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    욕실 개수
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min="0"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="2"
                  />
                </div>
                
                <div>
                  <label htmlFor="buildYear" className="block text-sm font-medium text-gray-700 mb-1">
                    건축년도
                  </label>
                  <input
                    type="number"
                    id="buildYear"
                    name="buildYear"
                    value={formData.buildYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="2020"
                  />
                </div>
              </div>
            </div>
            
            {/* 이미지 업로드 섹션 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">이미지 업로드</h2>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {formData.imagePreview ? (
                    <div className="mb-3">
                      <img
                        src={formData.imagePreview}
                        alt="부동산 미리보기"
                        className="mx-auto h-64 object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="imageFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>이미지 파일 업로드</span>
                      <input
                        id="imageFile"
                        name="imageFile"
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">또는 파일을 끌어다 놓으세요</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF 최대 10MB</p>
                </div>
              </div>
            </div>
            
            {/* 위치 정보 섹션 (좌표) */}
            <div>
              <h2 className="text-xl font-semibold mb-4">위치 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    위도
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="37.5665"
                    readOnly
                  />
                </div>
                
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    경도
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="126.9780"
                    readOnly
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                정확한 위치 정보를 얻으려면 '위치 (주소)' 필드에 주소를 입력한 후 검색 버튼을 클릭하세요.
              </p>
            </div>
            
            {/* 제출 버튼 */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/properties')}
                  className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      등록 중...
                    </>
                  ) : '부동산 등록하기'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterProperty; 