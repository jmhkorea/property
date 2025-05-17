const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const distributionReceiverSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shares: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  transactionHash: String,
  distributedAt: Date
});

const incomeDistributionSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true
    },
    incomeType: {
      type: String,
      required: true,
      enum: ['rental', 'operational', 'sale', 'other']
    },
    totalAmount: {
      type: Number,
      required: true
    },
    period: {
      start: {
        type: Date,
        required: true
      },
      end: {
        type: Date,
        required: true
      }
    },
    description: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    distributionDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'failed', 'cancelled'],
      default: 'scheduled'
    },
    contractCallTransactionHash: String,
    receivers: [distributionReceiverSchema],
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    completedAt: Date,
    // 수수료 정보
    fee: {
      amount: Number,
      percentage: Number,
      recipient: String
    },
    // 스냅샷 정보 (분배 시점의 소유권 기록)
    ownershipSnapshot: {
      snapshotDate: Date,
      totalShares: Number,
      ownershipDistribution: [{
        walletAddress: String,
        shares: Number
      }]
    }
  },
  {
    timestamps: true
  }
);

// 페이지네이션 플러그인 적용
incomeDistributionSchema.plugin(mongoosePaginate);

// 인덱스 생성
incomeDistributionSchema.index({ property: 1, distributionDate: 1 });
incomeDistributionSchema.index({ token: 1 });
incomeDistributionSchema.index({ status: 1 });
incomeDistributionSchema.index({ 'receivers.walletAddress': 1 });

const IncomeDistribution = mongoose.model('IncomeDistribution', incomeDistributionSchema);

module.exports = IncomeDistribution; 