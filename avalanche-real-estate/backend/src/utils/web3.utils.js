const { ethers } = require('ethers');
const RealEstateNFTABI = require('../../contracts/RealEstateNFT.json');
const FractionalOwnershipABI = require('../../contracts/FractionalOwnership.json');

// 환경 변수에서 컨트랙트 주소 가져오기
const REAL_ESTATE_NFT_ADDRESS = process.env.REAL_ESTATE_NFT_ADDRESS;
const FRACTIONAL_OWNERSHIP_ADDRESS = process.env.FRACTIONAL_OWNERSHIP_ADDRESS;
const RPC_URL = process.env.AVALANCHE_RPC_URL;

// 이더스 제공자 설정
const getProvider = () => {
  return new ethers.providers.JsonRpcProvider(RPC_URL);
};

// 개인키로 사인된 이더스 제공자 설정
const getSigner = (privateKey) => {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
};

// 부동산 NFT 컨트랙트 인스턴스 가져오기
const getRealEstateNFTContract = (signerOrProvider) => {
  return new ethers.Contract(
    REAL_ESTATE_NFT_ADDRESS,
    RealEstateNFTABI.abi,
    signerOrProvider || getProvider()
  );
};

// 분할 소유권 컨트랙트 인스턴스 가져오기
const getFractionalOwnershipContract = (signerOrProvider) => {
  return new ethers.Contract(
    FRACTIONAL_OWNERSHIP_ADDRESS,
    FractionalOwnershipABI.abi,
    signerOrProvider || getProvider()
  );
};

// 부동산 NFT 등록
const mintProperty = async (
  ownerAddress,
  propertyAddress,
  squareMeters,
  propertyType,
  appraisedValue,
  ipfsDocumentURI,
  latitude,
  longitude,
  privateKey
) => {
  try {
    const signer = getSigner(privateKey);
    const contract = getRealEstateNFTContract(signer);

    // 트랜잭션 전송
    const tx = await contract.mintProperty(
      ownerAddress,
      propertyAddress,
      squareMeters,
      propertyType,
      appraisedValue,
      ipfsDocumentURI,
      latitude,
      longitude
    );

    // 트랜잭션 확인 대기
    const receipt = await tx.wait();

    // 이벤트에서 tokenId 추출
    const event = receipt.events.find((e) => e.event === 'PropertyMinted');
    const tokenId = event.args.tokenId.toNumber();

    return {
      success: true,
      tokenId,
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error('부동산 NFT 발행 오류:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 부동산 토큰화
const tokenizeProperty = async (propertyId, totalShares, pricePerShare, privateKey) => {
  try {
    const signer = getSigner(privateKey);
    const contract = getFractionalOwnershipContract(signer);

    // 트랜잭션 전송
    const tx = await contract.tokenizeProperty(propertyId, totalShares, pricePerShare);

    // 트랜잭션 확인 대기
    const receipt = await tx.wait();

    // 이벤트에서 shareId 추출
    const event = receipt.events.find((e) => e.event === 'PropertyTokenized');
    const shareId = event.args.shareId.toNumber();

    return {
      success: true,
      shareId,
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error('부동산 토큰화 오류:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 지분 정보 조회
const getShareInfo = async (shareId) => {
  try {
    const contract = getFractionalOwnershipContract();
    const shareInfo = await contract.getShareInfo(shareId);

    return {
      success: true,
      data: {
        propertyId: shareInfo.propertyId.toNumber(),
        totalShares: shareInfo.totalShares.toNumber(),
        availableShares: shareInfo.availableShares.toNumber(),
        pricePerShare: ethers.utils.formatEther(shareInfo.pricePerShare),
        propertyAddress: shareInfo.propertyAddress,
        tokenizer: shareInfo.tokenizer,
        active: shareInfo.active,
      },
    };
  } catch (error) {
    console.error('지분 정보 조회 오류:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 부동산 정보 조회
const getPropertyInfo = async (propertyId) => {
  try {
    const contract = getRealEstateNFTContract();
    const propertyInfo = await contract.getPropertyInfo(propertyId);

    return {
      success: true,
      data: {
        propertyAddress: propertyInfo.propertyAddress,
        squareMeters: propertyInfo.squareMeters.toNumber(),
        propertyType: propertyInfo.propertyType,
        appraisedValue: propertyInfo.appraisedValue.toString(),
        ipfsDocumentURI: propertyInfo.ipfsDocumentURI,
        latitude: propertyInfo.latitude,
        longitude: propertyInfo.longitude,
        owner: propertyInfo.owner,
        isTokenized: propertyInfo.isTokenized,
      },
    };
  } catch (error) {
    console.error('부동산 정보 조회 오류:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  getProvider,
  getSigner,
  getRealEstateNFTContract,
  getFractionalOwnershipContract,
  mintProperty,
  tokenizeProperty,
  getShareInfo,
  getPropertyInfo,
}; 