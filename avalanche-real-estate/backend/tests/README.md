# 아발란체 부동산 토큰화 플랫폼 테스트

이 디렉토리에는 아발란체 부동산 토큰화 플랫폼의 백엔드 API에 대한 테스트 코드가 포함되어 있습니다.

## 테스트 구조

테스트는 다음과 같이 구성되어 있습니다:

- `unit/`: 단위 테스트 - 개별 함수 및 컴포넌트의 기능을 테스트합니다.
- `integration/`: 통합 테스트 - API 엔드포인트와 데이터베이스 상호작용을 테스트합니다.

## 테스트 파일 목록

### 단위 테스트
- `auth.test.js`: 인증 관련 기능 테스트
- `property.test.js`: 부동산 관련 기능 테스트
- `share.test.js`: 지분 관리 관련 기능 테스트

### 통합 테스트
- `auth.integration.test.js`: 인증 API 엔드포인트 테스트
- `property.integration.test.js`: 부동산 API 엔드포인트 테스트
- `token.integration.test.js`: 토큰 API 엔드포인트 테스트
- `share.integration.test.js`: 지분 관리 API 엔드포인트 테스트

## 테스트 실행 방법

### 모든 테스트 실행
```
npm test
```

### 특정 테스트 파일 실행
```
npm test -- tests/integration/auth.integration.test.js
```

### 특정 테스트 그룹 실행
```
npm test -- --testPathPattern=integration
```

## 테스트 데이터베이스 설정

테스트는 메모리 기반 MongoDB 데이터베이스를 사용합니다(`mongodb-memory-server`). 
이를 통해 실제 데이터베이스에 영향을 주지 않고 테스트를 실행할 수 있습니다.

설정은 `jest.config.js` 파일에 정의되어 있으며, 각 테스트 파일에서 다음과 같이 데이터베이스를 초기화합니다:

```javascript
// 테스트 시작 전 mongoose 연결
beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key';
  await mongoose.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// 테스트 종료 후 mongoose 연결 해제
afterAll(async () => {
  await mongoose.connection.close();
});

// 각 테스트 후 데이터베이스 초기화
afterEach(async () => {
  await Collection.deleteMany({});
});
```

## 모의 객체 (Mocks)

API 테스트 시 외부 서비스에 대한 의존성은 Jest의 모의 객체를 사용하여 대체됩니다.
이는 `__mocks__` 디렉토리에 정의되어 있습니다.

## 테스트 커버리지 확인

테스트 커버리지 보고서를 생성하려면 다음 명령어를 실행하세요:

```
npm run test:coverage
```

보고서는 `coverage` 디렉토리에 생성됩니다. 