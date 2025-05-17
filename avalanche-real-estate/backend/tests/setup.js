const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function() {
  // MongoDB 메모리 서버 인스턴스 생성
  const mongod = await MongoMemoryServer.create();
  
  // MongoDB 서버 URI 설정
  const uri = mongod.getUri();
  
  // 전역 변수로 접근 가능하게 설정
  global.__MONGOD__ = mongod;
  global.__MONGO_URI__ = uri;
  
  // 환경 변수 설정
  process.env.MONGODB_URI = uri;
  
  // 테스트용 JWT 비밀키 설정
  process.env.JWT_SECRET = 'test_jwt_secret_key';
  
  console.log(`MongoDB Memory Server started at ${uri}`);
}; 