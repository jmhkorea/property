const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/income.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// 모든 수익 분배 내역 조회 (관리자 권한 필요)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  incomeController.getAllIncomeDistributions
);

// 특정 부동산의 수익 분배 내역 조회
router.get(
  '/property/:propertyId',
  authMiddleware,
  incomeController.getIncomeDistributionsByProperty
);

// 특정 토큰의 수익 분배 내역 조회
router.get(
  '/token/:tokenId',
  authMiddleware,
  incomeController.getIncomeDistributionsByToken
);

// 사용자의 수익 분배 내역 조회
router.get(
  '/user',
  authMiddleware,
  incomeController.getUserIncomeDistributions
);

// 특정 수익 분배 내역 조회
router.get(
  '/:id',
  authMiddleware,
  incomeController.getIncomeDistributionById
);

// 새 수익 등록 (부동산 소유자 또는 관리자 권한 필요)
router.post(
  '/',
  authMiddleware,
  incomeController.createIncomeDistribution
);

// 수익 분배 시작 (부동산 소유자 또는 관리자 권한 필요)
router.post(
  '/:id/distribute',
  authMiddleware,
  incomeController.startIncomeDistribution
);

// 수익 분배 상태 확인
router.get(
  '/:id/status',
  authMiddleware,
  incomeController.getDistributionStatus
);

// 수익 분배 취소 (관리자 권한 필요)
router.post(
  '/:id/cancel',
  authMiddleware,
  roleMiddleware(['admin']),
  incomeController.cancelDistribution
);

// 수익 분배 수동 완료 처리 (관리자 권한 필요)
router.post(
  '/:id/complete',
  authMiddleware,
  roleMiddleware(['admin']),
  incomeController.completeDistribution
);

// 스냅샷 생성 (부동산 소유자 또는 관리자 권한 필요)
router.post(
  '/:id/snapshot',
  authMiddleware,
  incomeController.createOwnershipSnapshot
);

// 개별 수령자 분배 상태 업데이트 (관리자 권한 필요)
router.patch(
  '/:id/receivers/:receiverId',
  authMiddleware,
  roleMiddleware(['admin']),
  incomeController.updateReceiverStatus
);

// 분배 예약 (부동산 소유자 또는 관리자 권한 필요)
router.post(
  '/schedule',
  authMiddleware,
  incomeController.scheduleDistribution
);

// 예정된 분배 목록 조회
router.get(
  '/scheduled',
  authMiddleware,
  roleMiddleware(['admin']),
  incomeController.getScheduledDistributions
);

module.exports = router; 