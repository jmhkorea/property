import { http, HttpResponse } from 'msw';
import { valuations } from '../data/valuation.data';
import { properties } from '../data/property.data';

// 서버와 동일한 로직 처리를 위한 유틸리티 함수
let nextId = valuations.length + 1;
const generateId = () => `val${nextId++}`;

export const valuationHandlers = [
  // 모든 부동산 평가 조회
  http.get('/api/valuations', () => {
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: valuations
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 단일 부동산 평가 조회
  http.get('/api/valuations/:id', ({ params }) => {
    const { id } = params;
    const valuation = valuations.find(val => val._id === id);
    
    if (!valuation) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '평가 정보를 찾을 수 없습니다.'
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
        data: valuation
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 새 부동산 평가 생성
  http.post('/api/valuations', async ({ request }) => {
    const newValuation = await request.json();
    
    const valuationToSave = {
      _id: generateId(),
      ...newValuation,
      status: 'pending_review',
      recordedOnChain: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 실제 서버에선 DB에 저장하지만, 여기서는 메모리에 임시 저장
    valuations.push(valuationToSave);
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: valuationToSave
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 부동산 평가 업데이트
  http.put('/api/valuations/:id', async ({ request }) => {
    const { id } = request.params;
    const updatedData = await request.json();
    
    const index = valuations.findIndex(val => val._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 평가를 찾을 수 없습니다.'
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
    const updatedValuation = {
      ...valuations[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    valuations[index] = updatedValuation;
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: updatedValuation
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 평가 문서 추가 엔드포인트
  http.post('/api/valuations/:id/documents', async ({ request }) => {
    const { id } = request.params;
    const documentData = await request.json();
    
    const index = valuations.findIndex(val => val._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 평가를 찾을 수 없습니다.'
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
    
    if (!valuations[index].documents) {
      valuations[index].documents = [];
    }
    
    valuations[index].documents.push(document);
    valuations[index].updatedAt = new Date().toISOString();
    
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
  
  // 평가 상태 업데이트 (승인/거부 등)
  http.patch('/api/valuations/:id/status', async ({ request }) => {
    const { id } = request.params;
    const { status, approvedBy } = await request.json();
    
    const index = valuations.findIndex(val => val._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 평가를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    valuations[index].status = status;
    
    if (status === 'approved' && approvedBy) {
      valuations[index].approvedBy = approvedBy;
    }
    
    valuations[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: valuations[index]
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 블록체인 기록 상태 업데이트
  http.patch('/api/valuations/:id/blockchain', async ({ request }) => {
    const { id } = request.params;
    const { recordedOnChain, transactionHash, blockchainValuationId } = await request.json();
    
    const index = valuations.findIndex(val => val._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '부동산 평가를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    valuations[index].recordedOnChain = recordedOnChain;
    
    if (transactionHash) {
      valuations[index].transactionHash = transactionHash;
    }
    
    if (blockchainValuationId) {
      valuations[index].blockchainValuationId = blockchainValuationId;
    }
    
    valuations[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: valuations[index]
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