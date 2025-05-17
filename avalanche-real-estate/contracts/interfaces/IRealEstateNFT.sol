// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IRealEstateNFT
 * @dev 부동산 NFT 스마트 컨트랙트 인터페이스
 */
interface IRealEstateNFT {
    /**
     * @dev 부동산 정보 구조체
     */
    struct PropertyInfo {
        string propertyAddress;        // 부동산 실제 주소
        uint256 squareMeters;          // 면적 (제곱미터)
        string propertyType;           // 부동산 유형 (아파트, 주택, 상가 등)
        uint256 appraisedValue;        // 평가 가치 (USD)
        string ipfsDocumentURI;        // 소유권 증서 IPFS URI
        string latitude;               // 위도
        string longitude;              // 경도
        address owner;                 // 소유자 주소
        bool isTokenized;              // 토큰화 여부
    }

    /**
     * @dev 새로운 부동산 NFT 발행
     * @param to 토큰을 받을 주소
     * @param propertyAddress 부동산 물리적 주소
     * @param squareMeters 면적 (제곱미터)
     * @param propertyType 부동산 유형
     * @param appraisedValue 평가 가치
     * @param ipfsDocumentURI 소유권 증서 IPFS URI
     * @param latitude 위도
     * @param longitude 경도
     * @return tokenId 생성된 토큰 ID
     */
    function mintProperty(
        address to,
        string memory propertyAddress,
        uint256 squareMeters,
        string memory propertyType,
        uint256 appraisedValue,
        string memory ipfsDocumentURI,
        string memory latitude,
        string memory longitude
    ) external returns (uint256 tokenId);

    /**
     * @dev 부동산 정보 업데이트
     * @param tokenId 토큰 ID
     * @param squareMeters 면적 (제곱미터)
     * @param propertyType 부동산 유형
     * @param appraisedValue 평가 가치
     * @param ipfsDocumentURI 소유권 증서 IPFS URI
     */
    function updatePropertyInfo(
        uint256 tokenId,
        uint256 squareMeters,
        string memory propertyType,
        uint256 appraisedValue,
        string memory ipfsDocumentURI
    ) external;

    /**
     * @dev 토큰화 상태 설정
     * @param tokenId 토큰 ID
     * @param isTokenized 토큰화 여부
     */
    function setTokenized(
        uint256 tokenId,
        bool isTokenized
    ) external;

    /**
     * @dev 토큰 ID로 부동산 정보 조회
     * @param tokenId 토큰 ID
     * @return 부동산 정보
     */
    function getPropertyInfo(uint256 tokenId) external view returns (PropertyInfo memory);
} 