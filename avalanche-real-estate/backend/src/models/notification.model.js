const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['거래', '시스템', '토큰화', '지분', '경고', '기타'],
      default: '시스템',
    },
    relatedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    relatedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 생성: 사용자와 생성 날짜
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 