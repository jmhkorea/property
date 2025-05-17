require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

// 라우트 모듈 가져오기
const propertyRoutes = require('./routes/property.routes');
const authRoutes = require('./routes/auth.routes');
const tokenRoutes = require('./routes/token.routes');
const shareRoutes = require('./routes/share.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const searchRoutes = require('./routes/search.routes');
const adminRoutes = require('./routes/admin.routes');
const valuationRoutes = require('./routes/valuation.routes');
const incomeRoutes = require('./routes/income.routes');

// 앱 초기화
const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());

// 데이터베이스 연결
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB에 연결되었습니다'))
  .catch((err) => console.error('MongoDB 연결 오류:', err));

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/valuations', valuationRoutes);
app.use('/api/incomes', incomeRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: '아발란체 부동산 토큰화 플랫폼 API' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
}); 