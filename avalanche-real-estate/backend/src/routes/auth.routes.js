const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 사용자 정보 조회 (인증 필요)
router.get('/profile', authMiddleware, authController.getProfile);

// 비밀번호 변경 (인증 필요)
router.put('/change-password', authMiddleware, authController.changePassword);

// 지갑 연결/업데이트 (인증 필요)
router.put('/connect-wallet', authMiddleware, authController.connectWallet);

module.exports = router; 