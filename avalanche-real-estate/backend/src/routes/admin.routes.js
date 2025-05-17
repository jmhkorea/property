const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// 모든 라우트에 인증 및 관리자 권한 확인 미들웨어 적용
router.use(authMiddleware);
router.use(adminMiddleware);

// 사용자 관리
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);

// 거래 내역 관리
router.get('/transactions', adminController.getAllTransactions);

// 부동산 상태 관리
router.put('/properties/:id/status', adminController.updatePropertyStatus);

// 시스템 알림 발송
router.post('/notifications/send', adminController.sendSystemNotification);

module.exports = router; 