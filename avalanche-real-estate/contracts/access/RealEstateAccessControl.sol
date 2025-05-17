// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RealEstateAccessControl
 * @dev 부동산 토큰화 플랫폼을 위한 역할 기반 접근 제어(RBAC) 컨트랙트
 */
contract RealEstateAccessControl is AccessControl, Pausable, Ownable {
    // 역할 상수 정의
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROPERTY_VERIFIER_ROLE = keccak256("PROPERTY_VERIFIER_ROLE");
    bytes32 public constant TOKENIZER_ROLE = keccak256("TOKENIZER_ROLE");
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant RENTAL_MANAGER_ROLE = keccak256("RENTAL_MANAGER_ROLE");
    
    // 계정 상태 관리를 위한 매핑
    mapping(address => bool) private _blacklistedAddresses;
    
    // 비상 중단 상태
    bool public emergencyStop;
    
    // 이벤트 정의
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event AddressBlacklisted(address indexed account, address indexed sender);
    event AddressRemovedFromBlacklist(address indexed account, address indexed sender);
    event EmergencyStopActivated(address indexed activator);
    event EmergencyStopDeactivated(address indexed deactivator);
    
    // 시스템 작동 상태 체크를 위한 modifier
    modifier notBlacklisted() {
        require(!_blacklistedAddresses[msg.sender], "RealEstateAccessControl: account is blacklisted");
        _;
    }
    
    modifier whenNotEmergencyStopped() {
        require(!emergencyStop, "RealEstateAccessControl: system is in emergency stop mode");
        _;
    }
    
    /**
     * @dev 생성자
     */
    constructor() {
        // 컨트랙트 배포자에게 기본 관리자 역할 부여
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        
        // 초기 상태 설정
        emergencyStop = false;
    }
    
    /**
     * @dev 특정 주소에 역할 부여 (관리자만 가능)
     * @param role 부여할 역할
     * @param account 역할을 부여할 주소
     */
    function grantRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(role, account);
        emit RoleGranted(role, account, msg.sender);
    }
    
    /**
     * @dev 특정 주소의 역할 제거 (관리자만 가능)
     * @param role 제거할 역할
     * @param account 역할을 제거할 주소
     */
    function revokeRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(role != DEFAULT_ADMIN_ROLE || getRoleMemberCount(DEFAULT_ADMIN_ROLE) > 1, 
                "RealEstateAccessControl: cannot revoke default admin role from the only admin");
        _revokeRole(role, account);
        emit RoleRevoked(role, account, msg.sender);
    }
    
    /**
     * @dev 사용자가 자신의 역할을 포기
     * @param role 포기할 역할
     */
    function renounceRole(bytes32 role, address account) public override {
        require(account == msg.sender, "RealEstateAccessControl: can only renounce roles for self");
        
        // 마지막 관리자가 역할을 포기하는 것을 방지
        if (role == DEFAULT_ADMIN_ROLE) {
            require(getRoleMemberCount(DEFAULT_ADMIN_ROLE) > 1, 
                    "RealEstateAccessControl: cannot renounce role when you are the only admin");
        }
        
        _revokeRole(role, account);
        emit RoleRevoked(role, account, msg.sender);
    }
    
    /**
     * @dev 주소를 블랙리스트에 추가 (관리자만 가능)
     * @param account 블랙리스트에 추가할 주소
     */
    function blacklistAddress(address account) external onlyRole(ADMIN_ROLE) {
        require(account != owner(), "RealEstateAccessControl: cannot blacklist owner");
        require(!hasRole(DEFAULT_ADMIN_ROLE, account), "RealEstateAccessControl: cannot blacklist admin");
        
        _blacklistedAddresses[account] = true;
        
        emit AddressBlacklisted(account, msg.sender);
    }
    
    /**
     * @dev 주소를 블랙리스트에서 제거 (관리자만 가능)
     * @param account 블랙리스트에서 제거할 주소
     */
    function removeFromBlacklist(address account) external onlyRole(ADMIN_ROLE) {
        require(_blacklistedAddresses[account], "RealEstateAccessControl: address is not blacklisted");
        
        _blacklistedAddresses[account] = false;
        
        emit AddressRemovedFromBlacklist(account, msg.sender);
    }
    
    /**
     * @dev 주소가 블랙리스트에 있는지 확인
     * @param account 확인할 주소
     * @return 블랙리스트 포함 여부
     */
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklistedAddresses[account];
    }
    
    /**
     * @dev 시스템 일시 중지 (관리자만 가능)
     */
    function pause() external onlyRole(ADMIN_ROLE) whenNotPaused {
        _pause();
    }
    
    /**
     * @dev 시스템 재개 (관리자만 가능)
     */
    function unpause() external onlyRole(ADMIN_ROLE) whenPaused {
        _unpause();
    }
    
    /**
     * @dev 비상 중단 활성화 (관리자만 가능)
     */
    function activateEmergencyStop() external onlyRole(ADMIN_ROLE) whenNotEmergencyStopped {
        emergencyStop = true;
        emit EmergencyStopActivated(msg.sender);
    }
    
    /**
     * @dev 비상 중단 비활성화 (관리자만 가능)
     */
    function deactivateEmergencyStop() external onlyRole(ADMIN_ROLE) {
        require(emergencyStop, "RealEstateAccessControl: emergency stop not active");
        emergencyStop = false;
        emit EmergencyStopDeactivated(msg.sender);
    }
    
    /**
     * @dev 특정 역할의 멤버 수 조회
     * @param role 조회할 역할
     * @return 역할 멤버 수
     */
    function getRoleMemberCount(bytes32 role) public view returns (uint256) {
        return _getRoleMemberCount(role);
    }
} 