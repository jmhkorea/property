module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  // MongoDB 메모리 서버 전역 설정을 위한 세팅
  globalSetup: '<rootDir>/tests/setup.js',
  globalTeardown: '<rootDir>/tests/teardown.js',
  testEnvironment: '<rootDir>/tests/mongo-environment.js',
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  // 테스트 디렉토리 패턴
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  // Mock 파일 위치
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}; 