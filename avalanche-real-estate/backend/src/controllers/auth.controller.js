const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// JWT 토큰 생성 함수
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// 회원가입
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '이미 등록된 이메일입니다' });
    }

    // 새 사용자 생성
    const user = new User({
      email,
      password,
      name,
    });

    await user.save();

    // 토큰 생성
    const token = generateToken(user._id);

    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 일치하지 않습니다' });
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 일치하지 않습니다' });
    }

    // 토큰 생성
    const token = generateToken(user._id);

    res.status(200).json({
      message: '로그인이 성공적으로 완료되었습니다',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 사용자 정보 조회
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // 현재 비밀번호 확인
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다' });
    }

    // 비밀번호 업데이트
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// 지갑 연결/업데이트
exports.connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const user = req.user;

    // 이미 해당 지갑 주소를 사용 중인 다른 사용자 확인
    if (walletAddress) {
      const existingWallet = await User.findOne({ walletAddress });
      if (existingWallet && existingWallet._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: '이미 다른 계정에 연결된 지갑 주소입니다' });
      }
    }

    // 지갑 주소 업데이트
    user.walletAddress = walletAddress;
    await user.save();

    res.status(200).json({
      message: '지갑 주소가 성공적으로 업데이트되었습니다',
      walletAddress: user.walletAddress,
    });
  } catch (error) {
    console.error('지갑 연결 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 