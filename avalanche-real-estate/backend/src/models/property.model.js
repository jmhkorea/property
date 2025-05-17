const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    propertyAddress: {
      type: String,
      required: true,
      trim: true,
    },
    propertyType: {
      type: String,
      required: true,
      trim: true,
      enum: ['아파트', '단독주택', '상가', '오피스', '토지', '기타'],
    },
    squareMeters: {
      type: Number,
      required: true,
      min: 1,
    },
    appraisedValue: {
      type: String, // BigNumber로 저장될 Wei 단위 값(문자열)
      required: true,
    },
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    ipfsDocumentURI: {
      type: String,
      required: true,
    },
    ownerAddress: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenId: {
      type: Number,
    },
    isTokenized: {
      type: Boolean,
      default: false,
    },
    shareId: {
      type: Number,
    },
    blockchainStatus: {
      type: String,
      enum: ['등록대기', '등록완료', '토큰화대기', '토큰화완료'],
      default: '등록대기',
    },
    transactionHash: {
      type: String,
    },
    // 부동산 평가 관련 필드 추가
    valuationHistory: [{
      date: {
        type: Date,
        required: true,
        default: Date.now
      },
      value: {
        type: Number,
        required: true
      },
      valuedBy: {
        type: String,
        required: true,
        enum: ['system', 'appraiser', 'owner', 'admin']
      },
      appraiserInfo: {
        name: String,
        license: String,
        company: String
      },
      reason: String,
      documents: [String] // 평가 관련 문서 URL들
    }],
    // 수익 관련 필드 추가
    incomeHistory: [{
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
      totalIncome: {
        type: Number,
        required: true
      },
      incomeType: {
        type: String,
        required: true,
        enum: ['rental', 'operational', 'sale', 'other']
      },
      distributionStatus: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed']
      },
      distributionDate: Date,
      distributionTxHash: String,
      details: {
        type: mongoose.Schema.Types.Mixed
      }
    }],
    // 부동산 상태 정보
    propertyStatus: {
      type: String,
      enum: ['available', 'rented', 'under_maintenance', 'sold', 'unavailable'],
      default: 'available'
    },
    // 임대 정보
    rentalInfo: {
      isRented: {
        type: Boolean,
        default: false
      },
      currentRenter: String,
      rentalStartDate: Date,
      rentalEndDate: Date,
      monthlyRent: Number,
      securityDeposit: Number,
      rentDistributionDay: {
        type: Number,
        min: 1,
        max: 31
      },
      rentalAgreementURI: String
    }
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model('Property', propertySchema);

module.exports = Property; 