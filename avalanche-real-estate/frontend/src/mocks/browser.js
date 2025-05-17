import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// MSW 워커 설정
export const worker = setupWorker(...handlers);

// 개발 환경에서만 사용될 워커 설정
export const startMockServiceWorker = () => {
  if (process.env.NODE_ENV === 'development') {
    worker.start({
      onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 실제 네트워크로 전달
    });
    
    console.log('[MSW] Mock 서비스 워커가 활성화되었습니다.');
  }
}; 