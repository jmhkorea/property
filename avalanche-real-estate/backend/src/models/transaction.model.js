const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    shareId: {
      type: Number,
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    buyer: {
      type: String,
      required: true,
    },
    seller: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: String, // BigNumber로 저장될 Wei 단위 값(문자열)
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['구매', '판매', '토큰화'],
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockNumber: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['대기중', '완료', '실패'],
      default: '대기중',
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 