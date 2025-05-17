const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    shareId: {
      type: Number,
      required: true,
      unique: true,
    },
    propertyId: {
      type: Number,
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    totalShares: {
      type: Number,
      required: true,
      min: 1,
    },
    availableShares: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerShare: {
      type: String, // BigNumber로 저장될 Wei 단위 값(문자열)
      required: true,
    },
    tokenizer: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    transactionHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Share = mongoose.model('Share', shareSchema);

module.exports = Share; 