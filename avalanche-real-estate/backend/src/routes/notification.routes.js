const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 사용자 알림 조회
router.get('/', notificationController.getUserNotifications);

// 특정 알림 읽음 표시
router.put('/:id/read', notificationController.markAsRead);

// 모든 알림 읽음 표시
router.put('/read-all', notificationController.markAllAsRead);

// 특정 알림 삭제
router.delete('/:id', notificationController.deleteNotification);

// 모든 알림 삭제
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router; 