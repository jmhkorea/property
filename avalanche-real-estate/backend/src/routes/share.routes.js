const express = require('express');
const router = express.Router();
const shareController = require('../controllers/share.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 모든 지분 목록 조회
router.get('/', shareController.getAllShares);

// 특정 지분 조회
router.get('/:id', shareController.getShareById);

// 지분 구매 (인증 필요)
router.post('/purchase', authMiddleware, shareController.purchaseShare);

// 사용자 보유 지분 조회 (인증 필요)
router.get('/user/owned', authMiddleware, shareController.getUserShares);

// 특정 부동산의 지분 목록 조회
router.get('/property/:propertyId', shareController.getSharesByProperty);

module.exports = router; 