const Share = require('../models/share.model');
const Property = require('../models/property.model');
const Transaction = require('../models/transaction.model');
const { getShareInfo } = require('../utils/web3.utils');

// 모든 지분 목록 조회
exports.getAllShares = async (req, res) => {
  try {
    const shares = await Share.find({ active: true })
      .populate('property')
      .sort({ createdAt: -1 });

    res.status(200).json(shares);
  } catch (error) {
    console.error('지분 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 특정 지분 조회
exports.getShareById = async (req, res) => {
  try {
    const { id } = req.params;
    const share = await Share.findOne({ shareId: id }).populate('property');

    if (!share) {
      return res.status(404).json({ error: '해당 지분을 찾을 수 없습니다' });
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
    console.error('지분 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 지분 구매 (클라이언트에서 트랜잭션 완료 후 호출)
exports.purchaseShare = async (req, res) => {
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

// 사용자 보유 지분 조회
exports.getUserShares = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;

    if (!walletAddress) {
      return res.status(400).json({ error: '연결된 지갑 주소가 없습니다' });
    }

    // 사용자가 토큰화한 부동산 지분 조회
    const tokenizedShares = await Share.find({
      tokenizer: walletAddress,
    }).populate('property');

    // 사용자의 구매 트랜잭션 조회 (지분별 구매량 집계)
    const purchases = await Transaction.find({
      buyer: walletAddress,
      status: '완료',
      transactionType: '구매',
    }).populate('property');

    // 지분별 보유량 계산
    const shareHoldings = {};
    purchases.forEach((transaction) => {
      if (!shareHoldings[transaction.shareId]) {
        shareHoldings[transaction.shareId] = {
          shareId: transaction.shareId,
          property: transaction.property,
          totalPurchased: 0,
          totalValue: 0,
        };
      }
      shareHoldings[transaction.shareId].totalPurchased += transaction.amount;
      shareHoldings[transaction.shareId].totalValue += parseFloat(transaction.totalPrice);
    });

    res.status(200).json({
      tokenizedShares,
      purchases,
      shareHoldings: Object.values(shareHoldings),
    });
  } catch (error) {
    console.error('사용자 지분 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 특정 부동산의 지분 목록 조회
exports.getSharesByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // 부동산 ID로 Property 문서 조회
    const property = await Property.findOne({ tokenId: propertyId });
    
    if (!property) {
      return res.status(404).json({ error: '해당 부동산을 찾을 수 없습니다' });
    }
    
    // 해당 부동산의 지분 조회
    const shares = await Share.find({ propertyId }).populate('property');
    
    res.status(200).json(shares);
  } catch (error) {
    console.error('부동산 지분 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 