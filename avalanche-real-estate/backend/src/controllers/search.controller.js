const Property = require('../models/property.model');
const Share = require('../models/share.model');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');

// 통합 검색 (여러 모델에서 동시에 검색)
exports.globalSearch = async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: '검색어는 최소 2글자 이상이어야 합니다' });
    }
    
    const results = {};
    const searchRegex = new RegExp(query, 'i');
    
    // 타입별 검색 또는 전체 검색
    if (!type || type === 'property') {
      // 부동산 검색
      results.properties = await Property.find({
        $or: [
          { propertyAddress: searchRegex },
          { propertyType: searchRegex },
          { description: searchRegex }
        ]
      }).limit(10);
    }
    
    if (!type || type === 'user') {
      // 사용자 검색 (관리자만 가능)
      if (req.user && req.user.role === 'admin') {
        results.users = await User.find({
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { walletAddress: searchRegex }
          ]
        }).select('-password').limit(10);
      }
    }
    
    if (!type || type === 'share') {
      // 토큰화된 지분 검색
      const shares = await Share.find({
        active: true
      }).populate({
        path: 'property',
        match: {
          $or: [
            { propertyAddress: searchRegex },
            { propertyType: searchRegex },
            { description: searchRegex }
          ]
        }
      });
      
      // populate 매치가 실패한 경우 property가 null이므로 필터링
      results.shares = shares.filter(share => share.property !== null).slice(0, 10);
    }
    
    if (!type || type === 'transaction') {
      // 트랜잭션 검색 (관리자만 가능)
      if (req.user && req.user.role === 'admin') {
        results.transactions = await Transaction.find({
          $or: [
            { transactionHash: searchRegex },
            { buyer: searchRegex },
            { seller: searchRegex }
          ]
        }).populate('property').limit(10);
      }
    }
    
    res.status(200).json({
      query,
      type: type || 'all',
      results
    });
  } catch (error) {
    console.error('통합 검색 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 부동산 고급 검색
exports.advancedPropertySearch = async (req, res) => {
  try {
    const {
      propertyType,
      minValue,
      maxValue,
      minSize,
      maxSize,
      isTokenized,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;
    
    // 검색 쿼리 구성
    const query = {};
    
    if (propertyType) {
      query.propertyType = propertyType;
    }
    
    // 가격 범위
    if (minValue || maxValue) {
      query.appraisedValue = {};
      
      if (minValue) {
        // Wei 단위로 변환된 최소 가격
        query.appraisedValue.$gte = minValue;
      }
      
      if (maxValue) {
        // Wei 단위로 변환된 최대 가격
        query.appraisedValue.$lte = maxValue;
      }
    }
    
    // 크기 범위
    if (minSize || maxSize) {
      query.squareMeters = {};
      
      if (minSize) {
        query.squareMeters.$gte = parseInt(minSize);
      }
      
      if (maxSize) {
        query.squareMeters.$lte = parseInt(maxSize);
      }
    }
    
    // 토큰화 여부
    if (isTokenized !== undefined) {
      query.isTokenized = isTokenized === 'true';
    }
    
    // 정렬 방식
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // 페이지네이션 적용
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 총 개수 조회
    const total = await Property.countDocuments(query);
    
    // 부동산 검색
    const properties = await Property.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      properties,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        propertyType,
        minValue,
        maxValue,
        minSize,
        maxSize,
        isTokenized
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('부동산 고급 검색 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 지역 기반 부동산 검색
exports.searchPropertiesByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in kilometers
    
    if (!lat || !lng) {
      return res.status(400).json({ error: '위도(lat)와 경도(lng) 파라미터가 필요합니다' });
    }
    
    // 간단한 위치 기반 검색 (MongoDB는 위치 기반 검색을 위한 고급 기능을 제공)
    // 실제 구현에서는 MongoDB의 geospatial 쿼리를 사용하는 것이 좋음
    // 여기서는 단순 구현으로 위도/경도 근사치로 검색
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInDegrees = parseFloat(radius) / 111; // 약 1도 = 111km
    
    const properties = await Property.find({
      latitude: { $gte: (latitude - radiusInDegrees).toString(), $lte: (latitude + radiusInDegrees).toString() },
      longitude: { $gte: (longitude - radiusInDegrees).toString(), $lte: (longitude + radiusInDegrees).toString() }
    }).limit(50);
    
    res.status(200).json({
      center: { lat, lng },
      radius,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('위치 기반 부동산 검색 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 