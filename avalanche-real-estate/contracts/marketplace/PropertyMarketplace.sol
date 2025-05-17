// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "../interfaces/IRealEstateNFT.sol";

/**
 * @title PropertyMarketplace
 * @dev 부동산 NFT 마켓플레이스 컨트랙트
 */
contract PropertyMarketplace is Ownable, ReentrancyGuard, ERC721Holder {
    // 부동산 NFT 인터페이스
    IRealEstateNFT public realEstateNFT;
    
    // 판매 정보 구조체
    struct Listing {
        address seller;       // 판매자
        uint256 price;        // 판매 가격
        bool isActive;        // 활성화 여부
        uint256 listingTime;  // 등록 시간
    }
    
    // 마켓플레이스 설정
    uint256 public marketplaceFee = 250;  // 거래 수수료 (2.5%)
    uint256 public constant FEE_DENOMINATOR = 10000;  // 수수료 계산을 위한 분모
    
    // 모금된 수수료 금액
    uint256 public collectedFees;
    
    // 판매 목록 매핑
    mapping(uint256 => Listing) public listings;
    
    // 판매 중인 모든 NFT ID 목록
    uint256[] public activeListings;
    mapping(uint256 => uint256) private activeListingIndexes;
    
    // 이벤트 정의
    event PropertyListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCanceled(uint256 indexed tokenId, address indexed seller);
    event PropertySold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event MarketplaceFeeUpdated(uint256 previousFee, uint256 newFee);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    
    /**
     * @dev 생성자
     * @param _realEstateNFT 부동산 NFT 컨트랙트 주소
     */
    constructor(address _realEstateNFT) {
        realEstateNFT = IRealEstateNFT(_realEstateNFT);
    }
    
    /**
     * @dev 부동산 NFT 판매 등록
     * @param tokenId NFT ID
     * @param price 판매 가격
     */
    function listProperty(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "PropertyMarketplace: price must be greater than 0");
        
        // NFT 소유자 확인
        address owner = IERC721(address(realEstateNFT)).ownerOf(tokenId);
        require(owner == msg.sender, "PropertyMarketplace: not the owner");
        
        // 부동산 정보 확인
        IRealEstateNFT.PropertyInfo memory propertyInfo = realEstateNFT.getPropertyInfo(tokenId);
        require(!propertyInfo.isTokenized, "PropertyMarketplace: tokenized properties cannot be listed");
        
        // 판매 정보 등록
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true,
            listingTime: block.timestamp
        });
        
        // 활성 판매 목록에 추가
        if (activeListingIndexes[tokenId] == 0) {
            activeListings.push(tokenId);
            activeListingIndexes[tokenId] = activeListings.length;
        }
        
        // NFT를 마켓플레이스로 전송
        IERC721(address(realEstateNFT)).safeTransferFrom(msg.sender, address(this), tokenId);
        
        emit PropertyListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev 부동산 판매 취소
     * @param tokenId NFT ID
     */
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        
        require(listing.isActive, "PropertyMarketplace: listing not active");
        require(listing.seller == msg.sender, "PropertyMarketplace: not the seller");
        
        // 판매 정보 비활성화
        listings[tokenId].isActive = false;
        
        // 활성 판매 목록에서 제거
        removeFromActiveListings(tokenId);
        
        // NFT를 판매자에게 반환
        IERC721(address(realEstateNFT)).safeTransferFrom(address(this), msg.sender, tokenId);
        
        emit ListingCanceled(tokenId, msg.sender);
    }
    
    /**
     * @dev 부동산 구매
     * @param tokenId NFT ID
     */
    function buyProperty(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        
        require(listing.isActive, "PropertyMarketplace: listing not active");
        require(msg.value >= listing.price, "PropertyMarketplace: insufficient payment");
        
        // 수수료 계산
        uint256 fee = (listing.price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = listing.price - fee;
        
        // 수수료 추가
        collectedFees += fee;
        
        // 판매 정보 비활성화
        listings[tokenId].isActive = false;
        
        // 활성 판매 목록에서 제거
        removeFromActiveListings(tokenId);
        
        // 판매자에게 금액 전송
        payable(listing.seller).transfer(sellerAmount);
        
        // 구매자에게 NFT 전송
        IERC721(address(realEstateNFT)).safeTransferFrom(address(this), msg.sender, tokenId);
        
        // 거스름돈 반환
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit PropertySold(tokenId, listing.seller, msg.sender, listing.price);
    }
    
    /**
     * @dev 수수료 인출 (오너만 호출 가능)
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        require(amount > 0, "PropertyMarketplace: no fees to withdraw");
        
        collectedFees = 0;
        payable(owner()).transfer(amount);
        
        emit FeesWithdrawn(owner(), amount);
    }
    
    /**
     * @dev 마켓플레이스 수수료 설정 (오너만 호출 가능)
     * @param _fee 새 수수료 (기본 단위: 10000, 예: 250 = 2.5%)
     */
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "PropertyMarketplace: fee cannot exceed 10%");
        
        uint256 oldFee = marketplaceFee;
        marketplaceFee = _fee;
        
        emit MarketplaceFeeUpdated(oldFee, _fee);
    }
    
    /**
     * @dev 내부 함수: 활성 판매 목록에서 제거
     * @param tokenId NFT ID
     */
    function removeFromActiveListings(uint256 tokenId) internal {
        uint256 index = activeListingIndexes[tokenId];
        
        if (index > 0) {
            // 인덱스는 1부터 시작하므로 1을 빼줍니다.
            index--;
            
            // 마지막 요소가 아닌 경우, 마지막 요소를 현재 위치로 이동
            if (index < activeListings.length - 1) {
                uint256 lastTokenId = activeListings[activeListings.length - 1];
                activeListings[index] = lastTokenId;
                activeListingIndexes[lastTokenId] = index + 1;
            }
            
            // 배열 크기 감소
            activeListings.pop();
            
            // 매핑에서 제거
            delete activeListingIndexes[tokenId];
        }
    }
    
    /**
     * @dev 판매 중인 부동산 조회
     * @param tokenId NFT ID
     * @return 판매 정보
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
    
    /**
     * @dev 판매 중인 모든 부동산 조회
     * @return 판매 중인 NFT ID 배열
     */
    function getAllActiveListings() external view returns (uint256[] memory) {
        return activeListings;
    }
    
    /**
     * @dev 판매 중인 부동산 수 조회
     * @return 판매 중인 부동산 수
     */
    function getActiveListingsCount() external view returns (uint256) {
        return activeListings.length;
    }
} 