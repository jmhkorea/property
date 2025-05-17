const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['appraisal_report', 'market_analysis', 'inspection_report', 'photos', 'other'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  ipfsHash: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
});

const valuationFactorSchema = new mongoose.Schema({
  factorName: {
    type: String,
    required: true
  },
  factorType: {
    type: String,
    enum: ['location', 'condition', 'market', 'renovation', 'legal', 'other'],
    required: true
  },
  impact: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  },
  valueImpact: {
    type: Number,  // 백분율 (예: 5는 5% 증가/감소를 의미)
  },
  description: String
});

const propertyValuationSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    valuationDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    valuationType: {
      type: String,
      enum: ['initial', 'periodic', 'event_based', 'requested', 'automated'],
      required: true
    },
    previousValuation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropertyValuation'
    },
    previousValue: {
      type: Number
    },
    currentValue: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'KRW'
    },
    valueChangePercentage: {
      type: Number
    },
    appraiser: {
      name: String,
      license: String,
      company: String,
      contactInfo: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'rejected', 'published'],
      default: 'draft'
    },
    methodology: {
      type: String,
      enum: ['comparative_market_analysis', 'income_approach', 'cost_approach', 'automated_valuation', 'hybrid'],
      required: true
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    factors: [valuationFactorSchema],
    documents: [documentSchema],
    notes: String,
    marketConditions: {
      interestRate: Number,
      marketTrend: {
        type: String,
        enum: ['rising', 'declining', 'stable']
      },
      comparableProperties: [{
        address: String,
        salePrice: Number,
        saleDate: Date,
        squareMeters: Number,
        adjustmentFactors: {
          type: mongoose.Schema.Types.Mixed
        }
      }]
    },
    recordedOnChain: {
      type: Boolean,
      default: false
    },
    transactionHash: String,
    metadataURI: String
  },
  {
    timestamps: true
  }
);

// 페이지네이션 플러그인 적용
propertyValuationSchema.plugin(mongoosePaginate);

// 인덱스 생성
propertyValuationSchema.index({ property: 1, valuationDate: -1 });
propertyValuationSchema.index({ property: 1, status: 1 });
propertyValuationSchema.index({ 'appraiser.user': 1 });
propertyValuationSchema.index({ requestedBy: 1 });

const PropertyValuation = mongoose.model('PropertyValuation', propertyValuationSchema);

module.exports = PropertyValuation; 