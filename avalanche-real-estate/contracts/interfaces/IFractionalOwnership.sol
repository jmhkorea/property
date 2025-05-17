// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IFractionalOwnership
 * @dev 부동산 토큰화를 위한 분할 소유권 인터페이스
 */
interface IFractionalOwnership {
    /**
     * @dev 지분 정보 구조체
     */
    struct ShareInfo {
        uint256 propertyId;        // 원본 부동산 NFT ID
        uint256 totalShares;       // 총 지분 수
        uint256 availableShares;   // 판매 가능한 지분 수
        uint256 pricePerShare;     // 지분당 가격
        string propertyAddress;    // 부동산 실제 주소
        address tokenizer;         // 토큰화를 요청한 사용자 주소
        bool active;               // 활성화 상태
    }

    /**
     * @dev 부동산 NFT를 분할 소유권으로 토큰화
     * @param propertyId 부동산 NFT ID
     * @param totalShares 총 지분 수
     * @param pricePerShare 지분당 가격
     * @return shareId 생성된 지분 ID
     */
    function tokenizeProperty(
        uint256 propertyId,
        uint256 totalShares,
        uint256 pricePerShare
    ) external returns (uint256 shareId);

    /**
     * @dev 지분 구매
     * @param shareId 지분 ID
     * @param amount 구매할 지분 수
     */
    function buyShares(uint256 shareId, uint256 amount) external payable;

    /**
     * @dev 지분 판매
     * @param shareId 지분 ID
     * @param amount 판매할 지분 수
     * @param price 판매 가격
     */
    function listShares(uint256 shareId, uint256 amount, uint256 price) external;

    /**
     * @dev 판매 중인 지분 구매
     * @param shareId 지분 ID
     * @param seller 판매자 주소
     * @param amount 구매할 지분 수
     */
    function buyListedShares(uint256 shareId, address seller, uint256 amount) external payable;

    /**
     * @dev 특정 사용자가 보유한 지분 수 조회
     * @param shareId 지분 ID
     * @param account 사용자 주소
     * @return 보유 지분 수
     */
    function balanceOf(uint256 shareId, address account) external view returns (uint256);

    /**
     * @dev 지분 정보 조회
     * @param shareId 지분 ID
     * @return 지분 정보
     */
    function getShareInfo(uint256 shareId) external view returns (ShareInfo memory);

    /**
     * @dev 사용자가 소유한 모든 지분 ID 조회
     * @param account 사용자 주소
     * @return 지분 ID 배열
     */
    function getOwnedShares(address account) external view returns (uint256[] memory);
} 