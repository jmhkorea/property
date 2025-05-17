import { propertyHandlers } from './property.handlers';
import { valuationHandlers } from './valuation.handlers';
import { incomeHandlers } from './income.handlers';
import { tokenHandlers } from './token.handlers';
import { authHandlers } from './auth.handlers';

// 모든 API 핸들러를 여기에 모아서 내보냅니다
export const handlers = [
  ...propertyHandlers,
  ...valuationHandlers,
  ...incomeHandlers,
  ...tokenHandlers,
  ...authHandlers
]; 