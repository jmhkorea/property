module.exports = async function() {
  // 전역 변수에 저장된 MongoDB 메모리 서버 인스턴스 가져오기
  const mongod = global.__MONGOD__;
  
  // 서버가 있으면 종료
  if (mongod) {
    await mongod.stop();
    console.log('MongoDB Memory Server stopped');
  }
}; 