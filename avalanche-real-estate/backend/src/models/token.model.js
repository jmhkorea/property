const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const tokenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    tokenId: {
      type: Number,
      required: true,
    },
    totalSupply: {
      type: Number,
      required: true,
      min: 1,
    },
    contractAddress: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'closed'],
      default: 'pending',
    },
    metadata: {
      description: String,
      imageUrl: String,
      externalUrl: String,
    },
    transactionHash: {
      type: String,
    },
    tokenURI: {
      type: String,
    },
    attributes: [
      {
        trait_type: {
          type: String,
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 페이지네이션 플러그인 적용
tokenSchema.plugin(mongoosePaginate);

// 인덱스 생성
tokenSchema.index({ propertyId: 1 });
tokenSchema.index({ contractAddress: 1 });
tokenSchema.index({ tokenId: 1 });
tokenSchema.index({ createdBy: 1 });
tokenSchema.index({ status: 1 });

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token; 