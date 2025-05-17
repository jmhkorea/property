const { ethers } = require('ethers');
const config = require('../../config/config');
const logger = require('../utils/logger');

// ABI 불러오기
const PropertyValuationABI = require('../abi/PropertyValuation.json');
const IncomeDistributionABI = require('../abi/IncomeDistribution.json');
const RealEstateNFTABI = require('../abi/RealEstateNFT.json');
const FractionalOwnershipABI = require('../abi/FractionalOwnership.json');

class BlockchainService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);
    
    // 스마트 컨트랙트 주소 설정
    this.contractAddresses = {
      propertyValuation: config.blockchain.contracts.propertyValuation,
      incomeDistribution: config.blockchain.contracts.incomeDistribution,
      realEstateNFT: config.blockchain.contracts.realEstateNFT,
      fractionalOwnership: config.blockchain.contracts.fractionalOwnership
    };
    
    // 스마트 컨트랙트 인스턴스 생성
    this.initContracts();
  }
  
  initContracts() {
    try {
      this.propertyValuationContract = new ethers.Contract(
        this.contractAddresses.propertyValuation,
        PropertyValuationABI.abi,
        this.wallet
      );
      
      this.incomeDistributionContract = new ethers.Contract(
        this.contractAddresses.incomeDistribution,
        IncomeDistributionABI.abi,
        this.wallet
      );
      
      this.realEstateNFTContract = new ethers.Contract(
        this.contractAddresses.realEstateNFT,
        RealEstateNFTABI.abi,
        this.wallet
      );
      
      this.fractionalOwnershipContract = new ethers.Contract(
        this.contractAddresses.fractionalOwnership,
        FractionalOwnershipABI.abi,
        this.wallet
      );
      
      logger.info('블록체인 서비스: 스마트 컨트랙트 인스턴스 생성 완료');
    } catch (error) {
      logger.error(`블록체인 서비스: 컨트랙트 초기화 오류 - ${error.message}`);
      throw new Error(`컨트랙트 초기화 오류: ${error.message}`);
    }
  }
  
  /**
   * 새로운 부동산 평가 기록
   * @param {Number} tokenId 부동산 토큰 ID
   * @param {String} currentValue 평가 금액 (Wei 단위 문자열)
   * @param {Number} methodologyId 평가 방법론 ID
   * @param {String} metadataURI 메타데이터 URI (IPFS)
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async recordPropertyValuation(tokenId, currentValue, methodologyId, metadataURI) {
    try {
      // 가스 견적 가져오기
      const gasEstimate = await this.propertyValuationContract.estimateGas.recordValuation(
        tokenId,
        currentValue,
        methodologyId,
        metadataURI
      );
      
      // 트랜잭션 실행
      const tx = await this.propertyValuationContract.recordValuation(
        tokenId,
        currentValue,
        methodologyId,
        metadataURI,
        {
          gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2) // 20% 더 여유롭게 설정
        }
      );
      
      // 트랜잭션 대기
      const receipt = await tx.wait();
      
      // 이벤트에서 valuationId 추출
      const valuationEvent = receipt.events.find(event => event.event === 'ValuationRecorded');
      const valuationId = valuationEvent.args.valuationId.toNumber();
      
      logger.info(`부동산 평가 기록 완료: 토큰 ID ${tokenId}, 평가 ID ${valuationId}`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        valuationId: valuationId
      };
    } catch (error) {
      logger.error(`부동산 평가 기록 오류: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 부동산 평가 승인
   * @param {Number} valuationId 평가 ID
   * @param {Boolean} approved 승인 여부
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async approvePropertyValuation(valuationId, approved) {
    try {
      // 트랜잭션 실행
      const tx = await this.propertyValuationContract.approveValuation(valuationId, approved);
      
      // 트랜잭션 대기
      const receipt = await tx.wait();
      
      logger.info(`부동산 평가 승인 완료: 평가 ID ${valuationId}, 승인 여부 ${approved}`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error(`부동산 평가 승인 오류: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 부동산 평가 정보 조회
   * @param {Number} valuationId 평가 ID
   * @returns {Promise<Object>} 평가 정보
   */
  async getPropertyValuation(valuationId) {
    try {
      const valuationInfo = await this.propertyValuationContract.getValuation(valuationId);
      
      return {
        tokenId: valuationInfo.tokenId.toNumber(),
        valuationId: valuationInfo.valuationId.toNumber(),
        previousValue: valuationInfo.previousValue.toString(),
        currentValue: valuationInfo.currentValue.toString(),
        changePercentage: valuationInfo.changePercentage.toNumber(),
        valuationDate: new Date(valuationInfo.valuationDate.toNumber() * 1000),
        appraiser: valuationInfo.appraiser,
        approver: valuationInfo.approver,
        status: this.mapValuationStatus(valuationInfo.status),
        methodology: this.mapValuationMethodology(valuationInfo.methodology),
        metadataURI: valuationInfo.metadataURI
      };
    } catch (error) {
      logger.error(`부동산 평가 정보 조회 오류: ${error.message}`);
      throw new Error(`부동산 평가 정보 조회 오류: ${error.message}`);
    }
  }
  
  /**
   * 부동산의 최신 평가 ID 조회
   * @param {Number} tokenId 부동산 토큰 ID
   * @returns {Promise<Number>} 최신 평가 ID
   */
  async getLatestValuationId(tokenId) {
    try {
      const valuationId = await this.propertyValuationContract.getLatestValuationId(tokenId);
      return valuationId.toNumber();
    } catch (error) {
      logger.error(`최신 평가 ID 조회 오류: ${error.message}`);
      throw new Error(`최신 평가 ID 조회 오류: ${error.message}`);
    }
  }
  
  /**
   * 부동산의 평가 이력 조회
   * @param {Number} tokenId 부동산 토큰 ID
   * @returns {Promise<Array<Number>>} 평가 ID 배열
   */
  async getValuationHistory(tokenId) {
    try {
      const history = await this.propertyValuationContract.getValuationHistory(tokenId);
      return history.map(id => id.toNumber());
    } catch (error) {
      logger.error(`평가 이력 조회 오류: ${error.message}`);
      throw new Error(`평가 이력 조회 오류: ${error.message}`);
    }
  }
  
  /**
   * 새로운 수익 분배 생성
   * @param {Number} propertyTokenId 부동산 토큰 ID
   * @param {String} totalAmount 총 분배 금액 (Wei 단위 문자열)
   * @param {Number} incomeTypeId 수익 유형 ID
   * @param {String} metadataURI 메타데이터 URI (IPFS)
   * @param {Number} periodStart 기간 시작 타임스탬프
   * @param {Number} periodEnd 기간 종료 타임스탬프
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async createIncomeDistribution(
    propertyTokenId,
    totalAmount,
    incomeTypeId,
    metadataURI,
    periodStart,
    periodEnd
  ) {
    try {
      // 트랜잭션 실행
      const tx = await this.incomeDistributionContract.createDistribution(
        propertyTokenId,
        totalAmount,
        incomeTypeId,
        metadataURI,
        periodStart,
        periodEnd
      );
      
      // 트랜잭션 대기
      const receipt = await tx.wait();
      
      // 이벤트에서 distributionId 추출
      const distributionEvent = receipt.events.find(event => event.event === 'DistributionCreated');
      const distributionId = distributionEvent.args.distributionId.toNumber();
      
      logger.info(`수익 분배 생성 완료: 토큰 ID ${propertyTokenId}, 분배 ID ${distributionId}`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        distributionId: distributionId
      };
    } catch (error) {
      logger.error(`수익 분배 생성 오류: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 수익 분배 실행
   * @param {Number} distributionId 분배 ID
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async executeIncomeDistribution(distributionId) {
    try {
      // 트랜잭션 실행
      const tx = await this.incomeDistributionContract.executeDistribution(distributionId);
      
      // 트랜잭션 대기
      const receipt = await tx.wait();
      
      logger.info(`수익 분배 실행 완료: 분배 ID ${distributionId}`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error(`수익 분배 실행 오류: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 수익 분배 취소
   * @param {Number} distributionId 분배 ID
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async cancelIncomeDistribution(distributionId) {
    try {
      // 트랜잭션 실행
      const tx = await this.incomeDistributionContract.cancelDistribution(distributionId);
      
      // 트랜잭션 대기
      const receipt = await tx.wait();
      
      logger.info(`수익 분배 취소 완료: 분배 ID ${distributionId}`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error(`수익 분배 취소 오류: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 수익 분배 정보 조회
   * @param {Number} distributionId 분배 ID
   * @returns {Promise<Object>} 분배 정보
   */
  async getIncomeDistribution(distributionId) {
    try {
      const distributionInfo = await this.incomeDistributionContract.getDistribution(distributionId);
      
      return {
        distributionId: distributionInfo.distributionId.toNumber(),
        propertyTokenId: distributionInfo.propertyTokenId.toNumber(),
        totalAmount: distributionInfo.totalAmount.toString(),
        distributionDate: new Date(distributionInfo.distributionDate.toNumber() * 1000),
        incomeType: this.mapIncomeType(distributionInfo.incomeType),
        status: this.mapDistributionStatus(distributionInfo.status),
        distributor: distributionInfo.distributor,
        metadataURI: distributionInfo.metadataURI,
        periodStart: new Date(distributionInfo.periodStart.toNumber() * 1000),
        periodEnd: new Date(distributionInfo.periodEnd.toNumber() * 1000),
        feeAmount: distributionInfo.feeAmount.toString(),
        feeRecipient: distributionInfo.feeRecipient
      };
    } catch (error) {
      logger.error(`수익 분배 정보 조회 오류: ${error.message}`);
      throw new Error(`수익 분배 정보 조회 오류: ${error.message}`);
    }
  }
  
  /**
   * 수익 분배 수령인 목록 조회
   * @param {Number} distributionId 분배 ID
   * @returns {Promise<Array<Object>>} 수령인 정보 배열
   */
  async getIncomeDistributionReceivers(distributionId) {
    try {
      const receivers = await this.incomeDistributionContract.getReceivers(distributionId);
      
      return receivers.map(receiver => ({
        walletAddress: receiver.walletAddress,
        shares: receiver.shares.toNumber(),
        amount: receiver.amount.toString(),
        status: this.mapDistributionStatus(receiver.status)
      }));
    } catch (error) {
      logger.error(`수익 분배 수령인 목록 조회 오류: ${error.message}`);
      throw new Error(`수익 분배 수령인 목록 조회 오류: ${error.message}`);
    }
  }
  
  /**
   * 부동산별 수익 분배 이력 조회
   * @param {Number} propertyTokenId 부동산 토큰 ID
   * @returns {Promise<Array<Number>>} 분배 ID 배열
   */
  async getIncomeDistributionHistory(propertyTokenId) {
    try {
      const history = await this.incomeDistributionContract.getDistributionHistory(propertyTokenId);
      return history.map(id => id.toNumber());
    } catch (error) {
      logger.error(`수익 분배 이력 조회 오류: ${error.message}`);
      throw new Error(`수익 분배 이력 조회 오류: ${error.message}`);
    }
  }
  
  /**
   * 평가 상태 매핑
   * @param {Number} statusId 상태 ID
   * @returns {String} 상태 문자열
   */
  mapValuationStatus(statusId) {
    const statuses = ['pending', 'approved', 'rejected', 'recorded'];
    return statuses[statusId] || 'unknown';
  }
  
  /**
   * 평가 방법론 매핑
   * @param {Number} methodologyId 방법론 ID
   * @returns {String} 방법론 문자열
   */
  mapValuationMethodology(methodologyId) {
    const methodologies = [
      'comparative_market_analysis',
      'income_approach',
      'cost_approach',
      'automated_valuation',
      'hybrid'
    ];
    return methodologies[methodologyId] || 'unknown';
  }
  
  /**
   * 분배 상태 매핑
   * @param {Number} statusId 상태 ID
   * @returns {String} 상태 문자열
   */
  mapDistributionStatus(statusId) {
    const statuses = ['pending', 'processing', 'completed', 'failed', 'canceled'];
    return statuses[statusId] || 'unknown';
  }
  
  /**
   * 수익 유형 매핑
   * @param {Number} typeId 유형 ID
   * @returns {String} 유형 문자열
   */
  mapIncomeType(typeId) {
    const types = ['rental', 'operational', 'sale', 'other'];
    return types[typeId] || 'unknown';
  }
}

module.exports = new BlockchainService(); 