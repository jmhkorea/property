const Property = require('../models/property.model');
const Share = require('../models/share.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');

// 전체 플랫폼 통계 조회
exports.getPlatformStats = async (req, res) => {
  try {
    // 총 등록된 부동산 수
    const totalProperties = await Property.countDocuments();
    
    // 토큰화된 부동산 수
    const tokenizedProperties = await Property.countDocuments({ isTokenized: true });
    
    // 총 거래량 (거래 수)
    const totalTransactions = await Transaction.countDocuments({ status: '완료' });
    
    // 총 거래 금액
    const transactions = await Transaction.find({ status: '완료' });
    let totalVolume = '0';
    transactions.forEach(transaction => {
      // BigNumber 문자열을 다루는 간단한 방식 (실제로는 더 정확한 BigNumber 라이브러리 사용 권장)
      totalVolume = (BigInt(totalVolume) + BigInt(transaction.totalPrice)).toString();
    });
    
    // 등록 사용자 수
    const totalUsers = await User.countDocuments();
    
    // 지갑 연결된 사용자 수
    const walletConnectedUsers = await User.countDocuments({ walletAddress: { $exists: true, $ne: null } });
    
    res.status(200).json({
      totalProperties,
      tokenizedProperties,
      tokenizationRate: totalProperties > 0 ? (tokenizedProperties / totalProperties) * 100 : 0,
      totalTransactions,
      totalVolumeWei: totalVolume,
      totalUsers,
      walletConnectedUsers,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('플랫폼 통계 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 부동산 유형별 통계
exports.getPropertyTypeStats = async (req, res) => {
  try {
    const propertyStats = await Property.aggregate([
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 },
          tokenizedCount: {
            $sum: { $cond: [{ $eq: ['$isTokenized', true] }, 1, 0] }
          },
          totalValue: { $sum: { $toDecimal: '$appraisedValue' } }
        }
      },
      {
        $project: {
          propertyType: '$_id',
          count: 1,
          tokenizedCount: 1,
          tokenizationRate: {
            $multiply: [
              { $divide: ['$tokenizedCount', '$count'] },
              100
            ]
          },
          totalValue: 1,
          _id: 0
        }
      }
    ]);
    
    res.status(200).json(propertyStats);
  } catch (error) {
    console.error('부동산 유형별 통계 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 거래 트렌드 분석 (일/주/월별 추이)
exports.getTransactionTrends = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let groupBy = {};
    if (period === 'daily') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
    } else { // monthly (기본값)
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    }
    
    const transactionTrends = await Transaction.aggregate([
      {
        $match: { status: '완료' }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          totalVolume: { $sum: { $toDecimal: '$totalPrice' } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
      }
    ]);
    
    res.status(200).json({
      period,
      data: transactionTrends.map(item => ({
        ...item._id,
        count: item.count,
        totalVolume: item.totalVolume.toString()
      }))
    });
  } catch (error) {
    console.error('거래 트렌드 분석 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 사용자별 투자 성과 분석
exports.getUserInvestmentPerformance = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;
    
    if (!walletAddress) {
      return res.status(400).json({ error: '연결된 지갑 주소가 없습니다' });
    }
    
    // 사용자의 구매 트랜잭션
    const purchases = await Transaction.find({
      buyer: walletAddress,
      status: '완료',
      transactionType: '구매'
    }).populate('property');
    
    // 사용자의 판매 트랜잭션
    const sales = await Transaction.find({
      seller: walletAddress,
      status: '완료',
      transactionType: '판매'
    }).populate('property');
    
    // 지분별 투자 성과 계산
    const sharesPerformance = {};
    
    // 구매 기록 처리
    purchases.forEach(tx => {
      if (!sharesPerformance[tx.shareId]) {
        sharesPerformance[tx.shareId] = {
          shareId: tx.shareId,
          propertyId: tx.property.tokenId,
          propertyAddress: tx.property.propertyAddress,
          totalPurchased: 0,
          totalSpent: BigInt(0),
          totalSold: 0,
          totalEarned: BigInt(0),
          remainingShares: 0,
          averagePurchasePrice: 0,
          transactions: []
        };
      }
      
      sharesPerformance[tx.shareId].totalPurchased += tx.amount;
      sharesPerformance[tx.shareId].totalSpent += BigInt(tx.totalPrice);
      sharesPerformance[tx.shareId].remainingShares += tx.amount;
      sharesPerformance[tx.shareId].transactions.push({
        type: '구매',
        amount: tx.amount,
        price: tx.totalPrice,
        date: tx.createdAt
      });
    });
    
    // 판매 기록 처리
    sales.forEach(tx => {
      if (sharesPerformance[tx.shareId]) {
        sharesPerformance[tx.shareId].totalSold += tx.amount;
        sharesPerformance[tx.shareId].totalEarned += BigInt(tx.totalPrice);
        sharesPerformance[tx.shareId].remainingShares -= tx.amount;
        sharesPerformance[tx.shareId].transactions.push({
          type: '판매',
          amount: tx.amount,
          price: tx.totalPrice,
          date: tx.createdAt
        });
      }
    });
    
    // 각 지분별 평균 구매가, 수익률 계산
    Object.values(sharesPerformance).forEach(perf => {
      perf.averagePurchasePrice = perf.totalPurchased > 0 ? 
        Number(perf.totalSpent) / perf.totalPurchased : 0;
      
      // 판매한 지분에 대한 수익률 계산
      if (perf.totalSold > 0) {
        const avgSellingPrice = Number(perf.totalEarned) / perf.totalSold;
        const avgBuyingPrice = perf.averagePurchasePrice;
        perf.soldSharesROI = ((avgSellingPrice - avgBuyingPrice) / avgBuyingPrice) * 100;
      } else {
        perf.soldSharesROI = 0;
      }
      
      // 문자열로 변환
      perf.totalSpent = perf.totalSpent.toString();
      perf.totalEarned = perf.totalEarned.toString();
    });
    
    // 전체 투자 성과 요약
    let totalInvested = BigInt(0);
    let totalReturned = BigInt(0);
    
    Object.values(sharesPerformance).forEach(perf => {
      totalInvested += BigInt(perf.totalSpent);
      totalReturned += BigInt(perf.totalEarned);
    });
    
    // 아직 판매되지 않은 지분의 현재 시장가치 추정
    // (실제 구현 시에는 현재 시장가격을 가져와야 함)
    
    res.status(200).json({
      summary: {
        totalInvested: totalInvested.toString(),
        totalReturned: totalReturned.toString(),
        overallROI: Number(totalInvested) > 0 ? 
          ((Number(totalReturned) - Number(totalInvested)) / Number(totalInvested)) * 100 : 0
      },
      sharesPerformance: Object.values(sharesPerformance)
    });
  } catch (error) {
    console.error('사용자 투자 성과 분석 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 지역별 부동산 시장 분석
exports.getRegionalMarketAnalysis = async (req, res) => {
  try {
    // 위도, 경도 기반으로 지역 그룹화 (간단한 구현)
    // 실제로는 더 정확한 지역 분류 알고리즘 사용 필요
    const regions = await Property.aggregate([
      {
        $group: {
          _id: {
            // 위도, 경도를 반올림하여 지역으로 그룹화 (간단한 방식)
            latitude: { $substr: ['$latitude', 0, 5] },
            longitude: { $substr: ['$longitude', 0, 5] }
          },
          count: { $sum: 1 },
          avgValue: { $avg: { $toDecimal: '$appraisedValue' } },
          totalValue: { $sum: { $toDecimal: '$appraisedValue' } },
          tokenizedCount: { $sum: { $cond: [{ $eq: ['$isTokenized', true] }, 1, 0] } },
          properties: { $push: { id: '$_id', address: '$propertyAddress', value: '$appraisedValue' } }
        }
      },
      {
        $project: {
          region: '$_id',
          count: 1,
          avgValue: 1,
          totalValue: 1,
          tokenizedCount: 1,
          tokenizationRate: {
            $multiply: [
              { $divide: ['$tokenizedCount', '$count'] },
              100
            ]
          },
          sampleProperties: { $slice: ['$properties', 5] },
          _id: 0
        }
      }
    ]);
    
    res.status(200).json(regions);
  } catch (error) {
    console.error('지역별 시장 분석 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 