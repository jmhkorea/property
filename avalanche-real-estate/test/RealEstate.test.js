const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("부동산 토큰화 플랫폼", function () {
  let RealEstateNFT;
  let FractionalOwnership;
  let realEstateNFT;
  let fractionalOwnership;
  let owner;
  let tokenizer;
  let user1;
  let user2;
  let propertyId;
  let shareId;

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

  beforeEach(async function () {
    // 계정 설정
    [owner, tokenizer, user1, user2] = await ethers.getSigners();

    // 컨트랙트 배포
    RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
    realEstateNFT = await RealEstateNFT.deploy();
    await realEstateNFT.deployed();

    FractionalOwnership = await ethers.getContractFactory("FractionalOwnership");
    fractionalOwnership = await FractionalOwnership.deploy(realEstateNFT.address);
    await fractionalOwnership.deployed();

    // 토큰화 권한 부여
    await realEstateNFT.addTokenizer(tokenizer.address);
    await realEstateNFT.addTokenizer(fractionalOwnership.address);
  });

  describe("부동산 NFT 기능", function () {
    it("부동산 NFT를 발행할 수 있어야 함", async function () {
      // tokenizer로 NFT 발행
      await expect(
        realEstateNFT.connect(tokenizer).mintProperty(
          user1.address,
          propertyAddress,
          squareMeters,
          propertyType,
          appraisedValue,
          ipfsDocumentURI,
          latitude,
          longitude
        )
      )
        .to.emit(realEstateNFT, "PropertyMinted")
        .withArgs(1, user1.address, propertyAddress);

      // 발행된 NFT의 소유자 확인
      expect(await realEstateNFT.ownerOf(1)).to.equal(user1.address);

      // 부동산 정보 조회
      const propertyInfo = await realEstateNFT.getPropertyInfo(1);
      expect(propertyInfo.propertyAddress).to.equal(propertyAddress);
      expect(propertyInfo.squareMeters).to.equal(squareMeters);
      expect(propertyInfo.propertyType).to.equal(propertyType);
      expect(propertyInfo.appraisedValue).to.equal(appraisedValue);
      expect(propertyInfo.ipfsDocumentURI).to.equal(ipfsDocumentURI);
      expect(propertyInfo.latitude).to.equal(latitude);
      expect(propertyInfo.longitude).to.equal(longitude);
      expect(propertyInfo.owner).to.equal(user1.address);
      expect(propertyInfo.isTokenized).to.equal(false);

      // 다음 테스트를 위해 propertyId 저장
      propertyId = 1;
    });

    it("부동산 정보를 업데이트할 수 있어야 함", async function () {
      // 먼저 NFT 발행
      await realEstateNFT.connect(tokenizer).mintProperty(
        user1.address,
        propertyAddress,
        squareMeters,
        propertyType,
        appraisedValue,
        ipfsDocumentURI,
        latitude,
        longitude
      );

      // 부동산 정보 업데이트
      const newSquareMeters = 150;
      const newPropertyType = "오피스텔";
      const newAppraisedValue = ethers.utils.parseEther("600");
      const newIpfsDocumentURI = "ipfs://QmNewDocumentUri";

      await expect(
        realEstateNFT.connect(user1).updatePropertyInfo(
          1,
          newSquareMeters,
          newPropertyType,
          newAppraisedValue,
          newIpfsDocumentURI
        )
      )
        .to.emit(realEstateNFT, "PropertyInfoUpdated")
        .withArgs(1, newSquareMeters, newAppraisedValue);

      // 업데이트된 정보 확인
      const propertyInfo = await realEstateNFT.getPropertyInfo(1);
      expect(propertyInfo.squareMeters).to.equal(newSquareMeters);
      expect(propertyInfo.propertyType).to.equal(newPropertyType);
      expect(propertyInfo.appraisedValue).to.equal(newAppraisedValue);
      expect(propertyInfo.ipfsDocumentURI).to.equal(newIpfsDocumentURI);
    });
  });

  describe("분할 소유권 기능", function () {
    beforeEach(async function () {
      // NFT 발행
      await realEstateNFT.connect(tokenizer).mintProperty(
        user1.address,
        propertyAddress,
        squareMeters,
        propertyType,
        appraisedValue,
        ipfsDocumentURI,
        latitude,
        longitude
      );
      propertyId = 1;
    });

    it("부동산을 토큰화하여 분할 소유권을 생성할 수 있어야 함", async function () {
      // 토큰화 전 승인
      await realEstateNFT.connect(user1).approve(fractionalOwnership.address, propertyId);

      // 부동산 토큰화
      await expect(
        fractionalOwnership.connect(user1).tokenizeProperty(
          propertyId,
          totalShares,
          pricePerShare
        )
      )
        .to.emit(fractionalOwnership, "PropertyTokenized");

      // 발행된 지분 ID (첫 번째 지분이므로 1)
      shareId = 1;

      // 지분 정보 확인
      const shareInfo = await fractionalOwnership.getShareInfo(shareId);
      expect(shareInfo.propertyId).to.equal(propertyId);
      expect(shareInfo.totalShares).to.equal(totalShares);
      expect(shareInfo.availableShares).to.equal(totalShares);
      expect(shareInfo.pricePerShare).to.equal(pricePerShare);
      expect(shareInfo.propertyAddress).to.equal(propertyAddress);
      expect(shareInfo.tokenizer).to.equal(user1.address);
      expect(shareInfo.active).to.equal(true);

      // 부동산이 토큰화 상태로 변경되었는지 확인
      const propertyInfo = await realEstateNFT.getPropertyInfo(propertyId);
      expect(propertyInfo.isTokenized).to.equal(true);

      // 토큰화 요청자가 모든 지분을 가지고 있는지 확인
      expect(await fractionalOwnership.balanceOf(user1.address, shareId)).to.equal(totalShares);
    });

    it("지분을 구매할 수 있어야 함", async function () {
      // 토큰화
      await realEstateNFT.connect(user1).approve(fractionalOwnership.address, propertyId);
      await fractionalOwnership.connect(user1).tokenizeProperty(
        propertyId,
        totalShares,
        pricePerShare
      );
      shareId = 1;

      // 구매할 지분 수
      const sharesToBuy = 10;
      const totalPrice = pricePerShare.mul(sharesToBuy);

      // 지분 구매
      await expect(
        fractionalOwnership.connect(user2).buyShares(shareId, sharesToBuy, {
          value: totalPrice
        })
      )
        .to.emit(fractionalOwnership, "SharesPurchased")
        .withArgs(shareId, user2.address, sharesToBuy, totalPrice);

      // 구매자의 지분 확인
      expect(await fractionalOwnership.balanceOf(user2.address, shareId)).to.equal(sharesToBuy);

      // 가용 지분 수 감소 확인
      const shareInfo = await fractionalOwnership.getShareInfo(shareId);
      expect(shareInfo.availableShares).to.equal(totalShares - sharesToBuy);
    });

    it("지분을 판매 등록하고 구매할 수 있어야 함", async function () {
      // 토큰화
      await realEstateNFT.connect(user1).approve(fractionalOwnership.address, propertyId);
      await fractionalOwnership.connect(user1).tokenizeProperty(
        propertyId,
        totalShares,
        pricePerShare
      );
      shareId = 1;

      // 먼저 user2가 지분 구매
      const sharesToBuy = 20;
      const totalPrice = pricePerShare.mul(sharesToBuy);
      await fractionalOwnership.connect(user2).buyShares(shareId, sharesToBuy, {
        value: totalPrice
      });

      // user2가 지분 판매 등록
      const sharesToList = 10;
      const listPrice = ethers.utils.parseEther("6"); // 6 AVAX (더 비싸게 팔기)
      await expect(
        fractionalOwnership.connect(user2).listShares(shareId, sharesToList, listPrice)
      )
        .to.emit(fractionalOwnership, "SharesListed")
        .withArgs(shareId, user2.address, sharesToList, listPrice);

      // 판매 정보 확인
      const [amount, price, isListed] = await fractionalOwnership.getListedShareInfo(shareId, user2.address);
      expect(amount).to.equal(sharesToList);
      expect(price).to.equal(listPrice);
      expect(isListed).to.equal(true);

      // user1이 등록된 지분 구매
      const sharesToBuyListed = 5;
      const listedTotalPrice = listPrice.mul(sharesToBuyListed);
      await expect(
        fractionalOwnership.connect(user1).buyListedShares(shareId, user2.address, sharesToBuyListed, {
          value: listedTotalPrice
        })
      )
        .to.emit(fractionalOwnership, "ListedSharesPurchased")
        .withArgs(shareId, user1.address, user2.address, sharesToBuyListed, listedTotalPrice);

      // 구매 후 잔여 판매 수량 확인
      const [newAmount, , newIsListed] = await fractionalOwnership.getListedShareInfo(shareId, user2.address);
      expect(newAmount).to.equal(sharesToList - sharesToBuyListed);
      expect(newIsListed).to.equal(true);

      // 각 사용자의 지분 확인
      expect(await fractionalOwnership.balanceOf(user1.address, shareId)).to.equal(totalShares - sharesToBuy + sharesToBuyListed);
      expect(await fractionalOwnership.balanceOf(user2.address, shareId)).to.equal(sharesToBuy - sharesToBuyListed);
    });
  });
}); 