const Property = require('../models/property.model');
const Share = require('../models/share.model');
const Transaction = require('../models/transaction.model');
const { mintProperty, getPropertyInfo } = require('../utils/web3.utils');

// 모든 부동산 목록 조회
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.status(200).json(properties);
  } catch (error) {
    console.error('부동산 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 특정 부동산 조회
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ error: '해당 부동산을 찾을 수 없습니다' });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error('부동산 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 부동산 등록
exports.createProperty = async (req, res) => {
  try {
    const {
      propertyAddress,
      propertyType,
      squareMeters,
      appraisedValue,
      latitude,
      longitude,
      description,
      imageUrl,
      ipfsDocumentURI,
      ownerAddress,
    } = req.body;

    const user = req.user;

    // 블록체인에 부동산 NFT 발행
    const result = await mintProperty(
      ownerAddress,
      propertyAddress,
      squareMeters,
      propertyType,
      appraisedValue,
      ipfsDocumentURI,
      latitude,
      longitude,
      process.env.ADMIN_PRIVATE_KEY // 서버의 관리자 키로 트랜잭션 서명
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // 데이터베이스에 부동산 정보 저장
    const property = new Property({
      propertyAddress,
      propertyType,
      squareMeters,
      appraisedValue,
      latitude,
      longitude,
      description,
      imageUrl,
      ipfsDocumentURI,
      ownerAddress,
      createdBy: user._id,
      tokenId: result.tokenId,
      blockchainStatus: '등록완료',
      transactionHash: result.transactionHash,
    });

    await property.save();

    res.status(201).json({
      message: '부동산이 성공적으로 등록되었습니다',
      property,
    });
  } catch (error) {
    console.error('부동산 등록 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 부동산 정보 수정
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      imageUrl,
      ipfsDocumentURI,
    } = req.body;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ error: '해당 부동산을 찾을 수 없습니다' });
    }

    // 소유자 또는 관리자만 수정 가능
    if (property.ownerAddress !== req.user.walletAddress && req.user.role !== 'admin') {
      return res.status(403).json({ error: '부동산 정보를 수정할 권한이 없습니다' });
    }

    // 이미 토큰화된 경우 일부 정보만 수정 가능
    if (property.isTokenized) {
      if (description) property.description = description;
      if (imageUrl) property.imageUrl = imageUrl;
    } else {
      // 토큰화되지 않은 경우 더 많은 정보 수정 가능
      if (description) property.description = description;
      if (imageUrl) property.imageUrl = imageUrl;
      if (ipfsDocumentURI) property.ipfsDocumentURI = ipfsDocumentURI;
    }

    await property.save();

    res.status(200).json({
      message: '부동산 정보가 성공적으로 업데이트되었습니다',
      property,
    });
  } catch (error) {
    console.error('부동산 업데이트 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 부동산 삭제
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ error: '해당 부동산을 찾을 수 없습니다' });
    }

    // 소유자 또는 관리자만 삭제 가능
    if (property.ownerAddress !== req.user.walletAddress && req.user.role !== 'admin') {
      return res.status(403).json({ error: '부동산을 삭제할 권한이 없습니다' });
    }

    // 이미 토큰화된 부동산은 삭제 불가
    if (property.isTokenized) {
      return res.status(400).json({ error: '토큰화된 부동산은 삭제할 수 없습니다' });
    }

    await Property.deleteOne({ _id: id });

    res.status(200).json({ message: '부동산이 성공적으로 삭제되었습니다' });
  } catch (error) {
    console.error('부동산 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 부동산 토큰화 요청 (클라이언트에서 토큰화 완료 후 호출)
exports.tokenizeProperty = async (req, res) => {
  try {
    const { propertyId, shareId, totalShares, pricePerShare, ownerAddress } = req.body;

    // 부동산 정보 조회
    const property = await Property.findOne({ tokenId: propertyId });

    if (!property) {
      return res.status(404).json({ error: '해당 부동산을 찾을 수 없습니다' });
    }

    // 소유자 확인
    if (property.ownerAddress !== ownerAddress) {
      return res.status(403).json({ error: '부동산을 토큰화할 권한이 없습니다' });
    }

    // 블록체인에서 부동산 정보 조회하여 토큰화 상태 확인
    const chainInfo = await getPropertyInfo(propertyId);
    if (!chainInfo.success) {
      return res.status(400).json({ error: '블록체인에서 부동산 정보를 조회할 수 없습니다' });
    }

    if (!chainInfo.data.isTokenized) {
      return res.status(400).json({ error: '블록체인에서 토큰화가 확인되지 않았습니다' });
    }

    // 부동산 토큰화 상태 업데이트
    property.isTokenized = true;
    property.shareId = shareId;
    property.blockchainStatus = '토큰화완료';
    await property.save();

    // 지분 정보 저장
    const share = new Share({
      shareId,
      propertyId,
      property: property._id,
      totalShares,
      availableShares: totalShares,
      pricePerShare,
      tokenizer: ownerAddress,
      active: true,
    });

    await share.save();

    res.status(200).json({
      message: '부동산이 성공적으로 토큰화되었습니다',
      property,
      share,
    });
  } catch (error) {
    console.error('부동산 토큰화 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 