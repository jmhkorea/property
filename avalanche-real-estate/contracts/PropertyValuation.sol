// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IPropertyValuation.sol";

/**
 * @title PropertyValuation
 * @dev 부동산 평가 시스템을 위한 스마트 컨트랙트
 */
contract PropertyValuation is IPropertyValuation, AccessControl, Pausable {
    using Counters for Counters.Counter;
    
    // 역할 정의
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant APPRAISER_ROLE = keccak256("APPRAISER_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");
    
    // 카운터
    Counters.Counter private _valuationIdCounter;
    
    // 부동산 토큰 ID별 평가 이력
    mapping(uint256 => uint256[]) private _tokenValuationHistory;
    
    // 평가 ID별 평가 정보
    mapping(uint256 => ValuationInfo) private _valuations;
    
    // 토큰 ID별 최신 평가 ID
    mapping(uint256 => uint256) private _latestValuationIds;
    
    /**
     * @dev 생성자
     * @param admin 관리자 주소
     */
    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ADMIN_ROLE, admin);
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
    ) external override whenNotPaused onlyRole(APPRAISER_ROLE) returns (uint256) {
        // 평가 ID 생성
        _valuationIdCounter.increment();
        uint256 valuationId = _valuationIdCounter.current();
        
        // 이전 평가 가져오기
        uint256 previousValue = 0;
        int256 changePercentage = 0;
        
        if (_latestValuationIds[tokenId] != 0) {
            uint256 latestValuationId = _latestValuationIds[tokenId];
            previousValue = _valuations[latestValuationId].currentValue;
            
            // 변화율 계산 (백분율 * 100)
            if (previousValue > 0) {
                changePercentage = int256(((int256(currentValue) - int256(previousValue)) * 10000) / int256(previousValue));
            }
        }
        
        // 평가 정보 저장
        _valuations[valuationId] = ValuationInfo({
            tokenId: tokenId,
            valuationId: valuationId,
            previousValue: previousValue,
            currentValue: currentValue,
            changePercentage: changePercentage,
            valuationDate: block.timestamp,
            appraiser: msg.sender,
            approver: address(0),
            status: ValuationStatus.Pending,
            methodology: methodology,
            metadataURI: metadataURI
        });
        
        // 평가 이력 추가
        _tokenValuationHistory[tokenId].push(valuationId);
        
        // 최신 평가 ID 업데이트
        _latestValuationIds[tokenId] = valuationId;
        
        // 이벤트 발생
        emit ValuationRecorded(tokenId, valuationId, currentValue, msg.sender);
        
        return valuationId;
    }
    
    /**
     * @dev 부동산 평가 승인
     * @param valuationId 평가 ID
     * @param approved 승인 여부
     */
    function approveValuation(uint256 valuationId, bool approved) 
        external 
        override 
        whenNotPaused 
        onlyRole(APPROVER_ROLE) 
    {
        require(_valuations[valuationId].valuationId == valuationId, "PropertyValuation: Invalid valuation ID");
        require(_valuations[valuationId].status == ValuationStatus.Pending, "PropertyValuation: Valuation not pending");
        
        // 상태 업데이트
        _valuations[valuationId].status = approved ? ValuationStatus.Approved : ValuationStatus.Rejected;
        _valuations[valuationId].approver = msg.sender;
        
        // 이벤트 발생
        emit ValuationApproved(valuationId, approved, msg.sender);
    }
    
    /**
     * @dev 부동산 평가 정보 조회
     * @param valuationId 평가 ID
     * @return 부동산 평가 정보
     */
    function getValuation(uint256 valuationId) 
        external 
        view 
        override 
        returns (ValuationInfo memory) 
    {
        require(_valuations[valuationId].valuationId == valuationId, "PropertyValuation: Invalid valuation ID");
        return _valuations[valuationId];
    }
    
    /**
     * @dev 부동산의 최신 평가 정보 조회
     * @param tokenId 부동산 토큰 ID
     * @return 최신 평가 ID, 없으면 0
     */
    function getLatestValuationId(uint256 tokenId) 
        external 
        view 
        override 
        returns (uint256) 
    {
        return _latestValuationIds[tokenId];
    }
    
    /**
     * @dev 부동산의 평가 이력 조회
     * @param tokenId 부동산 토큰 ID
     * @return 평가 ID 배열
     */
    function getValuationHistory(uint256 tokenId) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _tokenValuationHistory[tokenId];
    }
    
    /**
     * @dev 평가자 역할 설정
     * @param appraiser 평가자 주소
     * @param approved 승인 여부
     */
    function setAppraiser(address appraiser, bool approved) 
        external 
        override 
        onlyRole(ADMIN_ROLE) 
    {
        if (approved) {
            grantRole(APPRAISER_ROLE, appraiser);
        } else {
            revokeRole(APPRAISER_ROLE, appraiser);
        }
        
        emit AppraiserSet(appraiser, approved);
    }
    
    /**
     * @dev 승인자 역할 설정
     * @param approver 승인자 주소
     * @param approved 승인 여부
     */
    function setApprover(address approver, bool approved) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (approved) {
            grantRole(APPROVER_ROLE, approver);
        } else {
            revokeRole(APPROVER_ROLE, approver);
        }
    }
    
    /**
     * @dev 평가자 여부 확인
     * @param account 계정 주소
     * @return 평가자 여부
     */
    function isAppraiser(address account) 
        external 
        view 
        override 
        returns (bool) 
    {
        return hasRole(APPRAISER_ROLE, account);
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
} 