const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyMarketplace 테스트", function () {
  let RealEstateNFT;
  let FractionalOwnership;
  let PropertyMarketplace;
  let realEstateNFT;
  let fractionalOwnership;
  let propertyMarketplace;
  let owner;
  let tokenizer;
  let seller;
  let buyer;
  let feeRecipient;
  let propertyId;
  let shareId;
  let listingId;

  // 테스트 데이터
  const propertyAddress = "서울시 강남구 테헤란로 152";
  const squareMeters = 120;
  const propertyType = "아파트";
  const appraisedValue = ethers.utils.parseEther("500"); // 500 AVAX
  const ipfsDocumentURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
  const latitude = "37.5024";
  const longitude = "127.0219";
  
  const totalShares = 100;
  const pricePerShare = ethers.utils.parseEther("5"); // 5 AVAX
  const propertyListingPrice = ethers.utils.parseEther("600"); // 600 AVAX
  const shareAmount = 10;
  const shareListingPrice = ethers.utils.parseEther("6"); // 6 AVAX (조금 더 비싸게 판매)

  beforeEach(async function () {
    // 계정 설정
    [owner, tokenizer, seller, buyer, feeRecipient] = await ethers.getSigners();

    // 컨트랙트 배포
    RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
    realEstateNFT = await RealEstateNFT.deploy();
    await realEstateNFT.deployed();

    FractionalOwnership = await ethers.getContractFactory("FractionalOwnership");
    fractionalOwnership = await FractionalOwnership.deploy(realEstateNFT.address);
    await fractionalOwnership.deployed();

    PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
    propertyMarketplace = await PropertyMarketplace.deploy(feeRecipient.address);
    await propertyMarketplace.deployed();

    // 토큰화 권한 부여
    await realEstateNFT.addTokenizer(tokenizer.address);
    await realEstateNFT.addTokenizer(fractionalOwnership.address);

    // 판매자에게 부동산 NFT 발행
    const tx = await realEstateNFT.connect(tokenizer).mintProperty(
      seller.address,
      propertyAddress,
      squareMeters,
      propertyType,
      appraisedValue,
      ipfsDocumentURI,
      latitude,
      longitude
    );
    const receipt = await tx.wait();
    
    // 이벤트에서 propertyId 추출
    const event = receipt.events.find(e => e.event === 'PropertyMinted');
    propertyId = event.args.tokenId.toNumber();
  });

  describe("부동산 NFT 마켓플레이스 기능", function () {
    it("부동산 NFT를 마켓플레이스에 리스팅할 수 있어야 함", async function () {
      // 마켓플레이스에 NFT 승인
      await realEstateNFT.connect(seller).approve(propertyMarketplace.address, propertyId);
      
      // 리스팅 생성
      const tx = await propertyMarketplace.connect(seller).createPropertyListing(
        realEstateNFT.address,
        propertyId,
        propertyListingPrice
      );
      const receipt = await tx.wait();
      
      // 이벤트에서 listingId 추출
      const event = receipt.events.find(e => e.event === 'ListingCreated');
      listingId = event.args.listingId.toNumber();
      
      // 리스팅 정보 확인
      const listing = await propertyMarketplace.listings(listingId);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.tokenContract).to.equal(realEstateNFT.address);
      expect(listing.tokenId).to.equal(propertyId);
      expect(listing.amount).to.equal(1);
      expect(listing.price).to.equal(propertyListingPrice);
      expect(listing.isERC721).to.equal(true);
      expect(listing.isActive).to.equal(true);
      
      // 판매자의 리스팅 목록 확인
      const sellerListings = await propertyMarketplace.getSellerListings(seller.address);
      expect(sellerListings.length).to.equal(1);
      expect(sellerListings[0]).to.equal(listingId);
    });

    it("리스팅된 부동산 NFT를 구매할 수 있어야 함", async function () {
      // 마켓플레이스에 NFT 승인
      await realEstateNFT.connect(seller).approve(propertyMarketplace.address, propertyId);
      
      // 리스팅 생성
      const txListing = await propertyMarketplace.connect(seller).createPropertyListing(
        realEstateNFT.address,
        propertyId,
        propertyListingPrice
      );
      const receiptListing = await txListing.wait();
      const eventListing = receiptListing.events.find(e => e.event === 'ListingCreated');
      listingId = eventListing.args.listingId.toNumber();
      
      // 구매 전 잔액 기록
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
      
      // 부동산 NFT 구매
      const txBuy = await propertyMarketplace.connect(buyer).buyProperty(listingId, {
        value: propertyListingPrice
      });
      const receiptBuy = await txBuy.wait();
      
      // 이벤트 확인
      const eventBuy = receiptBuy.events.find(e => e.event === 'ListingSold');
      expect(eventBuy.args.buyer).to.equal(buyer.address);
      expect(eventBuy.args.seller).to.equal(seller.address);
      
      // NFT 소유권 이전 확인
      expect(await realEstateNFT.ownerOf(propertyId)).to.equal(buyer.address);
      
      // 리스팅 상태 확인
      const listing = await propertyMarketplace.listings(listingId);
      expect(listing.isActive).to.equal(false);
      
      // 수수료 및 판매금 지불 확인
      const feePercentage = await propertyMarketplace.feePercentage();
      const fee = propertyListingPrice.mul(feePercentage).div(10000);
      const sellerAmount = propertyListingPrice.sub(fee);
      
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
      
      // 판매자 잔액 확인 (가스비 고려하지 않고 대략적으로 확인)
      expect(sellerBalanceAfter.sub(sellerBalanceBefore)).to.be.closeTo(sellerAmount, ethers.utils.parseEther("0.01"));
      
      // 수수료 수령자 잔액 확인
      expect(feeRecipientBalanceAfter.sub(feeRecipientBalanceBefore)).to.equal(fee);
    });

    it("판매자가 리스팅을 취소할 수 있어야 함", async function () {
      // 마켓플레이스에 NFT 승인
      await realEstateNFT.connect(seller).approve(propertyMarketplace.address, propertyId);
      
      // 리스팅 생성
      const txListing = await propertyMarketplace.connect(seller).createPropertyListing(
        realEstateNFT.address,
        propertyId,
        propertyListingPrice
      );
      const receiptListing = await txListing.wait();
      const eventListing = receiptListing.events.find(e => e.event === 'ListingCreated');
      listingId = eventListing.args.listingId.toNumber();
      
      // 리스팅 취소
      const txCancel = await propertyMarketplace.connect(seller).cancelListing(listingId);
      const receiptCancel = await txCancel.wait();
      
      // 이벤트 확인
      const eventCancel = receiptCancel.events.find(e => e.event === 'ListingCancelled');
      expect(eventCancel.args.listingId).to.equal(listingId);
      
      // 리스팅 상태 확인
      const listing = await propertyMarketplace.listings(listingId);
      expect(listing.isActive).to.equal(false);
      
      // 취소된 리스팅은 구매할 수 없어야 함
      await expect(
        propertyMarketplace.connect(buyer).buyProperty(listingId, {
          value: propertyListingPrice
        })
      ).to.be.revertedWith("PropertyMarketplace: listing not active");
    });
  });

  describe("분할 소유권 마켓플레이스 기능", function () {
    beforeEach(async function () {
      // 부동산 NFT를 토큰화하여 분할 소유권 생성
      await realEstateNFT.connect(seller).approve(fractionalOwnership.address, propertyId);
      
      const txTokenize = await fractionalOwnership.connect(seller).tokenizeProperty(
        propertyId,
        totalShares,
        pricePerShare
      );
      const receiptTokenize = await txTokenize.wait();
      
      // 이벤트에서 shareId 추출
      const eventTokenize = receiptTokenize.events.find(e => e.event === 'PropertyTokenized');
      shareId = eventTokenize.args.shareId.toNumber();
      
      // buyer가 일부 지분 구매
      await fractionalOwnership.connect(buyer).buyShares(shareId, shareAmount, {
        value: pricePerShare.mul(shareAmount)
      });
    });

    it("지분 토큰을 마켓플레이스에 리스팅할 수 있어야 함", async function () {
      // 마켓플레이스에 토큰 승인
      await fractionalOwnership.connect(buyer).setApprovalForAll(propertyMarketplace.address, true);
      
      // 리스팅 생성
      const txListing = await propertyMarketplace.connect(buyer).createSharesListing(
        fractionalOwnership.address,
        shareId,
        shareAmount,
        shareListingPrice
      );
      const receiptListing = await txListing.wait();
      
      // 이벤트에서 listingId 추출
      const eventListing = receiptListing.events.find(e => e.event === 'ListingCreated');
      listingId = eventListing.args.listingId.toNumber();
      
      // 리스팅 정보 확인
      const listing = await propertyMarketplace.listings(listingId);
      expect(listing.seller).to.equal(buyer.address);
      expect(listing.tokenContract).to.equal(fractionalOwnership.address);
      expect(listing.tokenId).to.equal(shareId);
      expect(listing.amount).to.equal(shareAmount);
      expect(listing.price).to.equal(shareListingPrice);
      expect(listing.isERC721).to.equal(false);
      expect(listing.isActive).to.equal(true);
    });

    it("리스팅된 지분 토큰을 구매할 수 있어야 함", async function () {
      // 마켓플레이스에 토큰 승인
      await fractionalOwnership.connect(buyer).setApprovalForAll(propertyMarketplace.address, true);
      
      // 리스팅 생성
      const txListing = await propertyMarketplace.connect(buyer).createSharesListing(
        fractionalOwnership.address,
        shareId,
        shareAmount,
        shareListingPrice
      );
      const receiptListing = await txListing.wait();
      const eventListing = receiptListing.events.find(e => e.event === 'ListingCreated');
      listingId = eventListing.args.listingId.toNumber();
      
      // 구매 전 잔액 및 토큰 보유량 기록
      const sellerBalanceBefore = await ethers.provider.getBalance(buyer.address); // buyer가 이제 판매자
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
      const sellerSharesBefore = await fractionalOwnership.balanceOf(buyer.address, shareId);
      const buyerSharesBefore = await fractionalOwnership.balanceOf(seller.address, shareId); // seller가 이제 구매자
      
      // 절반의 지분만 구매
      const buyAmount = shareAmount / 2;
      const totalPrice = shareListingPrice.mul(buyAmount);
      
      // 지분 구매
      const txBuy = await propertyMarketplace.connect(seller).buyShares(listingId, buyAmount, {
        value: totalPrice
      });
      const receiptBuy = await txBuy.wait();
      
      // 이벤트 확인
      const eventBuy = receiptBuy.events.find(e => e.event === 'ListingSold');
      expect(eventBuy.args.buyer).to.equal(seller.address);
      expect(eventBuy.args.seller).to.equal(buyer.address);
      expect(eventBuy.args.amount).to.equal(buyAmount);
      
      // 지분 이전 확인
      const sellerSharesAfter = await fractionalOwnership.balanceOf(buyer.address, shareId);
      const buyerSharesAfter = await fractionalOwnership.balanceOf(seller.address, shareId);
      
      expect(sellerSharesAfter).to.equal(sellerSharesBefore.sub(buyAmount));
      expect(buyerSharesAfter).to.equal(buyerSharesBefore.add(buyAmount));
      
      // 수수료 및 판매금 지불 확인
      const feePercentage = await propertyMarketplace.feePercentage();
      const fee = totalPrice.mul(feePercentage).div(10000);
      const sellerAmount = totalPrice.sub(fee);
      
      const sellerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
      
      // 수수료 수령자 잔액 확인
      expect(feeRecipientBalanceAfter.sub(feeRecipientBalanceBefore)).to.equal(fee);
      
      // 리스팅 상태 확인 (절반만 판매했으므로 여전히 활성화)
      const listing = await propertyMarketplace.listings(listingId);
      expect(listing.isActive).to.equal(true);
      expect(listing.amount).to.equal(shareAmount - buyAmount);
      
      // 나머지 지분도 구매
      const remainingAmount = shareAmount - buyAmount;
      const remainingPrice = shareListingPrice.mul(remainingAmount);
      
      await propertyMarketplace.connect(seller).buyShares(listingId, remainingAmount, {
        value: remainingPrice
      });
      
      // 모든 지분 판매 후 리스팅은 비활성화되어야 함
      const listingAfter = await propertyMarketplace.listings(listingId);
      expect(listingAfter.isActive).to.equal(false);
      expect(listingAfter.amount).to.equal(0);
    });
  });

  describe("관리자 기능", function () {
    it("관리자가 수수료 비율을 변경할 수 있어야 함", async function () {
      const initialFeePercentage = await propertyMarketplace.feePercentage();
      const newFeePercentage = 500; // 5%
      
      // 수수료 비율 변경
      const tx = await propertyMarketplace.connect(owner).setFeePercentage(newFeePercentage);
      const receipt = await tx.wait();
      
      // 이벤트 확인
      const event = receipt.events.find(e => e.event === 'FeePercentageUpdated');
      expect(event.args.oldFeePercentage).to.equal(initialFeePercentage);
      expect(event.args.newFeePercentage).to.equal(newFeePercentage);
      
      // 변경된 수수료 비율 확인
      expect(await propertyMarketplace.feePercentage()).to.equal(newFeePercentage);
    });

    it("관리자가 수수료 수령 주소를 변경할 수 있어야 함", async function () {
      const initialFeeRecipient = await propertyMarketplace.feeRecipient();
      const newFeeRecipient = owner.address;
      
      // 수수료 수령 주소 변경
      const tx = await propertyMarketplace.connect(owner).setFeeRecipient(newFeeRecipient);
      const receipt = await tx.wait();
      
      // 이벤트 확인
      const event = receipt.events.find(e => e.event === 'FeeRecipientUpdated');
      expect(event.args.oldFeeRecipient).to.equal(initialFeeRecipient);
      expect(event.args.newFeeRecipient).to.equal(newFeeRecipient);
      
      // 변경된 수수료 수령 주소 확인
      expect(await propertyMarketplace.feeRecipient()).to.equal(newFeeRecipient);
    });

    it("관리자 아닌 사용자는 수수료 비율을 변경할 수 없어야 함", async function () {
      await expect(
        propertyMarketplace.connect(buyer).setFeePercentage(500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("관리자 아닌 사용자는 수수료 수령 주소를 변경할 수 없어야 함", async function () {
      await expect(
        propertyMarketplace.connect(buyer).setFeeRecipient(buyer.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 