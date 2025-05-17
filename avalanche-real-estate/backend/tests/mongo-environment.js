const { TestEnvironment } = require('jest-environment-node');

class MongoEnvironment extends TestEnvironment {
  constructor(config) {
    super(config);
  }

  async setup() {
    await super.setup();
    
    // setup.js에서 설정한 전역 변수를 테스트 환경에 주입
    this.global.__MONGO_URI__ = global.__MONGO_URI__;
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = MongoEnvironment; 