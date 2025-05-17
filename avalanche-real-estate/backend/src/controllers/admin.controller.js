const User = require('../models/user.model');
const Property = require('../models/property.model');
const Share = require('../models/share.model');
const Transaction = require('../models/transaction.model');
const Notification = require('../models/notification.model');
const notificationController = require('./notification.controller');

// 사용자 목록 조회 (관리자만 접근 가능)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    const total = await User.countDocuments();
    
    const users = await User.find()
      .select('-password')
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 특정 사용자 조회 (관리자만 접근 가능)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다' });
    }
    
    // 사용자 관련 추가 정보 조회
    const properties = await Property.find({ createdBy: id });
    const tokenizedProperties = await Property.find({ createdBy: id, isTokenized: true });
    
    // 지갑 주소가 있는 경우 거래 내역 조회
    let transactions = [];
    if (user.walletAddress) {
      transactions = await Transaction.find({
        $or: [{ buyer: user.walletAddress }, { seller: user.walletAddress }]
      }).populate('property');
    }
    
    res.status(200).json({
      user,
      stats: {
        propertiesCount: properties.length,
        tokenizedPropertiesCount: tokenizedProperties.length,
        transactionsCount: transactions.length
      },
      properties,
      transactions
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 사용자 상태 업데이트 (관리자만 접근 가능)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, role } = req.body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다' });
    }
    
    // 업데이트할 필드만 설정
    const updateData = {};
    
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified;
    }
    
    if (role && ['user', 'admin'].includes(role)) {
      updateData.role = role;
    }
    
    // 변경 사항이 없는 경우
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '업데이트할 정보가 제공되지 않았습니다' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    // 상태 변경 알림 생성
    if (isVerified !== undefined && user.isVerified !== isVerified) {
      await notificationController.createNotification({
        user: id,
        title: '계정 인증 상태 변경',
        message: isVerified
          ? '귀하의 계정이 관리자에 의해 인증되었습니다.'
          : '귀하의 계정 인증 상태가 변경되었습니다. 자세한 사항은 관리자에게 문의하세요.',
        type: '시스템'
      });
    }
    
    if (role && user.role !== role) {
      await notificationController.createNotification({
        user: id,
        title: '계정 권한 변경',
        message: `귀하의 계정 권한이 ${role}로 변경되었습니다.`,
        type: '시스템'
      });
    }
    
    res.status(200).json({
      message: '사용자 상태가 성공적으로 업데이트되었습니다',
      user: updatedUser
    });
  } catch (error) {
    console.error('사용자 상태 업데이트 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 플랫폼 전체 거래 내역 조회 (관리자만 접근 가능)
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    const total = await Transaction.countDocuments();
    
    const transactions = await Transaction.find()
      .populate('property')
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    res.status(200).json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('거래 내역 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 부동산 상태 관리 (승인/반려) (관리자만 접근 가능)
exports.updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ error: '해당 부동산을 찾을 수 없습니다' });
    }
    
    // 상태 업데이트
    property.blockchainStatus = status;
    await property.save();
    
    // 부동산 소유자에게 알림 생성
    const title = status === '등록완료' ? '부동산 등록 승인' : '부동산 등록 반려';
    const message = status === '등록완료'
      ? '귀하의 부동산이 관리자에 의해 승인되었습니다.'
      : `귀하의 부동산 등록이 반려되었습니다. 사유: ${rejectionReason || '기준 미달'}`;
    
    await notificationController.createNotification({
      user: property.createdBy,
      title,
      message,
      type: '부동산',
      relatedProperty: id
    });
    
    res.status(200).json({
      message: '부동산 상태가 성공적으로 업데이트되었습니다',
      property
    });
  } catch (error) {
    console.error('부동산 상태 업데이트 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 시스템 알림 발송 (전체 또는 특정 사용자) (관리자만 접근 가능)
exports.sendSystemNotification = async (req, res) => {
  try {
    const { title, message, userIds, notificationType = '시스템' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: '제목과 내용은 필수 항목입니다' });
    }
    
    let targetUsers = [];
    
    // 특정 사용자들에게만 발송
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUsers = await User.find({ _id: { $in: userIds } });
    } 
    // 전체 사용자에게 발송
    else {
      targetUsers = await User.find();
    }
    
    // 알림 생성
    const notifications = [];
    for (const user of targetUsers) {
      const result = await notificationController.createNotification({
        user: user._id,
        title,
        message,
        type: notificationType
      });
      
      if (result.success) {
        notifications.push(result.notification);
      }
    }
    
    res.status(200).json({
      message: `${notifications.length}명의 사용자에게 알림이 성공적으로 발송되었습니다`,
      sent: notifications.length,
      total: targetUsers.length
    });
  } catch (error) {
    console.error('시스템 알림 발송 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 