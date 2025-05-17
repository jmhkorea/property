// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IFractionalOwnership.sol";
import "../interfaces/IRealEstateNFT.sol";

/**
 * @title FractionalOwnership
 * @dev 부동산 토큰화를 위한 분할 소유권 컨트랙트
 */
contract FractionalOwnership is ERC1155, ERC1155URIStorage, Ownable, IFractionalOwnership {
    using Counters for Counters.Counter;
    Counters.Counter private _shareIdCounter;
    
    // 부동산 NFT 컨트랙트 인터페이스
    IRealEstateNFT private _realEstateNFT;
    
    // 지분 정보 매핑
    mapping(uint256 => ShareInfo) private _shares;
    
    // 판매 중인 지분 정보
    struct ListedShare {
        uint256 amount;
        uint256 price;
        bool isListed;
    }
    
    // 사용자별 등록된 판매 지분
    mapping(uint256 => mapping(address => ListedShare)) private _listedShares;
    
    // 사용자별 소유한 지분 ID 목록
    mapping(address => uint256[]) private _ownedShareIds;
    mapping(address => mapping(uint256 => bool)) private _ownedSharesIndex;
    
    // 이벤트 정의
    event PropertyTokenized(uint256 indexed shareId, uint256 indexed propertyId, uint256 totalShares, uint256 pricePerShare);
    event SharesPurchased(uint256 indexed shareId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event SharesListed(uint256 indexed shareId, address indexed seller, uint256 amount, uint256 price);
    event ListedSharesPurchased(uint256 indexed shareId, address indexed buyer, address indexed seller, uint256 amount, uint256 totalPrice);
    
    /**
     * @dev 생성자 - ERC1155의 기본 URI와 부동산 NFT 컨트랙트 주소 설정
     */
    constructor(address realEstateNFTAddress) ERC1155("ipfs://") {
        _realEstateNFT = IRealEstateNFT(realEstateNFTAddress);
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
    ) external override returns (uint256) {
        // 호출자가 부동산 NFT의 소유자인지 확인
        require(
            _realEstateNFT.getPropertyInfo(propertyId).owner == msg.sender,
            "FractionalOwnership: caller is not the property owner"
        );
        
        // 부동산이 이미 토큰화되어 있는지 확인
        require(
            !_realEstateNFT.getPropertyInfo(propertyId).isTokenized,
            "FractionalOwnership: property is already tokenized"
        );
        
        // 지분 ID 생성
        _shareIdCounter.increment();
        uint256 shareId = _shareIdCounter.current();
        
        // 부동산 정보 가져오기
        IRealEstateNFT.PropertyInfo memory propertyInfo = _realEstateNFT.getPropertyInfo(propertyId);
        
        // 지분 정보 저장
        _shares[shareId] = ShareInfo({
            propertyId: propertyId,
            totalShares: totalShares,
            availableShares: totalShares,
            pricePerShare: pricePerShare,
            propertyAddress: propertyInfo.propertyAddress,
            tokenizer: msg.sender,
            active: true
        });
        
        // 부동산 NFT를 토큰화 상태로 설정
        _realEstateNFT.setTokenized(propertyId, true);
        
        // 생성자에게 모든 지분 발행
        _mint(msg.sender, shareId, totalShares, "");
        
        // 토큰화 이벤트 발생
        emit PropertyTokenized(shareId, propertyId, totalShares, pricePerShare);
        
        // 소유자의 지분 ID 목록 업데이트
        if (!_ownedSharesIndex[msg.sender][shareId]) {
            _ownedShareIds[msg.sender].push(shareId);
            _ownedSharesIndex[msg.sender][shareId] = true;
        }
        
        return shareId;
    }
    
    /**
     * @dev 지분 구매
     * @param shareId 지분 ID
     * @param amount 구매할 지분 수
     */
    function buyShares(uint256 shareId, uint256 amount) external payable override {
        ShareInfo storage share = _shares[shareId];
        
        require(share.active, "FractionalOwnership: share is not active");
        require(amount > 0, "FractionalOwnership: amount must be greater than 0");
        require(amount <= share.availableShares, "FractionalOwnership: not enough available shares");
        
        // 가격 계산
        uint256 totalPrice = amount * share.pricePerShare;
        require(msg.value >= totalPrice, "FractionalOwnership: insufficient payment");
        
        // 지분 전송
        _safeTransferFrom(share.tokenizer, msg.sender, shareId, amount, "");
        
        // 가용 지분 수 업데이트
        share.availableShares -= amount;
        
        // 과잉 지불된 금액 환불
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        // 토큰화 요청자에게 지불
        payable(share.tokenizer).transfer(totalPrice);
        
        // 구매 이벤트 발생
        emit SharesPurchased(shareId, msg.sender, amount, totalPrice);
        
        // 구매자의 지분 ID 목록 업데이트
        if (!_ownedSharesIndex[msg.sender][shareId]) {
            _ownedShareIds[msg.sender].push(shareId);
            _ownedSharesIndex[msg.sender][shareId] = true;
        }
    }
    
    /**
     * @dev 지분 판매 등록
     * @param shareId 지분 ID
     * @param amount 판매할 지분 수
     * @param price 지분당 판매 가격
     */
    function listShares(uint256 shareId, uint256 amount, uint256 price) external override {
        require(amount > 0, "FractionalOwnership: amount must be greater than 0");
        require(balanceOf(msg.sender, shareId) >= amount, "FractionalOwnership: not enough shares");
        
        // 판매 정보 저장
        _listedShares[shareId][msg.sender] = ListedShare({
            amount: amount,
            price: price,
            isListed: true
        });
        
        // 판매 등록 이벤트 발생
        emit SharesListed(shareId, msg.sender, amount, price);
    }
    
    /**
     * @dev 판매 중인 지분 구매
     * @param shareId 지분 ID
     * @param seller 판매자 주소
     * @param amount 구매할 지분 수
     */
    function buyListedShares(uint256 shareId, address seller, uint256 amount) external payable override {
        ListedShare storage listedShare = _listedShares[shareId][seller];
        
        require(listedShare.isListed, "FractionalOwnership: shares not listed for sale");
        require(amount > 0, "FractionalOwnership: amount must be greater than 0");
        require(amount <= listedShare.amount, "FractionalOwnership: not enough shares listed");
        
        // 가격 계산
        uint256 totalPrice = amount * listedShare.price;
        require(msg.value >= totalPrice, "FractionalOwnership: insufficient payment");
        
        // 지분 전송
        _safeTransferFrom(seller, msg.sender, shareId, amount, "");
        
        // 판매 정보 업데이트
        listedShare.amount -= amount;
        if (listedShare.amount == 0) {
            listedShare.isListed = false;
        }
        
        // 과잉 지불된 금액 환불
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        // 판매자에게 지불
        payable(seller).transfer(totalPrice);
        
        // 구매 이벤트 발생
        emit ListedSharesPurchased(shareId, msg.sender, seller, amount, totalPrice);
        
        // 구매자의 지분 ID 목록 업데이트
        if (!_ownedSharesIndex[msg.sender][shareId]) {
            _ownedShareIds[msg.sender].push(shareId);
            _ownedSharesIndex[msg.sender][shareId] = true;
        }
    }
    
    /**
     * @dev 지분 정보 조회
     * @param shareId 지분 ID
     * @return 지분 정보
     */
    function getShareInfo(uint256 shareId) external view override returns (ShareInfo memory) {
        return _shares[shareId];
    }
    
    /**
     * @dev 사용자가 소유한 모든 지분 ID 조회
     * @param account 사용자 주소
     * @return 지분 ID 배열
     */
    function getOwnedShares(address account) external view override returns (uint256[] memory) {
        return _ownedShareIds[account];
    }
    
    /**
     * @dev 지분 ID, 판매자 주소로 등록된 판매 정보 조회
     * @param shareId 지분 ID
     * @param seller 판매자 주소
     * @return amount 판매 수량
     * @return price 판매 가격
     * @return isListed 판매 중 여부
     */
    function getListedShareInfo(uint256 shareId, address seller) external view returns (uint256 amount, uint256 price, bool isListed) {
        ListedShare memory listedShare = _listedShares[shareId][seller];
        return (listedShare.amount, listedShare.price, listedShare.isListed);
    }
    
    /**
     * @dev OpenZeppelin의 ERC1155URIStorage와의 통합을 위한 함수 오버라이드
     */
    function uri(uint256 tokenId) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tokenId);
    }
    
    /**
     * @dev 특정 지분의 지분 URI 설정
     * @param shareId 지분 ID
     * @param newURI 새 URI
     */
    function setShareURI(uint256 shareId, string memory newURI) external onlyOwner {
        _setURI(shareId, newURI);
    }
} 