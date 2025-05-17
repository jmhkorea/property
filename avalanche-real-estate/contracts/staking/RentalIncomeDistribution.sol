// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IFractionalOwnership.sol";

/**
 * @title RentalIncomeDistribution
 * @dev 토큰화된 부동산의 임대 수익을 지분 소유자들에게 분배하는 컨트랙트
 */
contract RentalIncomeDistribution is Ownable, ReentrancyGuard {
    // 분할 소유권 컨트랙트 인터페이스
    IFractionalOwnership public fractionalOwnership;
    
    // 부동산 지분 ID별 배당 정보
    struct DividendInfo {
        uint256 totalDistributed;        // 총 분배된 금액
        uint256 dividendPerShare;        // 지분당 배당금 (10^18 단위)
        uint256 lastDistributionTime;    // 마지막 분배 시간
        bool isActive;                   // 활성화 상태
    }
    
    // 사용자별 배당금 클레임 정보
    struct UserClaimInfo {
        uint256 totalClaimed;            // 총 클레임한 금액
        uint256 lastClaimTime;           // 마지막 클레임 시간
        uint256 rewardDebt;              // 보상 부채 (이미 정산된 금액)
    }
    
    // 지분 ID별 배당 정보
    mapping(uint256 => DividendInfo) public dividendInfo;
    
    // 지분 ID별, 사용자별 클레임 정보
    mapping(uint256 => mapping(address => UserClaimInfo)) public userClaimInfo;
    
    // 지분 ID 목록
    uint256[] public shareIds;
    
    // 이벤트 정의
    event RentalIncomeDeposited(uint256 indexed shareId, uint256 amount, uint256 dividendPerShare);
    event DividendClaimed(uint256 indexed shareId, address indexed user, uint256 amount);
    event PropertyActivated(uint256 indexed shareId, bool isActive);
    
    /**
     * @dev 생성자
     * @param _fractionalOwnership 분할 소유권 컨트랙트 주소
     */
    constructor(address _fractionalOwnership) {
        fractionalOwnership = IFractionalOwnership(_fractionalOwnership);
    }
    
    /**
     * @dev 부동산 지분에 대한 임대 수익 입금
     * @param _shareId 지분 ID
     */
    function depositRentalIncome(uint256 _shareId) external payable nonReentrant {
        require(msg.value > 0, "RentalIncomeDistribution: must deposit some value");
        
        // 지분 정보 가져오기
        IFractionalOwnership.ShareInfo memory shareInfo = fractionalOwnership.getShareInfo(_shareId);
        require(shareInfo.active, "RentalIncomeDistribution: share is not active");
        
        // 지분 ID가 목록에 없으면 추가
        if (!_shareIdExists(_shareId)) {
            shareIds.push(_shareId);
            dividendInfo[_shareId].isActive = true;
        }
        
        DividendInfo storage dividend = dividendInfo[_shareId];
        require(dividend.isActive, "RentalIncomeDistribution: property dividend is not active");
        
        // 지분당 배당금 계산 (10^18 단위)
        uint256 perShare = (msg.value * 1e18) / shareInfo.totalShares;
        
        // 배당 정보 업데이트
        dividend.totalDistributed += msg.value;
        dividend.dividendPerShare += perShare;
        dividend.lastDistributionTime = block.timestamp;
        
        emit RentalIncomeDeposited(_shareId, msg.value, perShare);
    }
    
    /**
     * @dev 사용자가 특정 지분에 대한 배당금 클레임
     * @param _shareId 지분 ID
     */
    function claimDividend(uint256 _shareId) external nonReentrant {
        DividendInfo storage dividend = dividendInfo[_shareId];
        require(dividend.isActive, "RentalIncomeDistribution: property dividend is not active");
        
        // 사용자의 지분 잔액 확인
        uint256 balance = IERC1155(address(fractionalOwnership)).balanceOf(msg.sender, _shareId);
        require(balance > 0, "RentalIncomeDistribution: no shares owned");
        
        // 사용자 클레임 정보 가져오기
        UserClaimInfo storage userInfo = userClaimInfo[_shareId][msg.sender];
        
        // 클레임할 수 있는 배당금 계산
        uint256 earned = (balance * dividend.dividendPerShare / 1e18) - userInfo.rewardDebt;
        require(earned > 0, "RentalIncomeDistribution: no dividend to claim");
        
        // 사용자 정보 업데이트
        userInfo.totalClaimed += earned;
        userInfo.lastClaimTime = block.timestamp;
        userInfo.rewardDebt = balance * dividend.dividendPerShare / 1e18;
        
        // 배당금 전송
        (bool success, ) = payable(msg.sender).call{value: earned}("");
        require(success, "RentalIncomeDistribution: transfer failed");
        
        emit DividendClaimed(_shareId, msg.sender, earned);
    }
    
    /**
     * @dev 모든 지분에 대한 배당금 클레임
     */
    function claimAllDividends() external nonReentrant {
        uint256 totalEarned = 0;
        
        for (uint256 i = 0; i < shareIds.length; i++) {
            uint256 shareId = shareIds[i];
            DividendInfo storage dividend = dividendInfo[shareId];
            
            if (!dividend.isActive) continue;
            
            // 사용자의 지분 잔액 확인
            uint256 balance = IERC1155(address(fractionalOwnership)).balanceOf(msg.sender, shareId);
            if (balance == 0) continue;
            
            // 사용자 클레임 정보 가져오기
            UserClaimInfo storage userInfo = userClaimInfo[shareId][msg.sender];
            
            // 클레임할 수 있는 배당금 계산
            uint256 earned = (balance * dividend.dividendPerShare / 1e18) - userInfo.rewardDebt;
            if (earned == 0) continue;
            
            // 사용자 정보 업데이트
            userInfo.totalClaimed += earned;
            userInfo.lastClaimTime = block.timestamp;
            userInfo.rewardDebt = balance * dividend.dividendPerShare / 1e18;
            
            totalEarned += earned;
            
            emit DividendClaimed(shareId, msg.sender, earned);
        }
        
        require(totalEarned > 0, "RentalIncomeDistribution: no dividends to claim");
        
        // 총 배당금 전송
        (bool success, ) = payable(msg.sender).call{value: totalEarned}("");
        require(success, "RentalIncomeDistribution: transfer failed");
    }
    
    /**
     * @dev 특정 지분에 대한 배당 활성화/비활성화 (오너만 호출 가능)
     * @param _shareId 지분 ID
     * @param _isActive 활성화 여부
     */
    function setPropertyActive(uint256 _shareId, bool _isActive) external onlyOwner {
        require(_shareIdExists(_shareId), "RentalIncomeDistribution: share ID not found");
        
        dividendInfo[_shareId].isActive = _isActive;
        
        emit PropertyActivated(_shareId, _isActive);
    }
    
    /**
     * @dev 사용자가 클레임할 수 있는 특정 지분의 배당금 금액 조회
     * @param _shareId 지분 ID
     * @param _user 사용자 주소
     * @return 클레임 가능한 배당금
     */
    function getClaimableDividend(uint256 _shareId, address _user) external view returns (uint256) {
        DividendInfo memory dividend = dividendInfo[_shareId];
        
        if (!dividend.isActive) return 0;
        
        uint256 balance = IERC1155(address(fractionalOwnership)).balanceOf(_user, _shareId);
        if (balance == 0) return 0;
        
        UserClaimInfo memory userInfo = userClaimInfo[_shareId][_user];
        
        return (balance * dividend.dividendPerShare / 1e18) - userInfo.rewardDebt;
    }
    
    /**
     * @dev 사용자가 클레임할 수 있는 모든 배당금 금액 조회
     * @param _user 사용자 주소
     * @return 클레임 가능한 총 배당금
     */
    function getTotalClaimableDividends(address _user) external view returns (uint256) {
        uint256 totalEarned = 0;
        
        for (uint256 i = 0; i < shareIds.length; i++) {
            uint256 shareId = shareIds[i];
            DividendInfo memory dividend = dividendInfo[shareId];
            
            if (!dividend.isActive) continue;
            
            uint256 balance = IERC1155(address(fractionalOwnership)).balanceOf(_user, shareId);
            if (balance == 0) continue;
            
            UserClaimInfo memory userInfo = userClaimInfo[shareId][_user];
            
            uint256 earned = (balance * dividend.dividendPerShare / 1e18) - userInfo.rewardDebt;
            totalEarned += earned;
        }
        
        return totalEarned;
    }
    
    /**
     * @dev 모든 활성화된 지분 ID 조회
     * @return 활성화된 지분 ID 배열
     */
    function getActiveShareIds() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // 활성화된 지분 수 계산
        for (uint256 i = 0; i < shareIds.length; i++) {
            if (dividendInfo[shareIds[i]].isActive) {
                count++;
            }
        }
        
        // 활성화된 지분 ID만 포함하는 배열 생성
        uint256[] memory activeIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < shareIds.length; i++) {
            if (dividendInfo[shareIds[i]].isActive) {
                activeIds[index] = shareIds[i];
                index++;
            }
        }
        
        return activeIds;
    }
    
    /**
     * @dev 내부 함수: 지분 ID가 목록에 존재하는지 확인
     * @param _shareId 지분 ID
     * @return 존재 여부
     */
    function _shareIdExists(uint256 _shareId) internal view returns (bool) {
        for (uint256 i = 0; i < shareIds.length; i++) {
            if (shareIds[i] == _shareId) {
                return true;
            }
        }
        return false;
    }
} 