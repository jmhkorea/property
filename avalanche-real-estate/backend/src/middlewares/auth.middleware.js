const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    // 토큰 추출 및 검증
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 조회
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

module.exports = authMiddleware; 