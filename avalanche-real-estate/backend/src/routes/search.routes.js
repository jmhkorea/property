const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 통합 검색 (인증 선택적)
router.get('/global', authMiddleware, searchController.globalSearch);

// 부동산 고급 검색
router.get('/properties/advanced', searchController.advancedPropertySearch);

// 위치 기반 부동산 검색
router.get('/properties/location', searchController.searchPropertiesByLocation);

module.exports = router; 