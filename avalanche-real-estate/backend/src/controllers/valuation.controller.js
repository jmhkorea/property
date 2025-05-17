const Property = require('../models/property.model');
const PropertyValuation = require('../models/property-valuation.model');
const mongoose = require('mongoose');
const { ApiError } = require('../utils/error-handler');
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { propertyService, valuationService } = require('../services');
const blockchainService = require('../services/blockchain.service');
const ipfsService = require('../services/ipfs.service');

// 모든 부동산 평가 내역 조회
const getAllValuations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, property, sort = '-valuationDate' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (property) query.property = property;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'property', select: 'propertyAddress propertyType squareMeters isTokenized' },
        { path: 'requestedBy', select: 'name email' },
        { path: 'approvedBy', select: 'name email' }
      ]
    };
    
    const valuations = await PropertyValuation.paginate(query, options);
    res.status(200).json(valuations);
  } catch (error) {
    next(error);
  }
};

// 특정 부동산의 평가 내역 조회
const getValuationsByProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10, sort = '-valuationDate' } = req.query;
    
    // 해당 부동산이 존재하는지 확인
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new ApiError(404, '해당 부동산을 찾을 수 없습니다');
    }
    
    // 요청자가 해당 부동산에 접근할 권한이 있는지 확인
    if (!req.user.isAdmin && !property.createdBy.equals(req.user._id)) {
      // 토큰 소유자인지 확인하는 로직 추가 필요
      throw new ApiError(403, '이 부동산의 평가 내역에 접근할 권한이 없습니다');
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort
    };
    
    const valuations = await PropertyValuation.paginate({ property: propertyId }, options);
    res.status(200).json(valuations);
  } catch (error) {
    next(error);
  }
};

// 특정 평가 조회
const getValuationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const valuation = await PropertyValuation.findById(id)
      .populate('property', 'propertyAddress propertyType squareMeters isTokenized')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('previousValuation');
    
    if (!valuation) {
      throw new ApiError(404, '해당 평가 내역을 찾을 수 없습니다');
    }
    
    // 요청자가 해당 평가에 접근할 권한이 있는지 확인
    const property = await Property.findById(valuation.property);
    if (!req.user.isAdmin && !property.createdBy.equals(req.user._id)) {
      // 토큰 소유자인지 확인하는 로직 추가 필요
      throw new ApiError(403, '이 평가 내역에 접근할 권한이 없습니다');
    }
    
    res.status(200).json(valuation);
  } catch (error) {
    next(error);
  }
};

// 마지막 평가 조회
const getLatestValuation = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    
    // 해당 부동산이 존재하는지 확인
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new ApiError(404, '해당 부동산을 찾을 수 없습니다');
    }
    
    const latestValuation = await PropertyValuation.findOne({ property: propertyId, status: 'published' })
      .sort({ valuationDate: -1 })
      .populate('property', 'propertyAddress propertyType squareMeters isTokenized')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!latestValuation) {
      throw new ApiError(404, '해당 부동산의 승인된 평가 내역이 없습니다');
    }
    
    res.status(200).json(latestValuation);
  } catch (error) {
    next(error);
  }
};

// 새 평가 요청
const requestValuation = async (req, res, next) => {
  try {
    const { propertyId, reason, requestedValuationType } = req.body;
    
    // 해당 부동산이 존재하는지 확인
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new ApiError(404, '해당 부동산을 찾을 수 없습니다');
    }
    
    // 요청자가 해당 부동산에 대한 평가를 요청할 권한이 있는지 확인
    if (!req.user.isAdmin && !property.createdBy.equals(req.user._id)) {
      // 토큰 소유자인지 확인하는 로직 추가 필요
      throw new ApiError(403, '이 부동산에 대한 평가를 요청할 권한이 없습니다');
    }
    
    // 최근 평가 조회
    const latestValuation = await PropertyValuation.findOne({ property: propertyId })
      .sort({ valuationDate: -1 });
    
    // 새 평가 요청 생성
    const newValuationRequest = new PropertyValuation({
      property: propertyId,
      valuationType: requestedValuationType || 'requested',
      status: 'pending_review',
      requestedBy: req.user._id,
      notes: reason,
      methodology: 'comparative_market_analysis', // 기본값
      currentValue: latestValuation ? latestValuation.currentValue : property.appraisedValue,
      previousValuation: latestValuation ? latestValuation._id : null,
      previousValue: latestValuation ? latestValuation.currentValue : null
    });
    
    await newValuationRequest.save();
    
    res.status(201).json({
      message: '평가 요청이 성공적으로 등록되었습니다',
      valuationId: newValuationRequest._id
    });
  } catch (error) {
    next(error);
  }
};

