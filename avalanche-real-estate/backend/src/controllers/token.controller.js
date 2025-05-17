const Share = require('../models/share.model');
const Property = require('../models/property.model');
const Transaction = require('../models/transaction.model');
const { getShareInfo } = require('../utils/web3.utils');

// 모든 토큰화된 부동산 조회
exports.getAllTokens = async (req, res) => {
  try {
    const shares = await Share.find({ active: true })
      .populate('property')
      .sort({ createdAt: -1 });

    res.status(200).json(shares);
  } catch (error) {
    console.error('토큰 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 특정 토큰 (지분) 조회
exports.getTokenById = async (req, res) => {
  try {
    const { id } = req.params;
    const share = await Share.findOne({ shareId: id }).populate('property');

    if (!share) {
      return res.status(404).json({ error: '해당 토큰을 찾을 수 없습니다' });
    }

    // 블록체인에서 최신 정보 조회
    const chainInfo = await getShareInfo(id);
    if (chainInfo.success) {
      // 가용 지분 수 업데이트
      if (share.availableShares !== chainInfo.data.availableShares) {
        share.availableShares = chainInfo.data.availableShares;
        await share.save();
      }
    }

    res.status(200).json(share);
  } catch (error) {
    console.error('토큰 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 사용자별 토큰 조회
exports.getUserTokens = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;

    if (!walletAddress) {
      return res.status(400).json({ error: '연결된 지갑 주소가 없습니다' });
    }

    // 사용자가 소유한 부동산 조회
    const ownedProperties = await Property.find({ ownerAddress: walletAddress });

    // 사용자가 토큰화한 부동산 지분 조회
    const tokenizedProperties = await Share.find({
      tokenizer: walletAddress,
    }).populate('property');

    // 사용자의 구매 트랜잭션 조회
    const purchases = await Transaction.find({
      buyer: walletAddress,
      status: '완료',
    }).populate('property');

    // 사용자의 판매 트랜잭션 조회
    const sales = await Transaction.find({
      seller: walletAddress,
      status: '완료',
    }).populate('property');

    res.status(200).json({
      ownedProperties,
      tokenizedProperties,
      purchases,
      sales,
    });
  } catch (error) {
    console.error('사용자 토큰 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 토큰 분할 (현재는 클라이언트에서 직접 처리되므로 백엔드에서는 불필요)
exports.fractionalizeToken = async (req, res) => {
  res.status(501).json({ error: '이 기능은 클라이언트에서 직접 처리됩니다' });
};

// 토큰 지분 구매 (클라이언트에서 구매 완료 후 호출)
exports.buyTokenShare = async (req, res) => {
  try {
    const { shareId, buyer, amount, totalPrice } = req.body;

    // 지분 정보 조회
    const share = await Share.findOne({ shareId });
    if (!share) {
      return res.status(404).json({ error: '해당 지분을 찾을 수 없습니다' });
    }

    // 블록체인에서 최신 정보 조회하여 가용 지분 확인
    const chainInfo = await getShareInfo(shareId);
    if (!chainInfo.success) {
      return res.status(400).json({ error: '블록체인에서 지분 정보를 조회할 수 없습니다' });
    }

    // 가용 지분 업데이트
    share.availableShares = chainInfo.data.availableShares;
    await share.save();

    // 거래 내역 기록
    const transaction = new Transaction({
      shareId,
      property: share.property,
      buyer,
      seller: share.tokenizer,
      amount,
      totalPrice,
      transactionType: '구매',
      transactionHash: req.body.transactionHash || 'unknown',
      status: '완료',
    });

    await transaction.save();

    res.status(200).json({
      message: '지분 구매가 성공적으로 기록되었습니다',
      transaction,
      share,
    });
  } catch (error) {
    console.error('지분 구매 기록 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 토큰 지분 판매 (클라이언트에서 판매 등록 완료 후 호출)
exports.sellTokenShare = async (req, res) => {
  try {
    const { shareId, seller, amount, price, transactionHash } = req.body;

    // 지분 정보 조회
    const share = await Share.findOne({ shareId });
    if (!share) {
      return res.status(404).json({ error: '해당 지분을 찾을 수 없습니다' });
    }

    // 판매 등록 정보 기록
    const listing = {
      shareId,
      property: share.property,
      seller,
      amount,
      price,
      transactionHash,
      listedAt: new Date(),
    };

    res.status(200).json({
      message: '지분 판매 등록이 성공적으로 기록되었습니다',
      listing,
    });
  } catch (error) {
    console.error('지분 판매 등록 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 토큰 거래 내역 조회
exports.getTokenTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await Transaction.find({ shareId: id })
      .sort({ createdAt: -1 })
      .populate('property');

    res.status(200).json(transactions);
  } catch (error) {
    console.error('토큰 거래 내역 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 