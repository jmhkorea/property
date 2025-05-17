// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../access/RealEstateAccessControl.sol";

/**
 * @title RealEstateSecurityModule
 * @dev 부동산 토큰화 플랫폼의 보안을 관리하는 스마트 컨트랙트
 */
contract RealEstateSecurityModule is ReentrancyGuard {
    // 접근 제어 컨트랙트 참조
    RealEstateAccessControl public accessControl;
    
    // 컨트랙트 주소별 일일 트랜잭션 제한
    mapping(address => uint256) public dailyTransactionLimits;
    
    // 컨트랙트 주소별 일일 트랜잭션 횟수 추적
    mapping(address => uint256) public dailyTransactionsCount;
    
    // 컨트랙트 주소별 마지막 트랜잭션 날짜 추적
    mapping(address => uint256) public lastTransactionDay;
    
    // 컨트랙트 주소별 일일 출금 한도
    mapping(address => uint256) public dailyWithdrawalLimits;
    
    // 컨트랙트 주소별 일일 출금 금액 추적
    mapping(address => uint256) public dailyWithdrawalAmounts;
    
    // 비상 모드 관련 설정
    uint256 public emergencyActivationThreshold;
    mapping(address => bool) public emergencyActivationVotes;
    uint256 public emergencyActivationVoteCount;
    
    // 보안 경고 관련 설정
    struct SecurityAlert {
        address initiator;
        string reason;
        uint256 timestamp;
        bool resolved;
    }
    
    SecurityAlert[] public securityAlerts;
    
    // 이벤트 정의
    event TransactionLimitSet(address indexed contractAddress, uint256 limit);
    event WithdrawalLimitSet(address indexed contractAddress, uint256 limit);
    event TransactionRejected(address indexed sender, address indexed targetContract, string reason);
    event EmergencyVoteCast(address indexed voter, bool activate);
    event EmergencyActivated(uint256 voteCount, uint256 threshold);
    event EmergencyDeactivated(address indexed deactivator);
    event SecurityAlertRaised(uint256 indexed alertId, address indexed initiator, string reason);
    event SecurityAlertResolved(uint256 indexed alertId, address indexed resolver);
    
    /**
     * @dev 생성자
     * @param _accessControl 접근 제어 컨트랙트 주소
     */
    constructor(address _accessControl) {
        accessControl = RealEstateAccessControl(_accessControl);
        emergencyActivationThreshold = 3; // 기본값: 3명의 관리자 투표 필요
    }
    
    /**
     * @dev 일일 트랜잭션 제한 설정 (관리자만 가능)
     * @param contractAddress 제한을 설정할 컨트랙트 주소
     * @param limit 일일 트랜잭션 제한 횟수
     */
    function setDailyTransactionLimit(address contractAddress, uint256 limit) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "RealEstateSecurityModule: caller is not an admin"
        );
        
        dailyTransactionLimits[contractAddress] = limit;
        
        emit TransactionLimitSet(contractAddress, limit);
    }
    
    /**
     * @dev 일일 출금 한도 설정 (관리자만 가능)
     * @param contractAddress 제한을 설정할 컨트랙트 주소
     * @param limit 일일 출금 한도 금액
     */
    function setDailyWithdrawalLimit(address contractAddress, uint256 limit) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "RealEstateSecurityModule: caller is not an admin"
        );
        
        dailyWithdrawalLimits[contractAddress] = limit;
        
        emit WithdrawalLimitSet(contractAddress, limit);
    }
    
    /**
     * @dev 트랜잭션 요청 검증
     * @param targetContract 트랜잭션 대상 컨트랙트 주소
     * @return 트랜잭션 허용 여부
     */
    function validateTransaction(address targetContract) external returns (bool) {
        // 비상 중단 상태 확인
        if (accessControl.emergencyStop()) {
            emit TransactionRejected(msg.sender, targetContract, "System is in emergency stop mode");
            return false;
        }
        
        // 블랙리스트 확인
        if (accessControl.isBlacklisted(msg.sender)) {
            emit TransactionRejected(msg.sender, targetContract, "Sender is blacklisted");
            return false;
        }
        
        // 일일 트랜잭션 제한 확인
        uint256 limit = dailyTransactionLimits[targetContract];
        if (limit > 0) {
            uint256 today = block.timestamp / 1 days;
            
            // 새 날짜라면 카운터 리셋
            if (lastTransactionDay[targetContract] < today) {
                lastTransactionDay[targetContract] = today;
                dailyTransactionsCount[targetContract] = 0;
            }
            
            // 일일 한도 초과 확인
            if (dailyTransactionsCount[targetContract] >= limit) {
                emit TransactionRejected(msg.sender, targetContract, "Daily transaction limit exceeded");
                return false;
            }
            
            // 트랜잭션 카운트 증가
            dailyTransactionsCount[targetContract]++;
        }
        
        return true;
    }
    
    /**
     * @dev 출금 요청 검증
     * @param targetContract 출금 대상 컨트랙트 주소
     * @param amount 출금 금액
     * @return 출금 허용 여부
     */
    function validateWithdrawal(address targetContract, uint256 amount) external returns (bool) {
        // 비상 중단 상태 확인
        if (accessControl.emergencyStop()) {
            emit TransactionRejected(msg.sender, targetContract, "System is in emergency stop mode");
            return false;
        }
        
        // 블랙리스트 확인
        if (accessControl.isBlacklisted(msg.sender)) {
            emit TransactionRejected(msg.sender, targetContract, "Sender is blacklisted");
            return false;
        }
        
        // 일일 출금 한도 확인
        uint256 limit = dailyWithdrawalLimits[targetContract];
        if (limit > 0) {
            uint256 today = block.timestamp / 1 days;
            
            // 새 날짜라면 카운터 리셋
            if (lastTransactionDay[targetContract] < today) {
                lastTransactionDay[targetContract] = today;
                dailyWithdrawalAmounts[targetContract] = 0;
            }
            
            // 일일 한도 초과 확인
            if (dailyWithdrawalAmounts[targetContract] + amount > limit) {
                emit TransactionRejected(
                    msg.sender,
                    targetContract,
                    "Daily withdrawal limit exceeded"
                );
                return false;
            }
            
            // 출금 금액 추가
            dailyWithdrawalAmounts[targetContract] += amount;
        }
        
        return true;
    }
    
    /**
     * @dev 비상 모드 활성화 임계값 설정 (관리자만 가능)
     * @param threshold 새로운 임계값
     */
    function setEmergencyActivationThreshold(uint256 threshold) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "RealEstateSecurityModule: caller is not an admin"
        );
        require(threshold > 0, "RealEstateSecurityModule: threshold must be greater than 0");
        
        emergencyActivationThreshold = threshold;
    }
    
    /**
     * @dev 비상 모드 활성화 투표 (관리자만 가능)
     * @param activate 활성화 여부
     */
    function voteForEmergencyMode(bool activate) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "RealEstateSecurityModule: caller is not an admin"
        );
        
        // 현재 활성화/비활성화 상태 확인
        if (accessControl.emergencyStop() == activate) {
            // 이미 원하는 상태
            return;
        }
        
        bool previousVote = emergencyActivationVotes[msg.sender];
        
        // 투표 상태 업데이트
        if (previousVote != activate) {
            emergencyActivationVotes[msg.sender] = activate;
            
            if (activate) {
                emergencyActivationVoteCount++;
            } else if (emergencyActivationVoteCount > 0) {
                emergencyActivationVoteCount--;
            }
            
            emit EmergencyVoteCast(msg.sender, activate);
        }
        
        // 임계값 도달 시 비상 모드 활성화
        if (activate && emergencyActivationVoteCount >= emergencyActivationThreshold) {
            accessControl.activateEmergencyStop();
            emit EmergencyActivated(emergencyActivationVoteCount, emergencyActivationThreshold);
        }
    }
    
    /**
     * @dev 비상 모드 비활성화 (다수결 후 관리자 실행)
     */
    function deactivateEmergencyMode() external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "RealEstateSecurityModule: caller is not an admin"
        );
        require(accessControl.emergencyStop(), "RealEstateSecurityModule: emergency stop not active");
        
        // 투표 수가 임계값의 절반 미만이면 비활성화
        require(
            emergencyActivationVoteCount < emergencyActivationThreshold / 2,
            "RealEstateSecurityModule: need more votes to deactivate emergency mode"
        );
        
        // 모든 투표 초기화
        for (uint256 i = 0; i < securityAlerts.length; i++) {
            emergencyActivationVotes[securityAlerts[i].initiator] = false;
        }
        emergencyActivationVoteCount = 0;
        
        // 비상 모드 비활성화
        accessControl.deactivateEmergencyStop();
        
        emit EmergencyDeactivated(msg.sender);
    }
    
    /**
     * @dev 보안 경고 발생 (관리자만 가능)
     * @param reason 경고 이유
     * @return alertId 생성된 경고 ID
     */
    function raiseSecurityAlert(string calldata reason) external returns (uint256) {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "RealEstateSecurityModule: caller is not an admin"
        );
        
        uint256 alertId = securityAlerts.length;
        
        securityAlerts.push(
            SecurityAlert({
                initiator: msg.sender,
                reason: reason,
                timestamp: block.timestamp,
                resolved: false
            })
        );
        
        emit SecurityAlertRaised(alertId, msg.sender, reason);
        
        return alertId;
    }
    
    /**
     * @dev 보안 경고 해결 (관리자만 가능)
     * @param alertId 해결할 경고 ID
     */
    function resolveSecurityAlert(uint256 alertId) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "RealEstateSecurityModule: caller is not an admin"
        );
        require(alertId < securityAlerts.length, "RealEstateSecurityModule: alert ID does not exist");
        require(!securityAlerts[alertId].resolved, "RealEstateSecurityModule: alert already resolved");
        
        securityAlerts[alertId].resolved = true;
        
        emit SecurityAlertResolved(alertId, msg.sender);
    }
    
    /**
     * @dev 보안 경고 수 조회
     * @return 총 경고 수
     */
    function getSecurityAlertCount() external view returns (uint256) {
        return securityAlerts.length;
    }
    
    /**
     * @dev 미해결 보안 경고 수 조회
     * @return 미해결 경고 수
     */
    function getUnresolvedAlertCount() external view returns (uint256) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < securityAlerts.length; i++) {
            if (!securityAlerts[i].resolved) {
                count++;
            }
        }
        
        return count;
    }
} 