// 부동산 평가 생성
const createValuation = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  
  // 부동산 정보 조회
  const property = await propertyService.getPropertyById(propertyId);
  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 부동산을 찾을 수 없습니다.');
  }
  
  // 토큰화된 경우에만 처리
  if (!property.isTokenized || !property.tokenId) {
    throw new ApiError(httpStatus.BAD_REQUEST, '토큰화되지 않은 부동산은 평가할 수 없습니다.');
  }
  
  // 평가 정보 생성
  const valuationData = {
    ...req.body,
    property: propertyId,
    requestedBy: req.user.id,
  };
  
  const valuation = await valuationService.createPropertyValuation(valuationData);
  
  // 블록체인에 기록 (비동기 처리)
  if (req.body.recordOnChain) {
    try {
      // 메타데이터 URI 생성 (IPFS 또는 중앙 서버)
      const metadataURI = `ipfs://${valuation.documents[0]?.ipfsHash || 'default-hash'}`;
      
      // 블록체인에 기록
      const result = await blockchainService.recordPropertyValuation(
        property.tokenId,
        valuation.currentValue.toString(),
        getMethodologyId(valuation.methodology),
        metadataURI
      );
      
      if (result.success) {
        // 성공시 블록체인 트랜잭션 정보 업데이트
        await valuationService.updatePropertyValuation(valuation.id, {
          recordedOnChain: true,
          transactionHash: result.transactionHash,
          blockchainValuationId: result.valuationId
        });
      }
    } catch (error) {
      // 블록체인 기록 실패 시 로깅만 하고 계속 진행
      console.error('블록체인 평가 정보 기록 실패:', error);
    }
  }
  
  res.status(httpStatus.CREATED).send(valuation);
});

// 평가 상태 업데이트
const updateValuationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const valuation = await PropertyValuation.findById(id);
    if (!valuation) {
      throw new ApiError(404, '해당 평가 내역을 찾을 수 없습니다');
    }
    
    valuation.status = status;
    await valuation.save();
    
    res.status(200).json({
      message: '평가 상태가 업데이트되었습니다',
      status
    });
  } catch (error) {
    next(error);
  }
};

// 평가 문서 추가
const addValuationDocument = catchAsync(async (req, res) => {
  const { propertyId, valuationId } = req.params;
  
  // 파일이 없는 경우 오류
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, '문서 파일이 필요합니다.');
  }
  
  // 평가 정보 조회
  const valuation = await valuationService.getPropertyValuationById(valuationId);
  if (!valuation || valuation.property.toString() !== propertyId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 평가 정보를 찾을 수 없습니다.');
  }
  
  // 문서 정보 생성
  const documentData = {
    title: req.body.title || req.file.originalname,
    documentType: req.body.documentType || 'other',
    fileUrl: req.file.path, // 파일 업로드 미들웨어에서 생성된 경로
    uploadedBy: req.user.id,
    uploadedAt: new Date()
  };
  
  // IPFS에 업로드 (선택적)
  if (req.body.uploadToIpfs) {
    try {
      const ipfsResult = await ipfsService.uploadFile(req.file.path);
      documentData.ipfsHash = ipfsResult.hash;
    } catch (error) {
      console.error('IPFS 업로드 실패:', error);
    }
  }
  
  // 문서 추가
  const documents = [...(valuation.documents || []), documentData];
  const updatedValuation = await valuationService.updatePropertyValuation(valuationId, { documents });
  
  res.send(updatedValuation);
});

// 문서 확인
const verifyDocument = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;
    
    const valuation = await PropertyValuation.findById(id);
    if (!valuation) {
      throw new ApiError(404, '해당 평가 내역을 찾을 수 없습니다');
    }
    
    const documentIndex = valuation.documents.findIndex(doc => doc._id.toString() === documentId);
    if (documentIndex === -1) {
      throw new ApiError(404, '해당 문서를 찾을 수 없습니다');
    }
    
    valuation.documents[documentIndex].verified = true;
    valuation.documents[documentIndex].verifiedBy = req.user._id;
    valuation.documents[documentIndex].verifiedAt = new Date();
    
    await valuation.save();
    
    res.status(200).json({
      message: '문서가 확인되었습니다'
    });
  } catch (error) {
    next(error);
  }
};

