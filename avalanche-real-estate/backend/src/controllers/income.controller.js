const Property = require('../models/property.model');
const IncomeDistribution = require('../models/income-distribution.model');
const mongoose = require('mongoose');
const { ApiError } = require('../utils/error-handler');
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { propertyService, incomeService } = require('../services');
const blockchainService = require('../services/blockchain.service');

// 모든 수익 분배 내역 조회
const getAllIncomeDistributions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, property, sort = '-createdAt' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (property) query.property = property;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'property', select: 'propertyAddress propertyType isTokenized' },
        { path: 'token', select: 'name symbol totalSupply' },
        { path: 'createdBy', select: 'name email' }
      ]
    };
    
    const distributions = await IncomeDistribution.paginate(query, options);
    res.status(200).json(distributions);
  } catch (error) {
    next(error);
  }
};

// 특정 부동산의 수익 분배 내역 조회
const getIncomeDistributionsByProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    // 해당 부동산이 존재하는지 확인
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new ApiError(404, '해당 부동산을 찾을 수 없습니다');
    }
    
    // 요청자가 해당 부동산에 접근할 권한이 있는지 확인
    if (!req.user.isAdmin && !property.createdBy.equals(req.user._id)) {
      // 토큰 소유자인지 확인하는 로직 추가 필요
      throw new ApiError(403, '이 부동산의 수익 분배 내역에 접근할 권한이 없습니다');
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'token', select: 'name symbol totalSupply' },
        { path: 'createdBy', select: 'name email' }
      ]
    };
    
    const distributions = await IncomeDistribution.paginate({ property: propertyId }, options);
    res.status(200).json(distributions);
  } catch (error) {
    next(error);
  }
};

// 특정 토큰의 수익 분배 내역 조회
const getIncomeDistributionsByToken = async (req, res, next) => {
  try {
    const { tokenId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'property', select: 'propertyAddress propertyType isTokenized' },
        { path: 'createdBy', select: 'name email' }
      ]
    };
    
    const distributions = await IncomeDistribution.paginate({ token: tokenId }, options);
    res.status(200).json(distributions);
  } catch (error) {
    next(error);
  }
};

// 사용자의 수익 분배 내역 조회
const getUserIncomeDistributions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    // 현재 사용자의 지갑 주소 조회
    const userWalletAddress = req.user.walletAddress;
    
    // 사용자의 지갑 주소가 포함된 수익 분배 내역 검색
    const distributions = await IncomeDistribution.find({
      'receivers.walletAddress': userWalletAddress
    })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit, 10))
    .populate('property', 'propertyAddress propertyType isTokenized')
    .populate('token', 'name symbol totalSupply')
    .populate('createdBy', 'name email');
    
    // 각 분배 내역에서 사용자에게 해당하는 정보만 필터링
    const userDistributions = distributions.map(dist => {
      const userReceiver = dist.receivers.find(r => r.walletAddress === userWalletAddress);
      return {
        _id: dist._id,
        property: dist.property,
        token: dist.token,
        incomeType: dist.incomeType,
        period: dist.period,
        distributionDate: dist.distributionDate,
        status: dist.status,
        totalAmount: dist.totalAmount,
        userShares: userReceiver.shares,
        userAmount: userReceiver.amount,
        userStatus: userReceiver.status,
        transactionHash: userReceiver.transactionHash,
        distributedAt: userReceiver.distributedAt
      };
    });
    
    // 전체 수량 조회
    const total = await IncomeDistribution.countDocuments({
      'receivers.walletAddress': userWalletAddress
    });
    
    res.status(200).json({
      docs: userDistributions,
      totalDocs: total,
      limit: parseInt(limit, 10),
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// 특정 수익 분배 내역 조회
const getIncomeDistributionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const distribution = await IncomeDistribution.findById(id)
      .populate('property', 'propertyAddress propertyType isTokenized ownerAddress')
      .populate('token', 'name symbol totalSupply')
      .populate('createdBy', 'name email');
    
    if (!distribution) {
      throw new ApiError(404, '해당 수익 분배 내역을 찾을 수 없습니다');
    }
    
    // 요청자가 해당 분배 내역에 접근할 권한이 있는지 확인
    if (!req.user.isAdmin && !distribution.createdBy.equals(req.user._id)) {
      // 토큰 소유자인지 확인
      const isReceiver = distribution.receivers.some(r => r.walletAddress === req.user.walletAddress);
      if (!isReceiver) {
        throw new ApiError(403, '이 수익 분배 내역에 접근할 권한이 없습니다');
      }
      
      // 일반 사용자는 자신의 정보만 볼 수 있도록 필터링
      if (isReceiver) {
        const userReceiver = distribution.receivers.find(r => r.walletAddress === req.user.walletAddress);
        const filteredReceivers = [userReceiver];
        distribution.receivers = filteredReceivers;
      }
    }
    
    res.status(200).json(distribution);
  } catch (error) {
    next(error);
  }
};

