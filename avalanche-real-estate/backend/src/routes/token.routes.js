const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 모든 토큰 조회
router.get('/', tokenController.getAllTokens);

// 특정 토큰 조회
router.get('/:id', tokenController.getTokenById);

// 사용자별 토큰 조회 (인증 필요)
router.get('/user/owned', authMiddleware, tokenController.getUserTokens);

// 토큰 분할 (인증 필요)
router.post('/:id/fractionalize', authMiddleware, tokenController.fractionalizeToken);

// 토큰 지분 구매 (인증 필요)
router.post('/:id/buy-share', authMiddleware, tokenController.buyTokenShare);

// 토큰 지분 판매 (인증 필요)
router.post('/:id/sell-share', authMiddleware, tokenController.sellTokenShare);

// 토큰 거래 내역 조회
router.get('/:id/transactions', tokenController.getTokenTransactions);

module.exports = router; 