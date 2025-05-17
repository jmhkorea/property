import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import { useWallet } from '../contexts/WalletContext';
import RealEstateNFTABI from '../contracts/RealEstateNFT.json';

const PropertyRegistrationForm = () => {
  const navigate = useNavigate();
  const { account, provider } = useWallet();
  
  const [formData, setFormData] = useState({
    propertyAddress: '',
    squareMeters: '',
    propertyType: '아파트',
    appraisedValue: '',
    latitude: '',
    longitude: '',
    documentFile: null,
    imageFile: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const propertyTypes = ['아파트', '주택', '오피스텔', '상가', '토지', '기타'];
  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'documentFile' || name === 'imageFile') {
      setFormData({
        ...formData,
        [name]: files[0]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const uploadToIPFS = async (file) => {
    try {
      // FormData 객체 생성
      const formData = new FormData();
      formData.append('file', file);
      
      // IPFS 업로드 (백엔드 API를 통해)
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/ipfs/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      return response.data.ipfsHash;
    } catch (error) {
      console.error('IPFS 업로드 오류:', error);
      throw new Error('파일 업로드에 실패했습니다.');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account) {
      setError('지갑이 연결되어 있지 않습니다. 먼저 지갑을 연결해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 필수 입력값 검증
      if (!formData.propertyAddress || !formData.squareMeters || !formData.appraisedValue || !formData.documentFile) {
        throw new Error('모든 필수 정보를 입력해주세요.');
      }
      
      // IPFS에 문서 업로드
      const documentIpfsHash = await uploadToIPFS(formData.documentFile);
      
      // 이미지가 있으면 IPFS에 업로드
      let imageIpfsHash = null;
      if (formData.imageFile) {
        imageIpfsHash = await uploadToIPFS(formData.imageFile);
      }
      
      // 계약 인스턴스 생성
      const signer = provider.getSigner();
      const realEstateNFTContract = new ethers.Contract(
        process.env.REACT_APP_CONTRACT_ADDRESS,
        RealEstateNFTABI.abi,
        signer
      );
      
      // 웨이로 변환
      const appraisedValueWei = ethers.utils.parseEther(formData.appraisedValue);
      
      // 문서 URI 생성
      const documentURI = `ipfs://${documentIpfsHash}`;
      
      // 백엔드에 먼저 부동산 정보 저장
      const propertyData = {
        propertyAddress: formData.propertyAddress,
        squareMeters: parseInt(formData.squareMeters),
        propertyType: formData.propertyType,
        appraisedValue: appraisedValueWei.toString(),
        latitude: formData.latitude || "0",
        longitude: formData.longitude || "0",
        documentURI: documentURI,
        imageURI: imageIpfsHash ? `ipfs://${imageIpfsHash}` : null,
        ownerAddress: account
      };
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/properties`, propertyData);
      
      // 스마트 컨트랙트에 부동산 등록
      const tx = await realEstateNFTContract.mintProperty(
        account,
        formData.propertyAddress,
        parseInt(formData.squareMeters),
        formData.propertyType,
        appraisedValueWei,
        documentURI,
        formData.latitude || "0",
        formData.longitude || "0"
      );
      
      // 트랜잭션 완료 대기
      await tx.wait();
      
      // 성공 후 부동산 목록 페이지로 이동
      navigate('/properties');
      
    } catch (err) {
      console.error('부동산 등록 오류:', err);
      setError(err.message || '부동산 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">부동산 등록</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">오류!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="propertyAddress">
            부동산 주소 <span className="text-red-500">*</span>
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="propertyAddress"
            name="propertyAddress"
            type="text"
            placeholder="서울시 강남구 테헤란로 152"
            value={formData.propertyAddress}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="squareMeters">
              면적 (m²) <span className="text-red-500">*</span>
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="squareMeters"
              name="squareMeters"
              type="number"
              min="1"
              placeholder="120"
              value={formData.squareMeters}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="propertyType">
              부동산 유형 <span className="text-red-500">*</span>
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              required
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="appraisedValue">
            평가 가치 (AVAX) <span className="text-red-500">*</span>
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="appraisedValue"
            name="appraisedValue"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="500"
            value={formData.appraisedValue}
            onChange={handleChange}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            현재 AVAX 가격을 기준으로 부동산 가치를 입력해주세요.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
              위도
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="latitude"
              name="latitude"
              type="text"
              placeholder="37.5024"
              value={formData.latitude}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
              경도
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="longitude"
              name="longitude"
              type="text"
              placeholder="127.0219"
              value={formData.longitude}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="documentFile">
            소유권 증서 파일 <span className="text-red-500">*</span>
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="documentFile"
            name="documentFile"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            소유권 증서, 등기부등본 등의 문서를 업로드해주세요. (PDF, JPG, PNG)
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="imageFile">
            부동산 이미지
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="imageFile"
            name="imageFile"
            type="file"
            accept="image/*"
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            부동산의 외관 또는 내부 이미지를 업로드해주세요. (선택사항)
          </p>
        </div>
        
        {loading && uploadProgress > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              파일 업로드 중... {uploadProgress}%
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={loading}
          >
            {loading ? '처리 중...' : '부동산 등록하기'}
          </button>
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={() => navigate('/properties')}
            disabled={loading}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyRegistrationForm; 