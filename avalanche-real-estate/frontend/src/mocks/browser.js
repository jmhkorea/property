import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// MSW 워커 설정
export const worker = setupWorker(...handlers);

// 모든 환경에서 사용될 워커 설정
export const startMockServiceWorker = () => {
  // 프로덕션 환경에서도 MSW 활성화 (GitHub Pages 배포를 위해)
  worker.start({
    onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 실제 네트워크로 전달
  })
  .catch(error => {
    console.error('MSW 서비스 워커 시작 중 오류:', error);
  });
  
  console.log('[MSW] Mock 서비스 워커가 활성화되었습니다.');
}; 