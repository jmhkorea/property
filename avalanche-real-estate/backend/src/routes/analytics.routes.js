const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 플랫폼 전체 통계 조회
router.get('/platform-stats', analyticsController.getPlatformStats);

// 부동산 유형별 통계
router.get('/property-types', analyticsController.getPropertyTypeStats);

// 거래 트렌드 분석
router.get('/transaction-trends', analyticsController.getTransactionTrends);

// 사용자별 투자 성과 분석 (인증 필요)
router.get('/user/investment-performance', authMiddleware, analyticsController.getUserInvestmentPerformance);

// 지역별 부동산 시장 분석
router.get('/regional-market', analyticsController.getRegionalMarketAnalysis);

module.exports = router; 