// 수익 분배 생성
const createIncomeDistribution = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  
  // 부동산 정보 조회
  const property = await propertyService.getPropertyById(propertyId);
  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 부동산을 찾을 수 없습니다.');
  }
  
  // 토큰화된 경우에만 처리
  if (!property.isTokenized || !property.tokenId) {
    throw new ApiError(httpStatus.BAD_REQUEST, '토큰화되지 않은 부동산은 수익 분배를 생성할 수 없습니다.');
  }
  
  // 수익 분배 데이터 준비
  const distributionData = {
    ...req.body,
    property: propertyId,
    createdBy: req.user.id,
    status: 'scheduled'
  };
  
  const distribution = await incomeService.createIncomeDistribution(distributionData);
  
  // 블록체인에 기록 (선택적)
  if (req.body.recordOnChain) {
    try {
      // 메타데이터 URI 생성
      const metadataURI = `ipfs://${distribution.metadata?.ipfsHash || 'default-hash'}`;
      
      // periodStart, periodEnd를 타임스탬프로 변환
      const periodStart = Math.floor(new Date(distribution.period.start).getTime() / 1000);
      const periodEnd = Math.floor(new Date(distribution.period.end).getTime() / 1000);
      
      // 블록체인에 기록
      const result = await blockchainService.createIncomeDistribution(
        property.tokenId,
        distribution.totalAmount.toString(),
        getIncomeTypeId(distribution.incomeType),
        metadataURI,
        periodStart,
        periodEnd
      );
      
      if (result.success) {
        // 성공시 블록체인 트랜잭션 정보 업데이트
        await incomeService.updateIncomeDistribution(distribution.id, {
          contractCallTransactionHash: result.transactionHash,
          blockchainDistributionId: result.distributionId
        });
      }
    } catch (error) {
      // 블록체인 기록 실패 시 로깅만 하고 계속 진행
      console.error('블록체인 수익 분배 생성 실패:', error);
    }
  }
  
  res.status(httpStatus.CREATED).send(distribution);
});

// 수익 분배 목록 조회
const getIncomeDistributions = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const filter = { property: propertyId };
  const options = {
    sortBy: 'distributionDate:desc',
    limit: req.query.limit,
    page: req.query.page,
    populate: 'createdBy'
  };
  
  const result = await incomeService.queryIncomeDistributions(filter, options);
  res.send(result);
});

// 수익 분배 상세 조회
const getIncomeDistribution = catchAsync(async (req, res) => {
  const { propertyId, distributionId } = req.params;
  const distribution = await incomeService.getIncomeDistributionById(distributionId);
  
  if (!distribution || distribution.property.toString() !== propertyId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 수익 분배 정보를 찾을 수 없습니다.');
  }
  
  res.send(distribution);
});

// 수익 분배 실행
const executeIncomeDistribution = catchAsync(async (req, res) => {
  const { propertyId, distributionId } = req.params;
  
  // 수익 분배 정보 조회
  const distribution = await incomeService.getIncomeDistributionById(distributionId);
  if (!distribution || distribution.property.toString() !== propertyId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 수익 분배 정보를 찾을 수 없습니다.');
  }
  
  // 권한 체크 (관리자 또는 특정 역할만 가능)
  if (!req.user.roles.includes('admin') && !req.user.roles.includes('distributor')) {
    throw new ApiError(httpStatus.FORBIDDEN, '수익 분배 실행 권한이 없습니다.');
  }
  
  // 상태 체크
  if (distribution.status !== 'scheduled') {
    throw new ApiError(httpStatus.BAD_REQUEST, '현재 상태에서는 수익 분배를 실행할 수 없습니다.');
  }
  
  // 블록체인에 기록된 경우 블록체인에서 실행
  if (distribution.blockchainDistributionId) {
    try {
      // 블록체인에 자금 입금 (이더리움/아발란체의 경우)
      const depositResult = await blockchainService.depositFunds(distribution.totalAmount.toString());
      if (!depositResult.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, '블록체인 자금 입금에 실패했습니다.');
      }
      
      // 블록체인에서 수익 분배 실행
      const result = await blockchainService.executeIncomeDistribution(distribution.blockchainDistributionId);
      
      if (result.success) {
        // 성공시 상태 업데이트
        await incomeService.updateIncomeDistribution(distributionId, {
          status: 'completed',
          contractCallTransactionHash: result.transactionHash,
          completedAt: new Date()
        });
        
        // 각 수령자 상태 업데이트
        await incomeService.updateAllReceiversStatus(distributionId, 'completed');
        
        // 부동산 수익 이력에 추가
        await propertyService.addIncomeHistory(propertyId, {
          period: distribution.period,
          totalIncome: distribution.totalAmount,
          incomeType: distribution.incomeType,
          distributionStatus: 'completed',
          distributionDate: new Date(),
          distributionTxHash: result.transactionHash
        });
      } else {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, '블록체인 수익 분배 실행에 실패했습니다.');
      }
    } catch (error) {
      // 상태 업데이트 (실패)
      await incomeService.updateIncomeDistribution(distributionId, {
        status: 'failed',
        metadata: { ...distribution.metadata, errorMessage: error.message }
      });
      
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, '블록체인 수익 분배 실행 중 오류가 발생했습니다: ' + error.message);
    }
  } else {
    // 블록체인에 기록되지 않은 경우 내부 처리
    try {
      // 분배 처리 로직 (오프체인 또는 별도 서비스 이용)
      const processResult = await incomeService.processOffchainDistribution(distributionId);
      
      // 성공 시 상태 업데이트
      await incomeService.updateIncomeDistribution(distributionId, {
        status: 'completed',
        completedAt: new Date()
      });
      
      // 부동산 수익 이력에 추가
      await propertyService.addIncomeHistory(propertyId, {
        period: distribution.period,
        totalIncome: distribution.totalAmount,
        incomeType: distribution.incomeType,
        distributionStatus: 'completed',
        distributionDate: new Date()
      });
    } catch (error) {
      // 상태 업데이트 (실패)
      await incomeService.updateIncomeDistribution(distributionId, {
        status: 'failed',
        metadata: { ...distribution.metadata, errorMessage: error.message }
      });
      
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, '수익 분배 처리 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  // 최종 결과 조회하여 반환
  const updatedDistribution = await incomeService.getIncomeDistributionById(distributionId);
  res.send(updatedDistribution);
});

