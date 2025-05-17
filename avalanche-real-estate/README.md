# 아발란체 부동산 토큰화 플랫폼

아발란체(Avalanche) 블록체인을 사용한 부동산 토큰화 플랫폼입니다. 이 플랫폼은 부동산 자산을 NFT로 발행하고, 이를 분할 소유권으로 토큰화하여 누구나 부동산에 소액으로 투자할 수 있게 해줍니다.

## 주요 기능

- 부동산 자산의 NFT 발행 (ERC-721)
- 부동산 자산의 분할 소유권 토큰화 (ERC-1155)
- 지분 매매 마켓플레이스
- 부동산 토큰의 수익 분배 시스템
- 블록체인 기반 소유권 증명 및 거래 내역 추적
- 부동산 가치 평가 시스템
- 자동화된 수익 분배 및 정산 시스템
- 부동산 관리 및 임대 정보 추적

## 기술 스택

- **블록체인**: Avalanche C-Chain
- **스마트 컨트랙트**: Solidity
- **프론트엔드**: React, TailwindCSS
- **백엔드**: Node.js, Express
- **데이터베이스**: MongoDB
- **개발 툴**: Hardhat, Ethers.js

## 프로젝트 구조

```
avalanche-real-estate/
├── contracts/             # 스마트 컨트랙트
│   ├── interfaces/        # 인터페이스
│   ├── tokens/            # 토큰 컨트랙트
│   └── fractional/        # 분할 소유권 컨트랙트
├── scripts/               # 배포 스크립트
├── test/                  # 테스트 코드
├── frontend/              # 프론트엔드
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── utils/         # 유틸리티 함수
│   │   ├── services/      # API 서비스
│   │   └── assets/        # 이미지, 폰트 등 정적 자산
│   └── public/            # 정적 파일
├── backend/               # 백엔드
│   ├── src/
│   │   ├── controllers/   # 컨트롤러
│   │   ├── models/        # 데이터 모델
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   └── utils/         # 유틸리티 함수
│   └── config/            # 설정 파일
├── .env.example           # 환경 변수 예제
├── hardhat.config.js      # Hardhat 설정
├── package.json           # 의존성 및 스크립트
└── README.md              # 프로젝트 설명
```

## 부동산 평가 시스템

부동산 가치 평가 시스템은 다음과 같은 주요 기능을 제공합니다:

- **다양한 평가 방법론**: 비교 시장 분석(CMA), 소득 접근법, 비용 접근법 등 다양한 방법론을 지원합니다.
- **평가사 역할 관리**: 부동산 평가사는 플랫폼에서 특별 권한을 가지고 공식 평가를 진행할 수 있습니다.
- **평가 검증 및 승인 프로세스**: 관리자는 평가 결과를 검토하고 승인/거부할 수 있습니다.
- **블록체인 기록**: 승인된 평가는 블록체인에 기록되어 투명성과 신뢰성을 보장합니다.
- **평가 요소 분석**: 위치, 상태, 시장 동향 등 다양한 요소를 고려한 종합적인 평가를 지원합니다.
- **평가 문서 관리**: 평가 관련 문서를 IPFS에 저장하고 관리할 수 있습니다.

## 수익 분배 시스템

수익 분배 시스템은 부동산에서 발생하는 수익(임대료, 운영 수익 등)을 토큰 소유자에게 자동으로 분배하는 기능을 제공합니다:

- **수익 등록 및 관리**: 부동산 관리자는 수익 발생 시 플랫폼에 등록할 수 있습니다.
- **소유권 스냅샷**: 분배 시점의 토큰 소유권 현황을 스냅샷으로 저장합니다.
- **자동 분배 계산**: 각 토큰 소유자의 지분 비율에 따라 수익을 자동으로 계산합니다.
- **분배 예약 및 자동화**: 특정 날짜에 자동으로 분배되도록 예약할 수 있습니다.
- **분배 상태 추적**: 분배 과정의 상태를 실시간으로 추적할 수 있습니다.
- **블록체인 기반 정산**: 스마트 컨트랙트를 통해 투명하고 자동화된 정산이 이루어집니다.
- **분배 이력 관리**: 모든 분배 이력이 저장되어 언제든지 조회할 수 있습니다.

## 시작하기

### 사전 요구사항

- Node.js v14 이상
- npm 또는 yarn
- MongoDB
- MetaMask 지갑

### 설치 및 설정

1. 저장소 클론
   ```
   git clone https://github.com/yourusername/avalanche-real-estate.git
   cd avalanche-real-estate
   ```

2. 의존성 설치
   ```
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. 환경 변수 설정
   ```
   cp .env.example .env
   ```
   `.env` 파일을 열고 필요한 정보를 입력하세요.

4. 스마트 컨트랙트 컴파일
   ```
   npm run compile
   ```

5. 테스트 실행
   ```
   npm test
   ```

6. Fuji 테스트넷에 배포
   ```
   npm run deploy:fuji
   ```

7. 개발 서버 실행
   ```
   npm run dev
   ```

## API 엔드포인트

### 부동산 평가 API

- `GET /api/valuations` - 모든 평가 내역 조회 (관리자/평가사 전용)
- `GET /api/valuations/property/:propertyId` - 특정 부동산의 평가 내역 조회
- `GET /api/valuations/:id` - 특정 평가 내역 조회
- `GET /api/valuations/property/:propertyId/latest` - 최신 평가 내역 조회
- `POST /api/valuations/request` - 평가 요청
- `POST /api/valuations` - 새로운 평가 등록 (평가사/관리자 전용)
- `PATCH /api/valuations/:id/status` - 평가 상태 업데이트
- `POST /api/valuations/:id/documents` - 평가 문서 추가
- `PATCH /api/valuations/:id/review` - 평가 승인/거부 (관리자 전용)
- `POST /api/valuations/:id/record-on-chain` - 평가 블록체인 기록 (관리자 전용)

### 수익 분배 API

- `GET /api/incomes` - 모든 수익 분배 내역 조회 (관리자 전용)
- `GET /api/incomes/property/:propertyId` - 특정 부동산의 수익 분배 내역 조회
- `GET /api/incomes/token/:tokenId` - 특정 토큰의 수익 분배 내역 조회
- `GET /api/incomes/user` - 사용자의 수익 분배 내역 조회
- `GET /api/incomes/:id` - 특정 수익 분배 내역 조회
- `POST /api/incomes` - 새 수익 등록
- `POST /api/incomes/:id/snapshot` - 소유권 스냅샷 생성
- `POST /api/incomes/:id/distribute` - 수익 분배 시작
- `GET /api/incomes/:id/status` - 분배 상태 확인
- `POST /api/incomes/:id/cancel` - 분배 취소 (관리자 전용)
- `POST /api/incomes/:id/complete` - 분배 수동 완료 (관리자 전용)
- `POST /api/incomes/schedule` - 분배 예약
- `GET /api/incomes/scheduled` - 예정된 분배 목록 조회

## 테스트넷 정보

아발란체 Fuji 테스트넷을 사용합니다.

- 네트워크 이름: Avalanche FUJI C-Chain
- RPC URL: https://api.avax-test.network/ext/bc/C/rpc
- 체인 ID: 43113
- 통화 기호: AVAX
- 블록 탐색기: https://testnet.snowtrace.io

## 라이선스

MIT 