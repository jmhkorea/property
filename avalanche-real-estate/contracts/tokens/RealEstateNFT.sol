// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IRealEstateNFT.sol";

/**
 * @title RealEstateNFT
 * @dev 부동산 NFT 토큰을 위한 스마트 컨트랙트
 */
contract RealEstateNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, IRealEstateNFT {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // 부동산 정보 매핑
    mapping(uint256 => PropertyInfo) private _properties;
    
    // 토큰화 권한이 있는 주소들
    mapping(address => bool) private _tokenizerAddresses;
    
    // 이벤트 정의
    event PropertyMinted(uint256 indexed tokenId, address indexed owner, string propertyAddress);
    event PropertyInfoUpdated(uint256 indexed tokenId, uint256 squareMeters, uint256 appraisedValue);
    event PropertyTokenized(uint256 indexed tokenId, bool isTokenized);
    
    constructor() ERC721("RealEstateNFT", "RENFT") {
        // 컨트랙트 배포자를 토큰화 권한 보유자로 추가
        _tokenizerAddresses[msg.sender] = true;
    }
    
    /**
     * @dev 토큰화 권한이 있는지 확인하는 modifier
     */
    modifier onlyTokenizer() {
        require(_tokenizerAddresses[msg.sender], "RealEstateNFT: caller is not a tokenizer");
        _;
    }
    
    /**
     * @dev 토큰 소유자 또는 토큰화 권한자인지 확인하는 modifier
     */
    modifier onlyOwnerOrTokenizer(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender || _tokenizerAddresses[msg.sender],
            "RealEstateNFT: caller is not the owner or a tokenizer"
        );
        _;
    }
    
    /**
     * @dev 토큰화 권한 부여
     * @param tokenizerAddress 토큰화 권한을 부여할 주소
     */
    function addTokenizer(address tokenizerAddress) external onlyOwner {
        _tokenizerAddresses[tokenizerAddress] = true;
    }
    
    /**
     * @dev 토큰화 권한 제거
     * @param tokenizerAddress 토큰화 권한을 제거할 주소
     */
    function removeTokenizer(address tokenizerAddress) external onlyOwner {
        _tokenizerAddresses[tokenizerAddress] = false;
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
    ) external override onlyTokenizer returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, ipfsDocumentURI);
        
        // 부동산 정보 저장
        _properties[tokenId] = PropertyInfo({
            propertyAddress: propertyAddress,
            squareMeters: squareMeters,
            propertyType: propertyType,
            appraisedValue: appraisedValue,
            ipfsDocumentURI: ipfsDocumentURI,
            latitude: latitude,
            longitude: longitude,
            owner: to,
            isTokenized: false
        });
        
        emit PropertyMinted(tokenId, to, propertyAddress);
        
        return tokenId;
    }
    
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
    ) external override onlyOwnerOrTokenizer(tokenId) {
        require(_exists(tokenId), "RealEstateNFT: token does not exist");
        
        PropertyInfo storage property = _properties[tokenId];
        
        property.squareMeters = squareMeters;
        property.propertyType = propertyType;
        property.appraisedValue = appraisedValue;
        property.ipfsDocumentURI = ipfsDocumentURI;
        
        // 토큰 URI 업데이트
        _setTokenURI(tokenId, ipfsDocumentURI);
        
        emit PropertyInfoUpdated(tokenId, squareMeters, appraisedValue);
    }
    
    /**
     * @dev 토큰화 상태 설정
     * @param tokenId 토큰 ID
     * @param isTokenized 토큰화 여부
     */
    function setTokenized(
        uint256 tokenId,
        bool isTokenized
    ) external override onlyTokenizer {
        require(_exists(tokenId), "RealEstateNFT: token does not exist");
        
        PropertyInfo storage property = _properties[tokenId];
        property.isTokenized = isTokenized;
        
        emit PropertyTokenized(tokenId, isTokenized);
    }
    
    /**
     * @dev 토큰 ID로 부동산 정보 조회
     * @param tokenId 토큰 ID
     * @return 부동산 정보
     */
    function getPropertyInfo(uint256 tokenId) external view override returns (PropertyInfo memory) {
        require(_exists(tokenId), "RealEstateNFT: token does not exist");
        return _properties[tokenId];
    }
    
    /**
     * @dev 토큰 전송 시 부동산 정보의 소유자도 업데이트
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // 새로운 토큰 발행이 아닌 경우 소유자 정보 업데이트
        if (from != address(0) && to != address(0)) {
            PropertyInfo storage property = _properties[tokenId];
            property.owner = to;
        }
    }
    
    /**
     * @dev 다음 함수들은 상속 컨트랙트 간의 충돌을 해결하기 위한 오버라이드
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return interfaceId == type(IRealEstateNFT).interfaceId || super.supportsInterface(interfaceId);
    }
} 