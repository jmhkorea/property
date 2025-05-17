const express = require('express');
const router = express.Router();
const valuationController = require('../controllers/valuation.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// 모든 부동산 평가 내역 조회 (관리자 또는 평가사만 접근 가능)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'appraiser']),
  valuationController.getAllValuations
);

// 특정 부동산의 평가 내역 조회
router.get(
  '/property/:propertyId',
  authMiddleware,
  valuationController.getValuationsByProperty
);

// 특정 평가 조회
router.get(
  '/:id',
  authMiddleware,
  valuationController.getValuationById
);

// 마지막 평가 조회
router.get(
  '/property/:propertyId/latest',
  authMiddleware,
  valuationController.getLatestValuation
);

// 새 평가 요청
router.post(
  '/request',
  authMiddleware,
  valuationController.requestValuation
);

// 부동산 평가 생성 (평가사 또는 관리자 권한 필요)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'appraiser']),
  valuationController.createValuation
);

// 평가 상태 업데이트 (평가사 또는 관리자 권한 필요)
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['admin', 'appraiser']),
  valuationController.updateValuationStatus
);

// 평가 문서 추가
router.post(
  '/:id/documents',
  authMiddleware,
  roleMiddleware(['admin', 'appraiser']),
  valuationController.addValuationDocument
);

// 평가 문서 확인
router.patch(
  '/:id/documents/:documentId/verify',
  authMiddleware,
  roleMiddleware(['admin']),
  valuationController.verifyDocument
);

// 평가 승인/거부 (관리자 권한 필요)
router.patch(
  '/:id/review',
  authMiddleware,
  roleMiddleware(['admin']),
  valuationController.reviewValuation
);

// 블록체인에 평가 기록 (관리자 권한 필요)
router.post(
  '/:id/record-on-chain',
  authMiddleware,
  roleMiddleware(['admin']),
  valuationController.recordValuationOnChain
);

// 시장 동향 데이터 가져오기
router.get(
  '/market-trends',
  authMiddleware,
  valuationController.getMarketTrends
);

// 유사 부동산 가격 가져오기
router.get(
  '/comparable-properties',
  authMiddleware,
  valuationController.getComparableProperties
);

module.exports = router; 