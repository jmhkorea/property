// 추가된 스마트 컨트랙트 배포 스크립트
const { ethers } = require("hardhat");

async function main() {
  // 배포자 계정 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // 배포자 잔액 확인
  const deployerBalance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(deployerBalance), "AVAX");
  
  // 이미 배포된 컨트랙트 주소 설정
  // 실제 환경에서는 이 값들을 .env 파일이나 다른 구성 파일에서 로드하는 것이 좋습니다.
  const realEstateNFTAddress = process.env.REAL_ESTATE_NFT_ADDRESS;
  const fractionalOwnershipAddress = process.env.FRACTIONAL_OWNERSHIP_ADDRESS;
  
  if (!realEstateNFTAddress || !fractionalOwnershipAddress) {
    console.error("기본 컨트랙트 주소가 설정되지 않았습니다. .env 파일을 확인하세요.");
    return;
  }
  
  console.log("기존 컨트랙트 주소:");
  console.log("- RealEstateNFT:", realEstateNFTAddress);
  console.log("- FractionalOwnership:", fractionalOwnershipAddress);
  
  // Property Marketplace 컨트랙트 배포
  console.log("\n부동산 마켓플레이스 컨트랙트 배포 중...");
  
  // 수수료 수령 주소 (기본적으로 배포자 주소 사용)
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS || deployer.address;
  
  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const propertyMarketplace = await PropertyMarketplace.deploy(feeRecipient);
  await propertyMarketplace.deployed();
  
  console.log("PropertyMarketplace 주소:", propertyMarketplace.address);
  
  // 부동산 거버넌스 토큰 배포
  console.log("\n부동산 거버넌스 토큰 배포 중...");
  
  // 초기 발행량 (10,000,000 PGT)
  const initialSupply = ethers.utils.parseEther("10000000");
  // 금고 주소 (기본적으로 배포자 주소 사용)
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy(initialSupply, treasuryAddress);
  await propertyToken.deployed();
  
  console.log("PropertyToken 주소:", propertyToken.address);
  
  // 타임락 컨트롤러 배포 (DAO 거버넌스를 위한)
  console.log("\n타임락 컨트롤러 배포 중...");
  
  // 타임락 파라미터
  const minDelay = 86400; // 1일 (초 단위)
  const proposers = [deployer.address];
  const executors = [deployer.address];
  
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelockController = await TimelockController.deploy(minDelay, proposers, executors);
  await timelockController.deployed();
  
  console.log("TimelockController 주소:", timelockController.address);
  
  // DAO 거버넌스 컨트랙트 배포
  console.log("\n부동산 DAO 거버넌스 컨트랙트 배포 중...");
  
  const PropertyDAO = await ethers.getContractFactory("PropertyDAO");
  const propertyDAO = await PropertyDAO.deploy(propertyToken.address, timelockController.address);
  await propertyDAO.deployed();
  
  console.log("PropertyDAO 주소:", propertyDAO.address);
  
  // 스테이킹 컨트랙트 배포
  console.log("\n부동산 토큰 스테이킹 컨트랙트 배포 중...");
  
  // 초당 보상 비율 (약 하루 10,000 토큰 분배)
  const rewardPerSecond = ethers.utils.parseEther("0.115");
  
  const PropertyStaking = await ethers.getContractFactory("PropertyStaking");
  const propertyStaking = await PropertyStaking.deploy(
    propertyToken.address, // 스테이킹 토큰
    propertyToken.address, // 보상 토큰 (같은 토큰 사용)
    rewardPerSecond
  );
  await propertyStaking.deployed();
  
  console.log("PropertyStaking 주소:", propertyStaking.address);
  
  // 필요한 권한 설정
  console.log("\n컨트랙트 권한 설정 중...");
  
  // 스테이킹 컨트랙트를 토큰 민터로 추가
  let tx = await propertyToken.addMinter(propertyStaking.address);
  await tx.wait();
  console.log("스테이킹 컨트랙트를 토큰 민터로 추가했습니다.");
  
  // 배포된 모든 컨트랙트 주소 출력
  console.log("\n배포된 모든 컨트랙트 주소:");
  console.log("========================");
  console.log("RealEstateNFT:", realEstateNFTAddress);
  console.log("FractionalOwnership:", fractionalOwnershipAddress);
  console.log("PropertyMarketplace:", propertyMarketplace.address);
  console.log("PropertyToken:", propertyToken.address);
  console.log("TimelockController:", timelockController.address);
  console.log("PropertyDAO:", propertyDAO.address);
  console.log("PropertyStaking:", propertyStaking.address);
}

// 스크립트 실행
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 