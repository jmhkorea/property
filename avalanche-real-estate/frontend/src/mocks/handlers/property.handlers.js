import { http, HttpResponse } from 'msw';
import { properties } from '../data/property.data';

// 서버와 동일한 로직 처리를 위한 유틸리티 함수
let nextId = properties.length + 1;
const generateId = () => `prop${nextId++}`;

export const propertyHandlers = [
  // 모든 부동산 목록 조회
  http.get('/api/properties', ({ request }) => {
    const url = new URL(request.url);
    // 필터링 옵션 (선택사항)
    const propertyType = url.searchParams.get('propertyType');
    const status = url.searchParams.get('status');
    const minValue = url.searchParams.get('minValue');
    const maxValue = url.searchParams.get('maxValue');
    
    let result = [...properties];
    
    // 필터 적용
    if (propertyType) {
      result = result.filter(prop => prop.propertyType === propertyType);
    }
    
    if (status) {
      result = result.filter(prop => prop.status === status);
    }
    
    if (minValue) {
      result = result.filter(prop => prop.financial.currentValue >= Number(minValue));
    }
    
    if (maxValue) {
      result = result.filter(prop => prop.financial.currentValue <= Number(maxValue));
    }
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 단일 부동산 조회
  http.get('/api/properties/:id', ({ params }) => {
    const { id } = params;
    const property = properties.find(prop => prop._id === id);
    
    if (!property) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: property
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 새 부동산 등록
  http.post('/api/properties', async ({ request }) => {
    const newProperty = await request.json();
    
    const propertyToSave = {
      _id: generateId(),
      ...newProperty,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 실제 서버에선 DB에 저장하지만, 여기서는 메모리에 임시 저장
    properties.push(propertyToSave);
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: propertyToSave
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 부동산 정보 업데이트
  http.put('/api/properties/:id', async ({ params, request }) => {
    const { id } = params;
    const updatedData = await request.json();
    
    const index = properties.findIndex(prop => prop._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 기존 데이터와 업데이트 데이터 병합
    const updatedProperty = {
      ...properties[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    properties[index] = updatedProperty;
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: updatedProperty
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 부동산 문서 추가 엔드포인트
  http.post('/api/properties/:id/documents', async ({ params, request }) => {
    const { id } = params;
    const documentData = await request.json();
    
    const index = properties.findIndex(prop => prop._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 새 문서 추가
    const document = {
      ...documentData,
      uploadedAt: new Date().toISOString()
    };
    
    if (!properties[index].documents) {
      properties[index].documents = [];
    }
    
    properties[index].documents.push(document);
    properties[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: document
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 부동산 상태 업데이트 (승인/토큰화 등)
  http.patch('/api/properties/:id/status', async ({ params, request }) => {
    const { id } = params;
    const { status } = await request.json();
    
    const index = properties.findIndex(prop => prop._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    properties[index].status = status;
    properties[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: properties[index]
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 부동산 토큰화 정보 업데이트
  http.patch('/api/properties/:id/tokenize', async ({ params, request }) => {
    const { id } = params;
    const { tokenAddress, totalTokens, tokenPrice } = await request.json();
    
    const index = properties.findIndex(prop => prop._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 토큰화 정보 업데이트
    properties[index].ownership = {
      tokenized: true,
      tokenAddress,
      totalTokens,
      tokenPrice
    };
    
    properties[index].status = 'tokenized';
    properties[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: properties[index]
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 부동산 미디어(이미지 등) 업로드
  http.post('/api/properties/:id/media', async ({ params, request }) => {
    const { id } = params;
    const { mediaType, mediaUrl } = await request.json();
    
    const index = properties.findIndex(prop => prop._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 미디어 타입에 따라 적절한 배열에 추가
    if (mediaType === 'image') {
      if (!properties[index].media.images) {
        properties[index].media.images = [];
      }
      properties[index].media.images.push(mediaUrl);
    } else if (mediaType === 'floorPlan') {
      if (!properties[index].media.floorPlans) {
        properties[index].media.floorPlans = [];
      }
      properties[index].media.floorPlans.push(mediaUrl);
    } else if (mediaType === 'mainImage') {
      properties[index].media.mainImage = mediaUrl;
    } else if (mediaType === 'virtualTour') {
      properties[index].media.virtualTour = mediaUrl;
    }
    
    properties[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: properties[index].media
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  })
]; 