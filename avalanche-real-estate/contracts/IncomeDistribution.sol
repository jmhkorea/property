// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IIncomeDistribution.sol";
import "./interfaces/IFractionalOwnership.sol";
import "./interfaces/IRealEstateNFT.sol";

/**
 * @title IncomeDistribution
 * @dev 부동산 수익 분배 시스템을 위한 스마트 컨트랙트
 */
contract IncomeDistribution is IIncomeDistribution, AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // 역할 정의
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    
    // 카운터
    Counters.Counter private _distributionIdCounter;
    
    // 부동산 토큰 ID별 분배 이력
    mapping(uint256 => uint256[]) private _propertyDistributionHistory;
    
    // 분배 ID별 분배 정보
    mapping(uint256 => DistributionInfo) private _distributions;
    
    // 분배 ID별 수령인 정보
    mapping(uint256 => ReceiverInfo[]) private _distributionReceivers;
    
    // 분할 소유권 컨트랙트 주소
    IFractionalOwnership private _fractionalOwnership;
    
    // 부동산 NFT 컨트랙트 주소
    IRealEstateNFT private _realEstateNFT;
    
    // 수수료 설정
    uint256 private _feePercentage = 100; // 1%를 의미 (10000 = 100%)
    address private _feeRecipient;
    
    /**
     * @dev 생성자
     * @param admin 관리자 주소
     * @param fractionalOwnership 분할 소유권 컨트랙트 주소
     * @param realEstateNFT 부동산 NFT 컨트랙트 주소
     * @param feeRecipient 수수료 수령인 주소
     */
    constructor(
        address admin,
        address fractionalOwnership,
        address realEstateNFT,
        address feeRecipient
    ) {
        require(admin != address(0), "IncomeDistribution: Admin address is zero");
        require(fractionalOwnership != address(0), "IncomeDistribution: FractionalOwnership address is zero");
        require(realEstateNFT != address(0), "IncomeDistribution: RealEstateNFT address is zero");
        require(feeRecipient != address(0), "IncomeDistribution: Fee recipient address is zero");
        
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ADMIN_ROLE, admin);
        _setupRole(DISTRIBUTOR_ROLE, admin);
        
        _fractionalOwnership = IFractionalOwnership(fractionalOwnership);
        _realEstateNFT = IRealEstateNFT(realEstateNFT);
        _feeRecipient = feeRecipient;
    }
    
    /**
     * @dev 새로운 수익 분배 생성
     * @param propertyTokenId 부동산 토큰 ID
     * @param totalAmount 총 분배 금액 (Wei)
     * @param incomeType 수익 유형
     * @param metadataURI 메타데이터 URI (IPFS)
     * @param periodStart 수익 기간 시작
     * @param periodEnd 수익 기간 종료
     * @return 생성된 분배 ID
     */
    function createDistribution(
        uint256 propertyTokenId,
        uint256 totalAmount,
        IncomeType incomeType,
        string calldata metadataURI,
        uint256 periodStart,
        uint256 periodEnd
    ) external override whenNotPaused onlyRole(DISTRIBUTOR_ROLE) returns (uint256) {
        require(totalAmount > 0, "IncomeDistribution: Amount must be greater than zero");
        require(periodStart < periodEnd, "IncomeDistribution: Invalid period");
        
        // 부동산 정보 조회
        IRealEstateNFT.PropertyInfo memory property = _realEstateNFT.getPropertyInfo(propertyTokenId);
        require(property.isTokenized, "IncomeDistribution: Property not tokenized");
        
        // 수수료 계산
        uint256 feeAmount = (totalAmount * _feePercentage) / 10000;
        uint256 distributionAmount = totalAmount - feeAmount;
        
        // 분배 ID 생성
        _distributionIdCounter.increment();
        uint256 distributionId = _distributionIdCounter.current();
        
        // 분배 정보 저장
        _distributions[distributionId] = DistributionInfo({
            distributionId: distributionId,
            propertyTokenId: propertyTokenId,
            totalAmount: distributionAmount,
            distributionDate: block.timestamp,
            incomeType: incomeType,
            status: DistributionStatus.Pending,
            distributor: msg.sender,
            metadataURI: metadataURI,
            periodStart: periodStart,
            periodEnd: periodEnd,
            feeAmount: feeAmount,
            feeRecipient: _feeRecipient
        });
        
        // 분배 이력 추가
        _propertyDistributionHistory[propertyTokenId].push(distributionId);
        
        // 이벤트 발생
        emit DistributionCreated(propertyTokenId, distributionId, distributionAmount, msg.sender);
        
        return distributionId;
    }
    
    /**
     * @dev 수익 분배 실행
     * @param distributionId 분배 ID
     */
    function executeDistribution(uint256 distributionId) 
        external 
        override 
        whenNotPaused 
        nonReentrant 
        onlyRole(DISTRIBUTOR_ROLE) 
    {
        require(_distributions[distributionId].distributionId == distributionId, "IncomeDistribution: Invalid distribution ID");
        require(_distributions[distributionId].status == DistributionStatus.Pending, "IncomeDistribution: Distribution not pending");
        
        // 분배 정보 가져오기
        DistributionInfo storage distribution = _distributions[distributionId];
        
        // 컨트랙트 잔고 확인
        require(address(this).balance >= distribution.totalAmount + distribution.feeAmount, "IncomeDistribution: Insufficient balance");
        
        // 분배 상태 업데이트
        distribution.status = DistributionStatus.Processing;
        
        // 수수료 전송
        (bool feeSuccess, ) = distribution.feeRecipient.call{value: distribution.feeAmount}("");
        require(feeSuccess, "IncomeDistribution: Fee transfer failed");
        
        // 지분 소유자들 정보 가져오기
        uint256 shareId = _realEstateNFT.getPropertyInfo(distribution.propertyTokenId).isTokenized ? 
                         _findShareIdByPropertyId(distribution.propertyTokenId) : 0;
        
        require(shareId > 0, "IncomeDistribution: Share ID not found");
        
        IFractionalOwnership.ShareInfo memory shareInfo = _fractionalOwnership.getShareInfo(shareId);
        require(shareInfo.active, "IncomeDistribution: Share not active");
        
        // 지분 소유자 및 분배 금액 계산
        _createReceivers(distributionId, shareId, shareInfo.totalShares, distribution.totalAmount);
        
        // 각 소유자에게 금액 분배
        _distributeToReceivers(distributionId);
        
        // 분배 상태 업데이트
        distribution.status = DistributionStatus.Completed;
        
        // 이벤트 발생
        emit DistributionExecuted(distributionId, distribution.totalAmount);
    }
    
    /**
     * @dev 수익 분배 취소
     * @param distributionId 분배 ID
     */
    function cancelDistribution(uint256 distributionId) 
        external 
        override 
        onlyRole(DISTRIBUTOR_ROLE) 
    {
        require(_distributions[distributionId].distributionId == distributionId, "IncomeDistribution: Invalid distribution ID");
        require(_distributions[distributionId].status == DistributionStatus.Pending, "IncomeDistribution: Distribution not pending");
        
        // 분배 상태 업데이트
        _distributions[distributionId].status = DistributionStatus.Canceled;
        
        // 이벤트 발생
        emit DistributionCanceled(distributionId);
    }
    
    /**
     * @dev 수익 분배 정보 조회
     * @param distributionId 분배 ID
     * @return 수익 분배 정보
     */
    function getDistribution(uint256 distributionId) 
        external 
        view 
        override 
        returns (DistributionInfo memory) 
    {
        require(_distributions[distributionId].distributionId == distributionId, "IncomeDistribution: Invalid distribution ID");
        return _distributions[distributionId];
    }
    
    /**
     * @dev 수익 분배 수령인 목록 조회
     * @param distributionId 분배 ID
     * @return 수령인 정보 배열
     */
    function getReceivers(uint256 distributionId) 
        external 
        view 
        override 
        returns (ReceiverInfo[] memory) 
    {
        require(_distributions[distributionId].distributionId == distributionId, "IncomeDistribution: Invalid distribution ID");
        return _distributionReceivers[distributionId];
    }
    
    /**
     * @dev 부동산별 수익 분배 이력 조회
     * @param propertyTokenId 부동산 토큰 ID
     * @return 분배 ID 배열
     */
    function getDistributionHistory(uint256 propertyTokenId) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _propertyDistributionHistory[propertyTokenId];
    }
    
    /**
     * @dev 수익 분배 상태 조회
     * @param distributionId 분배 ID
     * @return 분배 상태
     */
    function getDistributionStatus(uint256 distributionId) 
        external 
        view 
        override 
        returns (DistributionStatus) 
    {
        require(_distributions[distributionId].distributionId == distributionId, "IncomeDistribution: Invalid distribution ID");
        return _distributions[distributionId].status;
    }
    
    /**
     * @dev 수수료 설정
     * @param percentage 수수료 퍼센트 (10000 = 100%)
     * @param recipient 수수료 수령인
     */
    function setFee(uint256 percentage, address recipient) 
        external 
        override 
        onlyRole(ADMIN_ROLE) 
    {
        require(percentage <= 1000, "IncomeDistribution: Fee too high"); // 최대 10%
        require(recipient != address(0), "IncomeDistribution: Fee recipient is zero");
        
        _feePercentage = percentage;
        _feeRecipient = recipient;
        
        emit FeeUpdated(percentage, recipient);
    }
    
    /**
     * @dev 자금 입금 함수
     */
    function deposit() external payable {
        // 자금을 컨트랙트에 입금
    }
    
    /**
     * @dev 자금 인출 함수
     * @param amount 인출 금액
     */
    function withdraw(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount <= address(this).balance, "IncomeDistribution: Insufficient balance");
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "IncomeDistribution: Transfer failed");
    }
    
    /**
     * @dev 컨트랙트 일시 중지
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev 컨트랙트 재개
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev 디스트리뷰터 역할 설정
     * @param distributor 디스트리뷰터 주소
     * @param approved 승인 여부
     */
    function setDistributor(address distributor, bool approved) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (approved) {
            grantRole(DISTRIBUTOR_ROLE, distributor);
        } else {
            revokeRole(DISTRIBUTOR_ROLE, distributor);
        }
    }
    
    /**
     * @dev 특정 부동산 토큰 ID에 해당하는 지분 ID 찾기
     * @param propertyTokenId 부동산 토큰 ID
     * @return 지분 ID
     */
    function _findShareIdByPropertyId(uint256 propertyTokenId) internal view returns (uint256) {
        // TODO: 실제 구현에서는 지분 ID를 찾기 위한 매핑 또는 이벤트 필터링 필요
        // 현재는 간단하게 propertyId와 같다고 가정
        return propertyTokenId;
    }
    
    /**
     * @dev 수령인 목록 생성
     * @param distributionId 분배 ID
     * @param shareId 지분 ID
     * @param totalShares 총 지분 수
     * @param totalAmount 총 분배 금액
     */
    function _createReceivers(
        uint256 distributionId, 
        uint256 shareId, 
        uint256 totalShares, 
        uint256 totalAmount
    ) internal {
        // 소유자 배열 초기화
        delete _distributionReceivers[distributionId];
        
        // 지분 소유자 주소 목록 가져오기
        // TODO: 실제 구현에서는 지분 소유자 목록을 가져오는 로직 구현 필요
        // 현재는 테스트 데이터를 사용
        address[] memory owners = new address[](3);
        owners[0] = address(0x1111111111111111111111111111111111111111);
        owners[1] = address(0x2222222222222222222222222222222222222222);
        owners[2] = address(0x3333333333333333333333333333333333333333);
        
        uint256[] memory shares = new uint256[](3);
        shares[0] = 50; // 50%
        shares[1] = 30; // 30%
        shares[2] = 20; // 20%
        
        // 각 소유자의 분배 금액 계산 및 저장
        for (uint256 i = 0; i < owners.length; i++) {
            uint256 amount = (totalAmount * shares[i]) / 100;
            
            _distributionReceivers[distributionId].push(ReceiverInfo({
                walletAddress: owners[i],
                shares: shares[i],
                amount: amount,
                status: DistributionStatus.Pending
            }));
        }
    }
    
    /**
     * @dev 수령인들에게 금액 분배
     * @param distributionId 분배 ID
     */
    function _distributeToReceivers(uint256 distributionId) internal {
        ReceiverInfo[] storage receivers = _distributionReceivers[distributionId];
        
        for (uint256 i = 0; i < receivers.length; i++) {
            ReceiverInfo storage receiver = receivers[i];
            
            // 상태 업데이트
            receiver.status = DistributionStatus.Processing;
            
            // 금액 전송
            (bool success, ) = receiver.walletAddress.call{value: receiver.amount}("");
            
            // 전송 결과에 따라 상태 업데이트
            if (success) {
                receiver.status = DistributionStatus.Completed;
                emit AmountDistributed(distributionId, receiver.walletAddress, receiver.amount);
            } else {
                receiver.status = DistributionStatus.Failed;
            }
        }
    }
    
    /**
     * @dev 컨트랙트가 이더를 받을 수 있도록 함
     */
    receive() external payable {}
} 