// 평가 승인/거부
const reviewValuation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;
    
    const valuation = await PropertyValuation.findById(id);
    if (!valuation) {
      throw new ApiError(404, '해당 평가 내역을 찾을 수 없습니다');
    }
    
    if (approved) {
      valuation.status = 'approved';
      valuation.approvedBy = req.user._id;
    } else {
      valuation.status = 'rejected';
      valuation.notes = valuation.notes ? `${valuation.notes}\n거부 사유: ${reason}` : `거부 사유: ${reason}`;
    }
    
    await valuation.save();
    
    res.status(200).json({
      message: approved ? '평가가 승인되었습니다' : '평가가 거부되었습니다'
    });
  } catch (error) {
    next(error);
  }
};

// 블록체인에 평가 기록
const recordValuationOnChain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transactionHash, metadataURI } = req.body;
    
    const valuation = await PropertyValuation.findById(id);
    if (!valuation) {
      throw new ApiError(404, '해당 평가 내역을 찾을 수 없습니다');
    }
    
    if (valuation.status !== 'approved') {
      throw new ApiError(400, '승인된 평가만 블록체인에 기록할 수 있습니다');
    }
    
    valuation.recordedOnChain = true;
    valuation.transactionHash = transactionHash;
    valuation.metadataURI = metadataURI;
    valuation.status = 'published';
    
    await valuation.save();
    
    // 부동산 모델의 최신 평가치 업데이트
    const property = await Property.findById(valuation.property);
    if (property) {
      property.appraisedValue = valuation.currentValue.toString();
      await property.save();
    }
    
    res.status(200).json({
      message: '평가가 블록체인에 기록되었습니다',
      transactionHash,
      metadataURI
    });
  } catch (error) {
    next(error);
  }
};

// 시장 동향 데이터 가져오기
const getMarketTrends = async (req, res, next) => {
  try {
    // 여기서는 가상의 시장 동향 데이터를 반환
    // 실제 구현에서는 외부 API나 데이터베이스에서 데이터를 가져옴
    const marketTrends = {
      interestRate: 3.5,
      marketGrowth: 2.7,
      averagePriceChangePercent: 1.2,
      trends: {
        apartment: 1.5,
        house: 0.8,
        commercial: 2.1,
        land: 3.2
      },
      regionTrends: {
        seoul: 1.8,
        busan: 1.2,
        incheon: 1.5,
        daegu: 0.9
      }
    };
    
    res.status(200).json(marketTrends);
  } catch (error) {
    next(error);
  }
};

// 유사 부동산 가격 가져오기
const getComparableProperties = async (req, res, next) => {
  try {
    const { propertyId, radius, limit = 5 } = req.query;
    
    // 해당 부동산 정보 조회
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new ApiError(404, '해당 부동산을 찾을 수 없습니다');
    }
    
    // 유사 부동산 검색
    // 실제 구현에서는 지리적 위치와 속성을 기반으로 유사한 부동산 검색
    const comparableProperties = await Property.find({
      _id: { $ne: propertyId },
      propertyType: property.propertyType,
      squareMeters: { 
        $gte: property.squareMeters * 0.8, 
        $lte: property.squareMeters * 1.2 
      }
    })
    .limit(parseInt(limit, 10))
    .select('propertyAddress propertyType squareMeters appraisedValue latitude longitude');
    
    res.status(200).json(comparableProperties);
  } catch (error) {
    next(error);
  }
};

/**
 * 부동산 평가 정보 목록 조회
 */
const getValuations = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const filter = { property: propertyId };
  const options = {
    sortBy: 'createdAt:desc',
    limit: req.query.limit,
    page: req.query.page,
    populate: 'requestedBy,approvedBy'
  };
  
  const result = await valuationService.queryPropertyValuations(filter, options);
  res.send(result);
});

/**
 * 부동산 평가 정보 상세 조회
 */
