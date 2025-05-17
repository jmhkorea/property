/**
 * 관리자 권한 확인 미들웨어
 * 인증된 사용자가 관리자 권한을 가지고 있는지 확인합니다.
 * authMiddleware 이후에 사용해야 합니다.
 */
const adminMiddleware = (req, res, next) => {
  // 사용자가 인증되어 있고, req.user가 존재하는지 확인
  if (!req.user) {
    return res.status(401).json({ error: '인증되지 않은 요청입니다' });
  }

  // 사용자의 역할이 'admin'인지 확인
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }

  // 관리자 권한 확인 완료, 다음 미들웨어로 진행
  next();
};

module.exports = adminMiddleware; 