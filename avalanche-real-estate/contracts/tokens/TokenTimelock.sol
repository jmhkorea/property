// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenTimelock
 * @dev 부동산 토큰화 플랫폼을 위한 토큰 시간 잠금 컨트랙트
 * ERC20 및 ERC1155 토큰에 대한 시간 잠금 기능 제공
 */
contract TokenTimelock is ReentrancyGuard, Ownable {
    // 토큰 유형 열거형
    enum TokenType { ERC20, ERC1155 }
    
    // 잠금 정보 구조체
    struct LockInfo {
        address tokenAddress;
        TokenType tokenType;
        address beneficiary;
        uint256 tokenId;          // ERC1155의 경우에만 사용
        uint256 amount;
        uint256 releaseTime;
        bool isReleased;
        string description;
    }
    
    // 잠금 목록
    LockInfo[] public locks;
    
    // 사용자별 잠금 인덱스
    mapping(address => uint256[]) private _userLocks;
    
    // 이벤트 정의
    event LockCreated(
        uint256 indexed lockId,
        address indexed tokenAddress,
        TokenType tokenType,
        address indexed beneficiary,
        uint256 tokenId,
        uint256 amount,
        uint256 releaseTime,
        string description
    );
    
    event TokensReleased(
        uint256 indexed lockId,
        address indexed beneficiary,
        uint256 amount
    );
    
    event LockExtended(
        uint256 indexed lockId,
        uint256 newReleaseTime
    );
    
    /**
     * @dev ERC20 토큰 잠금 생성
     * @param tokenAddress 토큰 컨트랙트 주소
     * @param beneficiary 수혜자 주소
     * @param amount 잠금 금액
     * @param releaseTime 해제 시간
     * @param description 설명
     * @return lockId 생성된 잠금 ID
     */
    function createERC20Lock(
        address tokenAddress,
        address beneficiary,
        uint256 amount,
        uint256 releaseTime,
        string memory description
    ) external nonReentrant returns (uint256) {
        require(tokenAddress != address(0), "TokenTimelock: token address is zero");
        require(beneficiary != address(0), "TokenTimelock: beneficiary is zero");
        require(amount > 0, "TokenTimelock: amount is zero");
        require(releaseTime > block.timestamp, "TokenTimelock: release time is before current time");
        
        IERC20 token = IERC20(tokenAddress);
        
        // 토큰 전송
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "TokenTimelock: transfer failed"
        );
        
        // 잠금 정보 저장
        uint256 lockId = locks.length;
        locks.push(
            LockInfo({
                tokenAddress: tokenAddress,
                tokenType: TokenType.ERC20,
                beneficiary: beneficiary,
                tokenId: 0,
                amount: amount,
                releaseTime: releaseTime,
                isReleased: false,
                description: description
            })
        );
        
        // 사용자의 잠금 목록에 추가
        _userLocks[beneficiary].push(lockId);
        
        emit LockCreated(
            lockId,
            tokenAddress,
            TokenType.ERC20,
            beneficiary,
            0,
            amount,
            releaseTime,
            description
        );
        
        return lockId;
    }
    
    /**
     * @dev ERC1155 토큰 잠금 생성
     * @param tokenAddress 토큰 컨트랙트 주소
     * @param beneficiary 수혜자 주소
     * @param tokenId 토큰 ID
     * @param amount 잠금 금액
     * @param releaseTime 해제 시간
     * @param description 설명
     * @return lockId 생성된 잠금 ID
     */
    function createERC1155Lock(
        address tokenAddress,
        address beneficiary,
        uint256 tokenId,
        uint256 amount,
        uint256 releaseTime,
        string memory description
    ) external nonReentrant returns (uint256) {
        require(tokenAddress != address(0), "TokenTimelock: token address is zero");
        require(beneficiary != address(0), "TokenTimelock: beneficiary is zero");
        require(amount > 0, "TokenTimelock: amount is zero");
        require(releaseTime > block.timestamp, "TokenTimelock: release time is before current time");
        
        IERC1155 token = IERC1155(tokenAddress);
        
        // 토큰 전송
        token.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        
        // 잠금 정보 저장
        uint256 lockId = locks.length;
        locks.push(
            LockInfo({
                tokenAddress: tokenAddress,
                tokenType: TokenType.ERC1155,
                beneficiary: beneficiary,
                tokenId: tokenId,
                amount: amount,
                releaseTime: releaseTime,
                isReleased: false,
                description: description
            })
        );
        
        // 사용자의 잠금 목록에 추가
        _userLocks[beneficiary].push(lockId);
        
        emit LockCreated(
            lockId,
            tokenAddress,
            TokenType.ERC1155,
            beneficiary,
            tokenId,
            amount,
            releaseTime,
            description
        );
        
        return lockId;
    }
    
    /**
     * @dev 토큰 해제
     * @param lockId 잠금 ID
     */
    function release(uint256 lockId) external nonReentrant {
        require(lockId < locks.length, "TokenTimelock: invalid lock ID");
        
        LockInfo storage lockInfo = locks[lockId];
        
        require(!lockInfo.isReleased, "TokenTimelock: tokens already released");
        require(block.timestamp >= lockInfo.releaseTime, "TokenTimelock: current time is before release time");
        require(
            msg.sender == lockInfo.beneficiary || msg.sender == owner(),
            "TokenTimelock: caller is not beneficiary or owner"
        );
        
        // 잠금 해제 상태로 변경
        lockInfo.isReleased = true;
        
        // 토큰 유형에 따라 처리
        if (lockInfo.tokenType == TokenType.ERC20) {
            IERC20 token = IERC20(lockInfo.tokenAddress);
            require(
                token.transfer(lockInfo.beneficiary, lockInfo.amount),
                "TokenTimelock: transfer failed"
            );
        } else {
            IERC1155 token = IERC1155(lockInfo.tokenAddress);
            token.safeTransferFrom(
                address(this),
                lockInfo.beneficiary,
                lockInfo.tokenId,
                lockInfo.amount,
                ""
            );
        }
        
        emit TokensReleased(lockId, lockInfo.beneficiary, lockInfo.amount);
    }
    
    /**
     * @dev 잠금 해제 시간 연장 (토큰 소유자 또는 관리자만 가능)
     * @param lockId 잠금 ID
     * @param newReleaseTime 새 해제 시간
     */
    function extendLock(uint256 lockId, uint256 newReleaseTime) external nonReentrant {
        require(lockId < locks.length, "TokenTimelock: invalid lock ID");
        
        LockInfo storage lockInfo = locks[lockId];
        
        require(!lockInfo.isReleased, "TokenTimelock: tokens already released");
        require(
            msg.sender == owner() || msg.sender == lockInfo.beneficiary,
            "TokenTimelock: caller is not beneficiary or owner"
        );
        require(newReleaseTime > lockInfo.releaseTime, "TokenTimelock: new release time must be later than current");
        
        lockInfo.releaseTime = newReleaseTime;
        
        emit LockExtended(lockId, newReleaseTime);
    }
    
    /**
     * @dev 사용자의 잠금 목록 조회
     * @param user 사용자 주소
     * @return 잠금 ID 배열
     */
    function getUserLocks(address user) external view returns (uint256[] memory) {
        return _userLocks[user];
    }
    
    /**
     * @dev 총 잠금 수 조회
     * @return 총 잠금 수
     */
    function getLockCount() external view returns (uint256) {
        return locks.length;
    }
    
    /**
     * @dev 잠금 정보 조회
     * @param lockId 잠금 ID
     * @return tokenAddress 토큰 주소
     * @return tokenType 토큰 유형
     * @return beneficiary 수혜자
     * @return tokenId 토큰 ID
     * @return amount 금액
     * @return releaseTime 해제 시간
     * @return isReleased 해제 여부
     * @return description 설명
     */
    function getLockInfo(uint256 lockId) external view returns (
        address tokenAddress,
        TokenType tokenType,
        address beneficiary,
        uint256 tokenId,
        uint256 amount,
        uint256 releaseTime,
        bool isReleased,
        string memory description
    ) {
        require(lockId < locks.length, "TokenTimelock: invalid lock ID");
        
        LockInfo storage lockInfo = locks[lockId];
        
        return (
            lockInfo.tokenAddress,
            lockInfo.tokenType,
            lockInfo.beneficiary,
            lockInfo.tokenId,
            lockInfo.amount,
            lockInfo.releaseTime,
            lockInfo.isReleased,
            lockInfo.description
        );
    }
    
    /**
     * @dev 특정 시간 이후에 해제될 잠금 목록 조회
     * @param timestamp 타임스탬프
     * @return 잠금 ID 배열
     */
    function getLocksAfter(uint256 timestamp) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // 조건에 맞는 잠금 수 계산
        for (uint256 i = 0; i < locks.length; i++) {
            if (locks[i].releaseTime > timestamp && !locks[i].isReleased) {
                count++;
            }
        }
        
        // 결과 배열 생성
        uint256[] memory result = new uint256[](count);
        uint256 resultIndex = 0;
        
        // 결과 배열 채우기
        for (uint256 i = 0; i < locks.length; i++) {
            if (locks[i].releaseTime > timestamp && !locks[i].isReleased) {
                result[resultIndex] = i;
                resultIndex++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev ERC1155 토큰 수신 처리
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    /**
     * @dev ERC1155 배치 토큰 수신 처리
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
} 