const getValuation = catchAsync(async (req, res) => {
  const { propertyId, valuationId } = req.params;
  const valuation = await valuationService.getPropertyValuationById(valuationId);
  
  if (!valuation || valuation.property.toString() !== propertyId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 평가 정보를 찾을 수 없습니다.');
  }
  
  res.send(valuation);
});

/**
 * 부동산 평가 정보 승인
 */
const approveValuation = catchAsync(async (req, res) => {
  const { propertyId, valuationId } = req.params;
  const { approved, notes } = req.body;
  
  // 평가 정보 조회
  const valuation = await valuationService.getPropertyValuationById(valuationId);
  if (!valuation || valuation.property.toString() !== propertyId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 평가 정보를 찾을 수 없습니다.');
  }
  
  // 승인 권한 체크 (관리자 또는 특정 역할만 가능)
  if (!req.user.roles.includes('admin') && !req.user.roles.includes('appraiser')) {
    throw new ApiError(httpStatus.FORBIDDEN, '평가 승인 권한이 없습니다.');
  }
  
  // 승인 불가능한 상태 체크
  if (valuation.status !== 'pending_review') {
    throw new ApiError(httpStatus.BAD_REQUEST, '현재 상태에서는 승인할 수 없습니다.');
  }
  
  // 승인 처리
  const updatedValuation = await valuationService.updatePropertyValuation(valuationId, {
    status: approved ? 'approved' : 'rejected',
    approvedBy: req.user.id,
    notes: notes || valuation.notes
  });
  
  // 블록체인에 승인 처리 (평가 정보가 블록체인에 기록된 경우에만)
  if (valuation.recordedOnChain && valuation.blockchainValuationId) {
    try {
      const result = await blockchainService.approvePropertyValuation(
        valuation.blockchainValuationId,
        approved
      );
      
      if (result.success) {
        await valuationService.updatePropertyValuation(valuationId, {
          blockchainApprovalTx: result.transactionHash
        });
      }
    } catch (error) {
      // 블록체인 승인 실패 시 로깅만 하고 계속 진행
      console.error('블록체인 평가 승인 실패:', error);
    }
  }
  
  res.send(updatedValuation);
});

/**
 * 부동산 평가 요소 추가
 */
const addValuationFactor = catchAsync(async (req, res) => {
  const { propertyId, valuationId } = req.params;
  const factorData = req.body;
  
  // 평가 정보 조회
  const valuation = await valuationService.getPropertyValuationById(valuationId);
  if (!valuation || valuation.property.toString() !== propertyId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 평가 정보를 찾을 수 없습니다.');
  }
  
  // 평가 요소 추가
  const factors = [...(valuation.factors || []), factorData];
  const updatedValuation = await valuationService.updatePropertyValuation(valuationId, { factors });
  
  res.send(updatedValuation);
});

/**
 * 부동산 블록체인 평가 이력 조회
 */
const getBlockchainValuationHistory = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  
  // 부동산 정보 조회
  const property = await propertyService.getPropertyById(propertyId);
  if (!property || !property.tokenId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 토큰화된 부동산을 찾을 수 없습니다.');
  }
  
  try {
    // 블록체인에서 평가 이력 조회
    const valuationIds = await blockchainService.getValuationHistory(property.tokenId);
    
    // 각 평가 정보 조회
    const valuations = [];
    for (const id of valuationIds) {
      try {
        const valuation = await blockchainService.getPropertyValuation(id);
        valuations.push(valuation);
      } catch (error) {
        console.error(`평가 ID ${id} 조회 실패:`, error);
      }
    }
    
    res.send(valuations);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, '블록체인 평가 이력 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 평가 방법론 ID 변환
 */
const getMethodologyId = (methodology) => {
  const methodologies = {
    'comparative_market_analysis': 0,
    'income_approach': 1,
    'cost_approach': 2,
    'automated_valuation': 3,
    'hybrid': 4
  };
  
  return methodologies[methodology] || 0;
};

module.exports = {
  getAllValuations,
  getValuationsByProperty,
  getValuationById,
  getLatestValuation,
  requestValuation,
  createValuation,
  updateValuationStatus,
  addValuationDocument,
  verifyDocument,
  reviewValuation,
  recordValuationOnChain,
  getMarketTrends,
  getComparableProperties,
  getValuations,
  getValuation,
  approveValuation,
  addValuationFactor,
  getBlockchainValuationHistory
}; 