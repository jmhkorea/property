// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title PropertyStaking
 * @dev 부동산 토큰 스테이킹 및 보상 분배 컨트랙트
 */
contract PropertyStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // 스테이킹 및 보상 토큰
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    // 스테이킹 정보 구조체
    struct StakingInfo {
        uint256 amount;           // 스테이킹 양
        uint256 rewardDebt;       // 보상 부채
        uint256 lastUpdateTime;   // 마지막 업데이트 시간
        uint256 lockEndTime;      // 락업 종료 시간
    }

    // 초당 보상 비율 (10^18 단위)
    uint256 public rewardPerSecond;
    
    // 전체 스테이킹 양
    uint256 public totalStaked;
    
    // 마지막 업데이트 시간
    uint256 public lastUpdateTime;
    
    // 누적 보상 비율 (10^18 단위)
    uint256 public accRewardPerShare;
    
    // 사용자별 스테이킹 정보
    mapping(address => StakingInfo) public stakingInfo;
    
    // 스테이킹 락업 기간 옵션
    uint256[] public lockupOptions;
    
    // 락업 기간별 보상 승수 (10000 = 1배)
    mapping(uint256 => uint256) public lockupMultipliers;
    
    // 이벤트 정의
    event Staked(address indexed user, uint256 amount, uint256 lockupPeriod);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 rewardPerSecond);
    
    /**
     * @dev 생성자
     * @param _stakingToken 스테이킹 토큰 주소
     * @param _rewardToken 보상 토큰 주소
     * @param _rewardPerSecond 초당 보상 비율
     */
    constructor(
        IERC20 _stakingToken,
        IERC20 _rewardToken,
        uint256 _rewardPerSecond
    ) {
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        rewardPerSecond = _rewardPerSecond;
        lastUpdateTime = block.timestamp;
        
        // 기본 락업 기간 옵션 설정 (30일, 90일, 180일, 365일)
        lockupOptions = [30 days, 90 days, 180 days, 365 days];
        
        // 락업 기간별 보상 승수 설정 (1.1배, 1.3배, 1.5배, 2배)
        lockupMultipliers[30 days] = 11000;   // 1.1배
        lockupMultipliers[90 days] = 13000;   // 1.3배
        lockupMultipliers[180 days] = 15000;  // 1.5배
        lockupMultipliers[365 days] = 20000;  // 2배
    }
    
    /**
     * @dev 내부 함수: 보상 정보 업데이트
     */
    function _updateRewards() internal {
        if (block.timestamp <= lastUpdateTime) {
            return;
        }
        
        if (totalStaked == 0) {
            lastUpdateTime = block.timestamp;
            return;
        }
        
        uint256 timePassed = block.timestamp - lastUpdateTime;
        uint256 reward = timePassed * rewardPerSecond;
        accRewardPerShare = accRewardPerShare + ((reward * 1e18) / totalStaked);
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev 내부 함수: 사용자별 보상 계산
     * @param _user 사용자 주소
     * @return 누적 보상
     */
    function _calculateReward(address _user) internal view returns (uint256) {
        StakingInfo storage user = stakingInfo[_user];
        
        if (user.amount == 0) {
            return 0;
        }
        
        // 현재 시점까지의 업데이트된 보상률 계산
        uint256 currentAccRewardPerShare = accRewardPerShare;
        
        if (block.timestamp > lastUpdateTime && totalStaked > 0) {
            uint256 timePassed = block.timestamp - lastUpdateTime;
            uint256 reward = timePassed * rewardPerSecond;
            currentAccRewardPerShare = currentAccRewardPerShare + ((reward * 1e18) / totalStaked);
        }
        
        // 락업 보상 승수 적용
        uint256 lockupMultiplier = 10000; // 기본값 1배
        if (user.lockEndTime > block.timestamp) {
            uint256 lockupPeriod = user.lockEndTime - user.lastUpdateTime;
            // 가장 가까운 락업 옵션 찾기
            for (uint256 i = 0; i < lockupOptions.length; i++) {
                if (Math.abs(int256(lockupPeriod - lockupOptions[i])) < 1 days) {
                    lockupMultiplier = lockupMultipliers[lockupOptions[i]];
                    break;
                }
            }
        }
        
        // 보상 계산 (락업 승수 적용)
        return (user.amount * currentAccRewardPerShare / 1e18) - user.rewardDebt;
    }
    
    /**
     * @dev 스테이킹
     * @param _amount 스테이킹할 토큰 양
     * @param _lockupPeriod 락업 기간 (초)
     */
    function stake(uint256 _amount, uint256 _lockupPeriod) external nonReentrant {
        require(_amount > 0, "PropertyStaking: cannot stake 0");
        require(_isValidLockupPeriod(_lockupPeriod), "PropertyStaking: invalid lockup period");
        
        StakingInfo storage user = stakingInfo[msg.sender];
        
        // 먼저 보상 정보 업데이트
        _updateRewards();
        
        // 기존 보상 계산
        uint256 pending = 0;
        if (user.amount > 0) {
            pending = (user.amount * accRewardPerShare / 1e18) - user.rewardDebt;
            
            // 보상 지급
            if (pending > 0) {
                rewardToken.safeTransfer(msg.sender, pending);
                emit RewardClaimed(msg.sender, pending);
            }
        }
        
        // 토큰 전송
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // 스테이킹 정보 업데이트
        user.amount += _amount;
        user.rewardDebt = user.amount * accRewardPerShare / 1e18;
        user.lastUpdateTime = block.timestamp;
        user.lockEndTime = block.timestamp + _lockupPeriod;
        
        // 전체 스테이킹 양 업데이트
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount, _lockupPeriod);
    }
    
    /**
     * @dev 언스테이킹
     * @param _amount 언스테이킹할 토큰 양
     */
    function unstake(uint256 _amount) external nonReentrant {
        StakingInfo storage user = stakingInfo[msg.sender];
        require(user.amount >= _amount, "PropertyStaking: not enough staked tokens");
        require(
            block.timestamp >= user.lockEndTime,
            "PropertyStaking: tokens are still locked"
        );
        
        // 보상 정보 업데이트
        _updateRewards();
        
        // 보상 계산
        uint256 pending = (user.amount * accRewardPerShare / 1e18) - user.rewardDebt;
        
        // 스테이킹 정보 업데이트
        user.amount -= _amount;
        user.rewardDebt = user.amount * accRewardPerShare / 1e18;
        
        // 전체 스테이킹 양 업데이트
        totalStaked -= _amount;
        
        // 보상 및 토큰 전송
        if (pending > 0) {
            rewardToken.safeTransfer(msg.sender, pending);
            emit RewardClaimed(msg.sender, pending);
        }
        
        stakingToken.safeTransfer(msg.sender, _amount);
        
        emit Unstaked(msg.sender, _amount);
    }
    
    /**
     * @dev 보상 청구
     */
    function claimRewards() external nonReentrant {
        StakingInfo storage user = stakingInfo[msg.sender];
        require(user.amount > 0, "PropertyStaking: nothing staked");
        
        // 보상 정보 업데이트
        _updateRewards();
        
        // 보상 계산
        uint256 pending = (user.amount * accRewardPerShare / 1e18) - user.rewardDebt;
        require(pending > 0, "PropertyStaking: no rewards to claim");
        
        // 보상 부채 업데이트
        user.rewardDebt = user.amount * accRewardPerShare / 1e18;
        
        // 보상 전송
        rewardToken.safeTransfer(msg.sender, pending);
        
        emit RewardClaimed(msg.sender, pending);
    }
    
    /**
     * @dev 초당 보상 비율 설정 (오너만 호출 가능)
     * @param _rewardPerSecond 새 초당 보상 비율
     */
    function setRewardPerSecond(uint256 _rewardPerSecond) external onlyOwner {
        // 먼저 보상 정보 업데이트
        _updateRewards();
        
        rewardPerSecond = _rewardPerSecond;
        emit RewardRateUpdated(_rewardPerSecond);
    }
    
    /**
     * @dev 락업 옵션 추가 (오너만 호출 가능)
     * @param _period 락업 기간 (초)
     * @param _multiplier 보상 승수 (10000 = 1배)
     */
    function addLockupOption(uint256 _period, uint256 _multiplier) external onlyOwner {
        require(_period > 0, "PropertyStaking: period must be greater than 0");
        require(_multiplier >= 10000, "PropertyStaking: multiplier must be >= 10000");
        
        // 기존 옵션인지 확인
        bool exists = false;
        for (uint256 i = 0; i < lockupOptions.length; i++) {
            if (lockupOptions[i] == _period) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            lockupOptions.push(_period);
        }
        
        lockupMultipliers[_period] = _multiplier;
    }
    
    /**
     * @dev 락업 옵션 제거 (오너만 호출 가능)
     * @param _period 제거할 락업 기간 (초)
     */
    function removeLockupOption(uint256 _period) external onlyOwner {
        // 존재하는 옵션인지 확인 및 제거
        for (uint256 i = 0; i < lockupOptions.length; i++) {
            if (lockupOptions[i] == _period) {
                // 마지막 요소를 현재 위치로 이동 후 배열 크기 감소
                lockupOptions[i] = lockupOptions[lockupOptions.length - 1];
                lockupOptions.pop();
                
                // 승수 매핑 삭제
                delete lockupMultipliers[_period];
                return;
            }
        }
        
        revert("PropertyStaking: lockup period not found");
    }
    
    /**
     * @dev 모든 락업 옵션 조회
     * @return 락업 기간 옵션 배열
     */
    function getLockupOptions() external view returns (uint256[] memory) {
        return lockupOptions;
    }
    
    /**
     * @dev 보상 정보 조회
     * @param _user 사용자 주소
     * @return 누적 보상
     */
    function pendingReward(address _user) external view returns (uint256) {
        return _calculateReward(_user);
    }
    
    /**
     * @dev 스테이킹 정보 조회
     * @param _user 사용자 주소
     * @return 스테이킹 양, 보상 부채, 마지막 업데이트 시간, 락업 종료 시간
     */
    function getUserStakingInfo(address _user) external view returns (
        uint256 stakedAmount,
        uint256 rewardDebt,
        uint256 lastUpdate,
        uint256 unlockTime
    ) {
        StakingInfo memory info = stakingInfo[_user];
        return (info.amount, info.rewardDebt, info.lastUpdateTime, info.lockEndTime);
    }
    
    /**
     * @dev 내부 함수: 유효한 락업 기간인지 확인
     * @param _period 확인할 락업 기간
     * @return 유효 여부
     */
    function _isValidLockupPeriod(uint256 _period) internal view returns (bool) {
        for (uint256 i = 0; i < lockupOptions.length; i++) {
            if (lockupOptions[i] == _period) {
                return true;
            }
        }
        return false;
    }
} 