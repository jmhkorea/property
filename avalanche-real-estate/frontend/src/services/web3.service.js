import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import PropertyNFT from '../contracts/PropertyNFT.json';
import PropertyShares from '../contracts/PropertyShares.json';

/**
 * Web3Modal 설정
 */
const providerOptions = {
  // 추가 공급자 옵션은 여기에 추가
};

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions,
});

// 컨트랙트 주소
const PROPERTY_NFT_ADDRESS = process.env.REACT_APP_PROPERTY_NFT_ADDRESS;
const PROPERTY_SHARES_ADDRESS = process.env.REACT_APP_PROPERTY_SHARES_ADDRESS;

/**
 * 지갑에 연결
 * @returns {Promise<Object>} provider, signer, account 정보
 */
const connectWallet = async () => {
  try {
    const provider = await web3Modal.connect();
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const account = await signer.getAddress();
    
    return { provider: ethersProvider, signer, account };
  } catch (error) {
    console.error('지갑 연결 오류:', error);
    throw new Error('지갑 연결에 실패했습니다');
  }
};

/**
 * 연결 해제
 */
const disconnectWallet = async () => {
  try {
    await web3Modal.clearCachedProvider();
  } catch (error) {
    console.error('연결 해제 오류:', error);
  }
};

/**
 * 현재 네트워크가 아발란체 퓨지 테스트넷인지 확인
 * @param {Object} provider - ethers provider
 * @returns {Promise<boolean>} 아발란체 네트워크 여부
 */
const checkAvalancheNetwork = async (provider) => {
  try {
    const network = await provider.getNetwork();
    // Avalanche Fuji Testnet의 chainId: 43113
    return network.chainId === 43113;
  } catch (error) {
    console.error('네트워크 확인 오류:', error);
    return false;
  }
};

/**
 * 아발란체 퓨지 테스트넷으로 네트워크 전환 요청
 * @param {Object} provider - web3 provider
 * @returns {Promise<boolean>} 전환 성공 여부
 */
const switchToAvalancheNetwork = async (provider) => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xA869' }], // 43113 in hex
    });
    return true;
  } catch (error) {
    // 체인이 지갑에 추가되지 않은 경우
    if (error.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xA869',
              chainName: 'Avalanche Fuji Testnet',
              nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18,
              },
              rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
              blockExplorerUrls: ['https://testnet.snowtrace.io'],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('네트워크 추가 오류:', addError);
        return false;
      }
    } else {
      console.error('네트워크 전환 오류:', error);
      return false;
    }
  }
};

/**
 * PropertyNFT 컨트랙트 인스턴스 가져오기
 * @param {Object} signerOrProvider - ethers signer 또는 provider
 * @returns {Object} 컨트랙트 인스턴스
 */
const getPropertyNFTContract = (signerOrProvider) => {
  return new ethers.Contract(
    PROPERTY_NFT_ADDRESS,
    PropertyNFT.abi,
    signerOrProvider
  );
};

/**
 * PropertyShares 컨트랙트 인스턴스 가져오기
 * @param {Object} signerOrProvider - ethers signer 또는 provider
 * @returns {Object} 컨트랙트 인스턴스
 */
const getPropertySharesContract = (signerOrProvider) => {
  return new ethers.Contract(
    PROPERTY_SHARES_ADDRESS,
    PropertyShares.abi,
    signerOrProvider
  );
};

/**
 * 부동산 NFT 발행
 * @param {Object} signer - ethers signer
 * @param {Object} propertyData - 부동산 데이터
 * @returns {Promise<Object>} 트랜잭션 결과
 */
