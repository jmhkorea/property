import { http, HttpResponse } from 'msw';
import { incomeDistributions } from '../data/income.data';

// 서버와 동일한 로직 처리를 위한 유틸리티 함수
let nextId = incomeDistributions.length + 1;
const generateId = () => `inc${nextId++}`;

export const incomeHandlers = [
  // 모든 수익 분배 목록 조회
  http.get('/api/income-distributions', ({ request }) => {
    const url = new URL(request.url);
    // 특정 부동산 필터링 (선택 사항)
    const propertyId = url.searchParams.get('propertyId');
    let result = incomeDistributions;
    
    if (propertyId) {
      result = incomeDistributions.filter(inc => inc.property === propertyId);
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
  
  // 단일 수익 분배 조회
  http.get('/api/income-distributions/:id', ({ params }) => {
    const { id } = params;
    const distribution = incomeDistributions.find(inc => inc._id === id);
    
    if (!distribution) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '수익 분배 정보를 찾을 수 없습니다.'
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
        data: distribution
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 새 수익 분배 생성
  http.post('/api/income-distributions', async ({ request }) => {
    const newDistribution = await request.json();
    
    const distributionToSave = {
      _id: generateId(),
      ...newDistribution,
      status: 'pending',
      recordedOnChain: false,
      tokenHolderDistribution: {
        totalDistributed: 0,
        perTokenAmount: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 실제 서버에선 DB에 저장하지만, 여기서는 메모리에 임시 저장
    incomeDistributions.push(distributionToSave);
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: distributionToSave
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 수익 분배 업데이트
  http.put('/api/income-distributions/:id', async ({ params, request }) => {
    const { id } = params;
    const updatedData = await request.json();
    
    const index = incomeDistributions.findIndex(inc => inc._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '수익 분배 정보를 찾을 수 없습니다.'
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
    const updatedDistribution = {
      ...incomeDistributions[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    incomeDistributions[index] = updatedDistribution;
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: updatedDistribution
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 수익 분배 문서 추가 엔드포인트
  http.post('/api/income-distributions/:id/documents', async ({ params, request }) => {
    const { id } = params;
    const documentData = await request.json();
    
    const index = incomeDistributions.findIndex(inc => inc._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '수익 분배 정보를 찾을 수 없습니다.'
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
    
    if (!incomeDistributions[index].documents) {
      incomeDistributions[index].documents = [];
    }
    
    incomeDistributions[index].documents.push(document);
    incomeDistributions[index].updatedAt = new Date().toISOString();
    
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
  
  // 수익 분배 상태 업데이트 (승인/거부 등)
  http.patch('/api/income-distributions/:id/status', async ({ params, request }) => {
    const { id } = params;
    const { status } = await request.json();
    
    const index = incomeDistributions.findIndex(inc => inc._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '수익 분배 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    incomeDistributions[index].status = status;
    incomeDistributions[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: incomeDistributions[index]
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 수익 분배 실행 (토큰 홀더에게 자금 분배)
  http.post('/api/income-distributions/:id/distribute', async ({ params, request }) => {
    const { id } = params;
    const { totalDistributed, perTokenAmount } = await request.json();
    
    const index = incomeDistributions.findIndex(inc => inc._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '수익 분배 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 분배 상태 업데이트
    incomeDistributions[index].tokenHolderDistribution = {
      totalDistributed,
      perTokenAmount
    };
    incomeDistributions[index].status = 'completed';
    incomeDistributions[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: incomeDistributions[index]
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
  http.patch('/api/income-distributions/:id/blockchain', async ({ params, request }) => {
    const { id } = params;
    const { recordedOnChain, transactionHash, blockchainDistributionId } = await request.json();
    
    const index = incomeDistributions.findIndex(inc => inc._id === id);
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '수익 분배 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    incomeDistributions[index].recordedOnChain = recordedOnChain;
    
    if (transactionHash) {
      incomeDistributions[index].transactionHash = transactionHash;
    }
    
    if (blockchainDistributionId) {
      incomeDistributions[index].blockchainDistributionId = blockchainDistributionId;
    }
    
    incomeDistributions[index].updatedAt = new Date().toISOString();
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: incomeDistributions[index]
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),
  
  // 특정 부동산의 총 수익 통계 조회
  http.get('/api/income-distributions/statistics/:propertyId', ({ params }) => {
    const { propertyId } = params;
    const distributions = incomeDistributions.filter(inc => inc.property === propertyId);
    
    if (distributions.length === 0) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: '해당 부동산의 수익 정보를 찾을 수 없습니다.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 총 수익 계산
    const totalIncome = distributions.reduce((total, inc) => total + inc.totalAmount, 0);
    const totalDistributed = distributions.reduce((total, inc) => total + inc.tokenHolderDistribution.totalDistributed, 0);
    const totalExpenses = distributions.reduce((total, inc) => {
      const expenseSum = inc.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      return total + expenseSum;
    }, 0);
    
    // 분배 유형별 수익 계산
    const incomeByType = {};
    distributions.forEach(inc => {
      if (!incomeByType[inc.distributionType]) {
        incomeByType[inc.distributionType] = 0;
      }
      incomeByType[inc.distributionType] += inc.totalAmount;
    });
    
    // 기간별 수익 추이 (연도별, 분기별)
    const incomeByYear = {};
    const incomeByQuarter = {};
    
    distributions.forEach(inc => {
      const startDate = new Date(inc.periodStart);
      const year = startDate.getFullYear();
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      const yearQuarter = `${year}-Q${quarter}`;
      
      if (!incomeByYear[year]) {
        incomeByYear[year] = 0;
      }
      incomeByYear[year] += inc.totalAmount;
      
      if (!incomeByQuarter[yearQuarter]) {
        incomeByQuarter[yearQuarter] = 0;
      }
      incomeByQuarter[yearQuarter] += inc.totalAmount;
    });
    
    return new HttpResponse(
      JSON.stringify({
        success: true,
        data: {
          propertyId,
          distributionCount: distributions.length,
          totalIncome,
          totalDistributed,
          totalExpenses,
          netIncome: totalIncome - totalExpenses,
          incomeByType,
          incomeByYear,
          incomeByQuarter
        }
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