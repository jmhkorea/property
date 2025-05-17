const Notification = require('../models/notification.model');

// 사용자별 알림 조회
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const userId = req.user._id;

    const query = { user: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // 총 알림 개수 조회
    const total = await Notification.countDocuments(query);

    // 페이지네이션 적용하여 알림 조회
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('relatedProperty', 'propertyAddress propertyType')
      .populate('relatedTransaction', 'transactionType amount totalPrice');

    res.status(200).json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      unreadCount: await Notification.countDocuments({ user: userId, isRead: false }),
    });
  } catch (error) {
    console.error('알림 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 알림 읽음 표시
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, user: userId });

    if (!notification) {
      return res.status(404).json({ error: '해당 알림을 찾을 수 없습니다' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ 
      message: '알림이 읽음으로 표시되었습니다',
      notification
    });
  } catch (error) {
    console.error('알림 읽음 표시 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 모든 알림 읽음 표시
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: '모든 알림이 읽음으로 표시되었습니다' });
  } catch (error) {
    console.error('모든 알림 읽음 표시 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 알림 삭제
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, user: userId });

    if (!notification) {
      return res.status(404).json({ error: '해당 알림을 찾을 수 없습니다' });
    }

    await Notification.deleteOne({ _id: id, user: userId });

    res.status(200).json({ message: '알림이 삭제되었습니다' });
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 모든 알림 삭제
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ user: userId });

    res.status(200).json({ message: '모든 알림이 삭제되었습니다' });
  } catch (error) {
    console.error('모든 알림 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 새 알림 생성 (다른 서비스에서 호출할 유틸리티 함수)
exports.createNotification = async (userData) => {
  try {
    const notification = new Notification(userData);
    await notification.save();
    return { success: true, notification };
  } catch (error) {
    console.error('알림 생성 오류:', error);
    return { success: false, error: error.message };
  }
}; 