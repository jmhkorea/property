const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 모든 부동산 목록 조회
router.get('/', propertyController.getAllProperties);

// 특정 부동산 조회
router.get('/:id', propertyController.getPropertyById);

// 부동산 등록 (인증 필요)
router.post('/', authMiddleware, propertyController.createProperty);

// 부동산 정보 수정 (인증 필요)
router.put('/:id', authMiddleware, propertyController.updateProperty);

// 부동산 삭제 (인증 필요)
router.delete('/:id', authMiddleware, propertyController.deleteProperty);

// 부동산 토큰화 요청 (인증 필요)
router.post('/:id/tokenize', authMiddleware, propertyController.tokenizeProperty);

module.exports = router; 