const mintPropertyNFT = async (signer, propertyData) => {
  try {
    const contract = getPropertyNFTContract(signer);
    
    const tx = await contract.mint(
      propertyData.owner,
      propertyData.propertyAddress,
      propertyData.squareMeters,
      propertyData.propertyType,
      ethers.utils.parseEther(propertyData.appraisedValue),
      propertyData.ipfsDocumentURI,
      propertyData.latitude,
      propertyData.longitude
    );
    
    const receipt = await tx.wait();
    
    // 이벤트에서 tokenId 추출
    const event = receipt.events.find(event => event.event === 'PropertyMinted');
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

/**
 * 부동산 토큰화 (지분 생성)
 * @param {Object} signer - ethers signer
 * @param {number} propertyId - 부동산 NFT ID
 * @param {number} totalShares - 총 지분 수
 * @param {string} pricePerShare - 지분당 가격 (AVAX)
 * @returns {Promise<Object>} 트랜잭션 결과
 */
const tokenizeProperty = async (signer, propertyId, totalShares, pricePerShare) => {
  try {
    const nftContract = getPropertyNFTContract(signer);
    const sharesContract = getPropertySharesContract(signer);
    
    // NFT 컨트랙트에 토큰화 승인
    const approveTx = await nftContract.approve(PROPERTY_SHARES_ADDRESS, propertyId);
    await approveTx.wait();
    
    // 지분 생성
    const tx = await sharesContract.createPropertyShares(
      propertyId,
      totalShares,
      ethers.utils.parseEther(pricePerShare)
    );
    
    const receipt = await tx.wait();
    
    // 이벤트에서 shareId 추출
    const event = receipt.events.find(event => event.event === 'PropertySharesCreated');
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

/**
 * 지분 구매
 * @param {Object} signer - ethers signer
 * @param {number} shareId - 지분 ID
 * @param {number} amount - 구매할 지분 수량
 * @returns {Promise<Object>} 트랜잭션 결과
 */
const buyShares = async (signer, shareId, amount) => {
  try {
    const contract = getPropertySharesContract(signer);
    
    // 지분 정보 조회
    const shareInfo = await contract.getShareInfo(shareId);
    const pricePerShare = shareInfo.pricePerShare;
    
    // 총 가격 계산
    const totalPrice = pricePerShare.mul(amount);
    
    // 지분 구매
    const tx = await contract.buyShares(shareId, amount, {
      value: totalPrice,
    });
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      totalPrice: totalPrice.toString(),
    };
  } catch (error) {
    console.error('지분 구매 오류:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 사용자의 특정 지분 보유량 조회
 * @param {Object} provider - ethers provider
 * @param {string} address - 사용자 주소
 * @param {number} shareId - 지분 ID
 * @returns {Promise<number>} 보유량
 */
const getShareBalance = async (provider, address, shareId) => {
  try {
    const contract = getPropertySharesContract(provider);
    const balance = await contract.balanceOf(address, shareId);
    return balance.toNumber();
  } catch (error) {
    console.error('지분 보유량 조회 오류:', error);
    throw error;
  }
};

/**
 * 부동산 정보 조회
 * @param {Object} provider - ethers provider
 * @param {number} propertyId - 부동산 NFT ID
 * @returns {Promise<Object>} 부동산 정보
 */
const getPropertyInfo = async (provider, propertyId) => {
  try {
    const contract = getPropertyNFTContract(provider);
    const property = await contract.getPropertyInfo(propertyId);
    
    return {
      success: true,
      data: {
        owner: property.owner,
        propertyAddress: property.propertyAddress,
        squareMeters: property.squareMeters.toNumber(),
        propertyType: property.propertyType,
        appraisedValue: property.appraisedValue.toString(),
        ipfsDocumentURI: property.ipfsDocumentURI,
        latitude: property.latitude,
        longitude: property.longitude,
        isTokenized: property.isTokenized,
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

/**
 * 지분 정보 조회
 * @param {Object} provider - ethers provider
 * @param {number} shareId - 지분 ID
 * @returns {Promise<Object>} 지분 정보
 */
const getShareInfo = async (provider, shareId) => {
  try {
    const contract = getPropertySharesContract(provider);
    const share = await contract.getShareInfo(shareId);
    
    return {
      success: true,
      data: {
        propertyId: share.propertyId.toNumber(),
        totalShares: share.totalShares.toNumber(),
        availableShares: share.availableShares.toNumber(),
        pricePerShare: share.pricePerShare.toString(),
        tokenizer: share.tokenizer,
        active: share.active,
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

// Web3 서비스 내보내기
const web3Service = {
  connectWallet,
  disconnectWallet,
  checkAvalancheNetwork,
  switchToAvalancheNetwork,
  getPropertyNFTContract,
  getPropertySharesContract,
  mintPropertyNFT,
  tokenizeProperty,
  buyShares,
  getShareBalance,
  getPropertyInfo,
  getShareInfo,
};

export default web3Service; 