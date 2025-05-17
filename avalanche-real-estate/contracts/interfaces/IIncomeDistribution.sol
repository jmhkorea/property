// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IIncomeDistribution
 * @dev 부동산 수익 분배 시스템을 위한 인터페이스
 */
interface IIncomeDistribution {
    // 수익 분배 상태
    enum DistributionStatus { Pending, Processing, Completed, Failed, Canceled }
    
    // 수익 유형
    enum IncomeType { Rental, Operational, Sale, Other }
    
    // 수익 분배 정보 구조체
    struct DistributionInfo {
        uint256 distributionId;      // 분배 ID
        uint256 propertyTokenId;     // 부동산 토큰 ID
        uint256 totalAmount;         // 총 분배 금액 (Wei)
        uint256 distributionDate;    // 분배 날짜 (타임스탬프)
        IncomeType incomeType;       // 수익 유형
        DistributionStatus status;   // 분배 상태
        address distributor;         // 분배 실행자
        string metadataURI;          // 메타데이터 URI (IPFS)
        uint256 periodStart;         // 수익 기간 시작
        uint256 periodEnd;           // 수익 기간 종료
        uint256 feeAmount;           // 수수료 금액
        address feeRecipient;        // 수수료 수령인
    }
    
    // 수령인 정보 구조체
    struct ReceiverInfo {
        address walletAddress;       // 지갑 주소
        uint256 shares;              // 보유 지분 수
        uint256 amount;              // 분배 금액 (Wei)
        DistributionStatus status;   // 분배 상태
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
    ) external returns (uint256);
    
    /**
     * @dev 수익 분배 실행
     * @param distributionId 분배 ID
     */
    function executeDistribution(uint256 distributionId) external;
    
    /**
     * @dev 수익 분배 취소
     * @param distributionId 분배 ID
     */
    function cancelDistribution(uint256 distributionId) external;
    
    /**
     * @dev 수익 분배 정보 조회
     * @param distributionId 분배 ID
     * @return 수익 분배 정보
     */
    function getDistribution(uint256 distributionId) external view returns (DistributionInfo memory);
    
    /**
     * @dev 수익 분배 수령인 목록 조회
     * @param distributionId 분배 ID
     * @return 수령인 정보 배열
     */
    function getReceivers(uint256 distributionId) external view returns (ReceiverInfo[] memory);
    
    /**
     * @dev 부동산별 수익 분배 이력 조회
     * @param propertyTokenId 부동산 토큰 ID
     * @return 분배 ID 배열
     */
    function getDistributionHistory(uint256 propertyTokenId) external view returns (uint256[] memory);
    
    /**
     * @dev 수익 분배 상태 조회
     * @param distributionId 분배 ID
     * @return 분배 상태
     */
    function getDistributionStatus(uint256 distributionId) external view returns (DistributionStatus);
    
    /**
     * @dev 수수료 설정
     * @param percentage 수수료 퍼센트 (기본 100 = 1%)
     * @param recipient 수수료 수령인
     */
    function setFee(uint256 percentage, address recipient) external;
    
    /**
     * @dev 수익 분배가 생성되었을 때 발생하는 이벤트
     */
    event DistributionCreated(
        uint256 indexed propertyTokenId, 
        uint256 indexed distributionId, 
        uint256 totalAmount, 
        address distributor
    );
    
    /**
     * @dev 수익 분배가 실행되었을 때 발생하는 이벤트
     */
    event DistributionExecuted(uint256 indexed distributionId, uint256 totalAmount);
    
    /**
     * @dev 수익 분배가 취소되었을 때 발생하는 이벤트
     */
    event DistributionCanceled(uint256 indexed distributionId);
    
    /**
     * @dev 수익이 분배되었을 때 발생하는 이벤트
     */
    event AmountDistributed(
        uint256 indexed distributionId, 
        address indexed receiver, 
        uint256 amount
    );
    
    /**
     * @dev 수수료가 변경되었을 때 발생하는 이벤트
     */
    event FeeUpdated(uint256 percentage, address recipient);
} 