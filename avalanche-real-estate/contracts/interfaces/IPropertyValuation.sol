// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IPropertyValuation
 * @dev 부동산 평가 시스템을 위한 인터페이스
 */
interface IPropertyValuation {
    // 부동산 평가 상태
    enum ValuationStatus { Pending, Approved, Rejected, Recorded }
    
    // 부동산 평가 방법론
    enum ValuationMethodology { 
        ComparativeMarketAnalysis, 
        IncomeApproach, 
        CostApproach, 
        AutomatedValuation, 
        Hybrid 
    }
    
    // 부동산 평가 정보 구조체
    struct ValuationInfo {
        uint256 tokenId;            // 부동산 토큰 ID
        uint256 valuationId;        // 평가 ID
        uint256 previousValue;      // 이전 평가 금액 (Wei)
        uint256 currentValue;       // 현재 평가 금액 (Wei)
        int256 changePercentage;    // 변화율 (백분율 * 100)
        uint256 valuationDate;      // 평가 날짜 (타임스탬프)
        address appraiser;          // 평가자 주소
        address approver;           // 승인자 주소
        ValuationStatus status;     // 평가 상태
        ValuationMethodology methodology; // 평가 방법론
        string metadataURI;         // 메타데이터 URI (IPFS)
    }
    
    /**
     * @dev 새로운 부동산 평가 기록
     * @param tokenId 부동산 토큰 ID
     * @param currentValue 현재 평가 금액 (Wei)
     * @param methodology 평가 방법론
     * @param metadataURI 메타데이터 URI (IPFS)
     * @return 생성된 평가 ID
     */
    function recordValuation(
        uint256 tokenId,
        uint256 currentValue,
        ValuationMethodology methodology,
        string calldata metadataURI
    ) external returns (uint256);
    
    /**
     * @dev 부동산 평가 승인
     * @param valuationId 평가 ID
     * @param approved 승인 여부
     */
    function approveValuation(uint256 valuationId, bool approved) external;
    
    /**
     * @dev 부동산 평가 정보 조회
     * @param valuationId 평가 ID
     * @return 부동산 평가 정보
     */
    function getValuation(uint256 valuationId) external view returns (ValuationInfo memory);
    
    /**
     * @dev 부동산의 최신 평가 정보 조회
     * @param tokenId 부동산 토큰 ID
     * @return 최신 평가 ID, 없으면 0
     */
    function getLatestValuationId(uint256 tokenId) external view returns (uint256);
    
    /**
     * @dev 부동산의 평가 이력 조회
     * @param tokenId 부동산 토큰 ID
     * @return 평가 ID 배열
     */
    function getValuationHistory(uint256 tokenId) external view returns (uint256[] memory);
    
    /**
     * @dev 평가자 역할 설정
     * @param appraiser 평가자 주소
     * @param approved 승인 여부
     */
    function setAppraiser(address appraiser, bool approved) external;
    
    /**
     * @dev 평가자 여부 확인
     * @param account 계정 주소
     * @return 평가자 여부
     */
    function isAppraiser(address account) external view returns (bool);
    
    /**
     * @dev 평가 정보가 변경되었을 때 발생하는 이벤트
     */
    event ValuationRecorded(uint256 indexed tokenId, uint256 indexed valuationId, uint256 value, address appraiser);
    event ValuationApproved(uint256 indexed valuationId, bool approved, address approver);
    event AppraiserSet(address indexed account, bool approved);
} 