// 수익 분배 취소
const cancelIncomeDistribution = catchAsync(async (req, res) => {
  const { propertyId, distributionId } = req.params;
  
  // 수익 분배 정보 조회
  const distribution = await incomeService.getIncomeDistributionById(distributionId);
  if (!distribution || distribution.property.toString() !== propertyId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 수익 분배 정보를 찾을 수 없습니다.');
  }
  
  // 권한 체크 (관리자 또는 생성자만 가능)
  if (!req.user.roles.includes('admin') && distribution.createdBy.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, '수익 분배 취소 권한이 없습니다.');
  }
  
  // 상태 체크
  if (distribution.status !== 'scheduled') {
    throw new ApiError(httpStatus.BAD_REQUEST, '현재 상태에서는 수익 분배를 취소할 수 없습니다.');
  }
  
  // 블록체인에 기록된 경우 블록체인에서 취소
  if (distribution.blockchainDistributionId) {
    try {
      const result = await blockchainService.cancelIncomeDistribution(distribution.blockchainDistributionId);
      
      if (result.success) {
        // 성공시 상태 업데이트
        await incomeService.updateIncomeDistribution(distributionId, {
          status: 'cancelled',
          contractCallTransactionHash: result.transactionHash
        });
      } else {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, '블록체인 수익 분배 취소에 실패했습니다.');
      }
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, '블록체인 수익 분배 취소 중 오류가 발생했습니다: ' + error.message);
    }
  } else {
    // 블록체인에 기록되지 않은 경우 내부적으로 취소
    await incomeService.updateIncomeDistribution(distributionId, {
      status: 'cancelled'
    });
  }
  
  // 최종 결과 조회하여 반환
  const updatedDistribution = await incomeService.getIncomeDistributionById(distributionId);
  res.send(updatedDistribution);
});

// 수익 분배 수령인 목록 조회
const getDistributionReceivers = catchAsync(async (req, res) => {
  const { propertyId, distributionId } = req.params;
  
  // 수익 분배 정보 조회
  const distribution = await incomeService.getIncomeDistributionById(distributionId);
  if (!distribution || distribution.property.toString() !== propertyId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 수익 분배 정보를 찾을 수 없습니다.');
  }
  
  // 수령인 목록 조회
  const receivers = await incomeService.getDistributionReceivers(distributionId);
  res.send(receivers);
});

// 블록체인에서 수익 분배 이력 조회
const getBlockchainDistributionHistory = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  
  // 부동산 정보 조회
  const property = await propertyService.getPropertyById(propertyId);
  if (!property || !property.tokenId) {
    throw new ApiError(httpStatus.NOT_FOUND, '해당 토큰화된 부동산을 찾을 수 없습니다.');
  }
  
  try {
    // 블록체인에서 수익 분배 이력 조회
    const distributionIds = await blockchainService.getIncomeDistributionHistory(property.tokenId);
    
    // 각 수익 분배 정보 조회
    const distributions = [];
    for (const id of distributionIds) {
      try {
        const distribution = await blockchainService.getIncomeDistribution(id);
        distributions.push(distribution);
      } catch (error) {
        console.error(`분배 ID ${id} 조회 실패:`, error);
      }
    }
    
    res.send(distributions);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, '블록체인 수익 분배 이력 조회 중 오류가 발생했습니다.');
  }
});

// 수익 유형 ID 변환
const getIncomeTypeId = (incomeType) => {
  const incomeTypes = {
    'rental': 0,
    'operational': 1,
    'sale': 2,
    'other': 3
  };
  
  return incomeTypes[incomeType] || 3;
};

module.exports = {
  getAllIncomeDistributions,
  getIncomeDistributionsByProperty,
  getIncomeDistributionsByToken,
  getUserIncomeDistributions,
  getIncomeDistributionById,
  createIncomeDistribution,
  getIncomeDistributions,
  getIncomeDistribution,
  executeIncomeDistribution,
  cancelIncomeDistribution,
  getDistributionReceivers,
  getBlockchainDistributionHistory
}; 