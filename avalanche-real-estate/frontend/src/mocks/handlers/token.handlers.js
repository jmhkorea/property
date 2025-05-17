import { http, HttpResponse } from 'msw';
import { tokens, tokenTransactions } from '../data/token.data';

// 서버와 동일한 로직 처리를 위한 유틸리티 함수
let nextTokenId = tokens.length + 1;
const generateTokenId = () => `token${nextTokenId++}`;

let nextTransId = tokenTransactions.length + 1;
const generateTransactionId = () => `trans${nextTransId++}`;

export const tokenHandlers = [
  // 모든 토큰 목록 조회
  http.get('/api/tokens', ({ request }) => {
    const url = new URL(request.url);
    // 필터링 옵션 (선택사항)
    const propertyId = url.searchParams.get('propertyId');
    const tradingStatus = url.searchParams.get('tradingStatus');
    
    let result = [...tokens];
    
    // 필터 적용
    if (propertyId) {
      result = result.filter(token => token.property === propertyId);
    }
    
    if (tradingStatus) {
      result = result.filter(token => token.tradingStatus === tradingStatus);
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
  
  // 단일 토큰 조회
  http.get('/api/tokens/:id', ({ params }) => {
    const { id } = params;
    const token = tokens.find(t => t._id === id);
    
    if (!token) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
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
        data: token
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 토큰 생성
  http.post('/api/tokens', async ({ request }) => {
    const newToken = await request.json();
    
    const tokenToSave = {
      _id: generateTokenId(),
      ...newToken,
      tradingStatus: "pending",
      distributions: [],
      holders: [],
      tradingHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 실제 서버에선 DB에 저장하지만, 여기서는 메모리에 임시 저장
    tokens.push(tokenToSave);
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: tokenToSave
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 토큰 업데이트
  http.put('/api/tokens/:id', async ({ params, request }) => {
    const { id } = params;
    const updatedData = await request.json();
    
    const index = tokens.findIndex(t => t._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
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
    const updatedToken = {
      ...tokens[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    tokens[index] = updatedToken;
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: updatedToken
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 토큰 거래 상태 업데이트
  http.patch('/api/tokens/:id/trading-status', async ({ params, request }) => {
    const { id } = params;
    const { tradingStatus } = await request.json();
    
    const index = tokens.findIndex(t => t._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    tokens[index].tradingStatus = tradingStatus;
    tokens[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: tokens[index]
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 토큰 가격 업데이트
  http.patch('/api/tokens/:id/price', async ({ params, request }) => {
    const { id } = params;
    const { tokenPrice } = await request.json();
    
    const index = tokens.findIndex(t => t._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    tokens[index].tokenPrice = tokenPrice;
    tokens[index].marketCap = tokenPrice * tokens[index].totalSupply;
    tokens[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: tokens[index]
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 특정 토큰의 거래 내역 조회
  http.get('/api/tokens/:id/transactions', ({ params }) => {
    const { id } = params;
    const transactions = tokenTransactions.filter(tx => tx.token === id);
    
    if (!tokens.find(t => t._id === id)) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
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
        data: transactions
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 새 토큰 거래 생성
  http.post('/api/tokens/:id/transactions', async ({ params, request }) => {
    const { id } = params;
    const transactionData = await request.json();
    
    if (!tokens.find(t => t._id === id)) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const now = new Date().toISOString();
    
    const transaction = {
      _id: generateTransactionId(),
      token: id,
      ...transactionData,
      status: "pending",
      transactionDate: now,
      confirmationDate: null,
      createdAt: now,
      updatedAt: now
    };
    
    tokenTransactions.push(transaction);
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: transaction
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 특정 거래 정보 조회
  http.get('/api/transactions/:id', ({ params }) => {
    const { id } = params;
    const transaction = tokenTransactions.find(tx => tx._id === id);
    
    if (!transaction) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '거래 정보를 찾을 수 없습니다.'
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
        data: transaction
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 거래 상태 업데이트
  http.patch('/api/transactions/:id/status', async ({ params, request }) => {
    const { id } = params;
    const { status, transactionHash, gasUsed, gasFee } = await request.json();
    
    const index = tokenTransactions.findIndex(tx => tx._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '거래 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const now = new Date().toISOString();
    
    // 거래가 완료되었으면 관련 데이터 업데이트
    if (status === 'completed') {
      tokenTransactions[index].status = status;
      tokenTransactions[index].transactionHash = transactionHash || tokenTransactions[index].transactionHash;
      tokenTransactions[index].confirmationDate = now;
      tokenTransactions[index].gasUsed = gasUsed || tokenTransactions[index].gasUsed;
      tokenTransactions[index].gasFee = gasFee || tokenTransactions[index].gasFee;
      
      // 거래 내역 업데이트
      const tokenIndex = tokens.findIndex(t => t._id === tokenTransactions[index].token);
      
      if (tokenIndex !== -1) {
        // 새 거래 내역 추가
        const newTradeHistory = {
          date: now,
          price: tokenTransactions[index].pricePerToken,
          quantity: tokenTransactions[index].quantity,
          transactionHash: transactionHash || tokenTransactions[index].transactionHash
        };
        
        tokens[tokenIndex].tradingHistory.push(newTradeHistory);
        tokens[tokenIndex].lastTradeDate = now;
        tokens[tokenIndex].tokenPrice = tokenTransactions[index].pricePerToken;
        tokens[tokenIndex].marketCap = tokenTransactions[index].pricePerToken * tokens[tokenIndex].totalSupply;
        tokens[tokenIndex].updatedAt = now;
      }
    } else {
      tokenTransactions[index].status = status;
    }
    
    tokenTransactions[index].updatedAt = now;
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: tokenTransactions[index]
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 토큰 보유자 목록 조회
  http.get('/api/tokens/:id/holders', ({ params }) => {
    const { id } = params;
    const token = tokens.find(t => t._id === id);
    
    if (!token) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
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
        data: token.holders
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 토큰 분배 내역 조회
  http.get('/api/tokens/:id/distributions', ({ params }) => {
    const { id } = params;
    const token = tokens.find(t => t._id === id);
    
    if (!token) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
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
        data: token.distributions
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 새 토큰 분배 내역 추가
  http.post('/api/tokens/:id/distributions', async ({ params, request }) => {
    const { id } = params;
    const distributionData = await request.json();
    
    const tokenIndex = tokens.findIndex(t => t._id === id);
    
    if (tokenIndex === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '토큰 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    tokens[tokenIndex].distributions.push(distributionData);
    tokens[tokenIndex].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: distributionData
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  })
]; 