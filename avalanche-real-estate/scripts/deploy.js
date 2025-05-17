const hre = require("hardhat");

async function main() {
  console.log("배포를 시작합니다...");

  // 배포 계정 정보 가져오기
  const [deployer] = await hre.ethers.getSigners();
  console.log("배포 계정:", deployer.address);
  
  console.log("계정 잔액:", (await deployer.getBalance()).toString());

  // RealEstateNFT 컨트랙트 배포
  const RealEstateNFT = await hre.ethers.getContractFactory("RealEstateNFT");
  const realEstateNFT = await RealEstateNFT.deploy();
  await realEstateNFT.deployed();
  console.log("RealEstateNFT 배포 주소:", realEstateNFT.address);

  // FractionalOwnership 컨트랙트 배포
  const FractionalOwnership = await hre.ethers.getContractFactory("FractionalOwnership");
  const fractionalOwnership = await FractionalOwnership.deploy(realEstateNFT.address);
  await fractionalOwnership.deployed();
  console.log("FractionalOwnership 배포 주소:", fractionalOwnership.address);

  console.log("배포가 완료되었습니다!");

  // 배포 정보 출력 (나중에 프론트엔드에서 사용)
  console.log("============ 배포 정보 ============");
  console.log(`{
    "RealEstateNFT": "${realEstateNFT.address}",
    "FractionalOwnership": "${fractionalOwnership.address}"
  }`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 