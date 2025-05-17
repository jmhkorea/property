const mongoose = require('mongoose');
const Share = require('../../src/models/share.model');
const Property = require('../../src/models/property.model');
const User = require('../../src/models/user.model');
const Transaction = require('../../src/models/transaction.model');
const shareController = require('../../src/controllers/share.controller');
const web3Utils = require('../../src/utils/web3.utils');

// mock web3 유틸리티 함수
jest.mock('../../src/utils/web3.utils', () => ({
  getShareInfo: jest.fn(),
}));

// mock 응답 객체 설정
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// 테스트 시작 전 mongoose 연결
beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// 테스트 종료 후 mongoose 연결 해제
afterAll(async () => {
  await mongoose.connection.close();
});

// 각 테스트 후 컬렉션 초기화
afterEach(async () => {
  await Share.deleteMany({});
  await Property.deleteMany({});
  await User.deleteMany({});
  await Transaction.deleteMany({});
  jest.clearAllMocks();
});

describe('Share Controller Unit Tests', () => {
  let testUser, testProperty, testShare;

  // 각 테스트 전 필요한 데이터 설정
  beforeEach(async () => {
    // 테스트용 사용자 생성
    testUser = await User.create({
      email: 'share@example.com',
      password: 'password123',
      name: 'Share User',
      walletAddress: '0x1234567890abcdef',
    });

    // 테스트용 부동산 생성
    testProperty = await Property.create({
      propertyAddress: '서울시 강남구 테헤란로 123',
      propertyType: '아파트',
      squareMeters: 85,
      appraisedValue: '100000000000000000000', // 100 AVAX (wei 단위)
      latitude: '37.5665',
      longitude: '126.9780',
      ownerAddress: '0x1234567890abcdef',
      ipfsDocumentURI: 'ipfs://QmXzT',
      createdBy: testUser._id,
      tokenId: 1,
      isTokenized: true,
    });

    // 테스트용 지분 생성
    testShare = await Share.create({
      shareId: 1,
      propertyId: 1,
      property: testProperty._id,
      totalShares: 100,
      availableShares: 100,
      pricePerShare: '1000000000000000000', // 1 AVAX (wei 단위)
      tokenizer: '0x1234567890abcdef',
      active: true,
    });
  });

  describe('지분 목록 조회', () => {
    test('모든 지분 목록 조회 성공', async () => {
      // 추가 지분 생성
      await Share.create({
        shareId: 2,
        propertyId: 1,
        property: testProperty._id,
        totalShares: 200,
        availableShares: 180,
        pricePerShare: '1200000000000000000', // 1.2 AVAX (wei 단위)
        tokenizer: '0x1234567890abcdef',
        active: true,
      });

      const req = {};
      const res = mockResponse();

      // 지분 목록 조회 컨트롤러 실행
      await shareController.getAllShares(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            shareId: 1,
            totalShares: 100,
          }),
          expect.objectContaining({
            shareId: 2,
            totalShares: 200,
          }),
        ])
      );
    });
  });

  describe('지분 상세 조회', () => {
    test('존재하는 지분 ID로 조회 성공', async () => {
      // web3 유틸리티 mock 함수 설정
      web3Utils.getShareInfo.mockResolvedValue({
        success: true,
        data: {
          propertyId: 1,
          totalShares: 100,
          availableShares: 90, // 블록체인에서는 이미 10개가 팔림
          pricePerShare: '1000000000000000000',
          propertyAddress: '서울시 강남구 테헤란로 123',
          tokenizer: '0x1234567890abcdef',
          active: true,
        },
      });

      const req = {
        params: {
          id: '1',
        },
      };
      const res = mockResponse();

      // 지분 상세 조회 컨트롤러 실행
      await shareController.getShareById(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          shareId: 1,
          totalShares: 100,
          availableShares: 90, // 블록체인 값으로 업데이트됨
        })
      );

      // 데이터베이스에 지분 정보가 업데이트되었는지 확인
      const share = await Share.findOne({ shareId: 1 });
      expect(share.availableShares).toBe(90);
    });

    test('존재하지 않는 지분 ID로 조회 실패', async () => {
      const req = {
        params: {
          id: '999',
        },
      };
      const res = mockResponse();

      // 지분 상세 조회 컨트롤러 실행
      await shareController.getShareById(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '해당 지분을 찾을 수 없습니다',
        })
      );
    });
  });

  describe('지분 구매', () => {
    test('유효한 데이터로 지분 구매 처리 성공', async () => {
      // web3 유틸리티 mock 함수 설정
      web3Utils.getShareInfo.mockResolvedValue({
        success: true,
        data: {
          propertyId: 1,
          totalShares: 100,
          availableShares: 90, // 구매 후 남은 수량
          pricePerShare: '1000000000000000000',
          propertyAddress: '서울시 강남구 테헤란로 123',
          tokenizer: '0x1234567890abcdef',
          active: true,
        },
      });

      const req = {
        body: {
          shareId: 1,
          buyer: '0x9876543210fedcba',
          amount: 10,
          totalPrice: '10000000000000000000', // 10 AVAX (wei 단위)
          transactionHash: '0xabcdef1234567890',
        },
      };
      const res = mockResponse();

      // 지분 구매 컨트롤러 실행
      await shareController.purchaseShare(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '지분 구매가 성공적으로 기록되었습니다',
          transaction: expect.objectContaining({
            shareId: 1,
            buyer: '0x9876543210fedcba',
            amount: 10,
            totalPrice: '10000000000000000000',
          }),
        })
      );

      // 데이터베이스에 트랜잭션이 생성되었는지 확인
      const transaction = await Transaction.findOne({ 
        shareId: 1, 
        buyer: '0x9876543210fedcba' 
      });
      expect(transaction).not.toBeNull();
      expect(transaction.amount).toBe(10);
      expect(transaction.transactionType).toBe('구매');
      expect(transaction.status).toBe('완료');

      // 지분 정보가 업데이트되었는지 확인
      const share = await Share.findOne({ shareId: 1 });
      expect(share.availableShares).toBe(90);
    });

    test('블록체인 정보 조회 실패 시 지분 구매 처리 실패', async () => {
      // web3 유틸리티 mock 함수 설정 (실패 케이스)
      web3Utils.getShareInfo.mockResolvedValue({
        success: false,
        error: '블록체인 정보 조회 오류',
      });

      const req = {
        body: {
          shareId: 1,
          buyer: '0x9876543210fedcba',
          amount: 10,
          totalPrice: '10000000000000000000', // 10 AVAX (wei 단위)
        },
      };
      const res = mockResponse();

      // 지분 구매 컨트롤러 실행
      await shareController.purchaseShare(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '블록체인에서 지분 정보를 조회할 수 없습니다',
        })
      );

      // 데이터베이스에 트랜잭션이 생성되지 않았는지 확인
      const transaction = await Transaction.findOne({ 
        shareId: 1, 
        buyer: '0x9876543210fedcba' 
      });
      expect(transaction).toBeNull();
    });
  });

  describe('사용자 보유 지분 조회', () => {
    test('지갑 주소가 있는 사용자의 지분 조회 성공', async () => {
      // 트랜잭션 데이터 생성
      await Transaction.create({
        shareId: 1,
        property: testProperty._id,
        buyer: '0x1234567890abcdef',
        seller: '0xaaaaaaaaaaaaaaa',
        amount: 10,
        totalPrice: '10000000000000000000', // 10 AVAX (wei 단위)
        transactionType: '구매',
        transactionHash: '0xabcdef1234567890',
        status: '완료',
      });

      const req = {
        user: {
          walletAddress: '0x1234567890abcdef',
        },
      };
      const res = mockResponse();

      // 사용자 지분 조회 컨트롤러 실행
      await shareController.getUserShares(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenizedShares: expect.arrayContaining([
            expect.objectContaining({
              shareId: 1,
              tokenizer: '0x1234567890abcdef',
            }),
          ]),
          purchases: expect.arrayContaining([
            expect.objectContaining({
              shareId: 1,
              buyer: '0x1234567890abcdef',
              amount: 10,
            }),
          ]),
          shareHoldings: expect.arrayContaining([
            expect.objectContaining({
              shareId: 1,
              totalPurchased: 10,
            }),
          ]),
        })
      );
    });

    test('지갑 주소가 없는 사용자의 지분 조회 실패', async () => {
      const req = {
        user: {
          // walletAddress가 없음
        },
      };
      const res = mockResponse();

      // 사용자 지분 조회 컨트롤러 실행
      await shareController.getUserShares(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '연결된 지갑 주소가 없습니다',
        })
      );
    });
  });

  describe('특정 부동산의 지분 목록 조회', () => {
    test('유효한 부동산 ID로 지분 목록 조회 성공', async () => {
      const req = {
        params: {
          propertyId: '1',
        },
      };
      const res = mockResponse();

      // 부동산 지분 목록 조회 컨트롤러 실행
      await shareController.getSharesByProperty(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            shareId: 1,
            propertyId: 1,
            totalShares: 100,
          }),
        ])
      );
    });

    test('존재하지 않는 부동산 ID로 지분 목록 조회 실패', async () => {
      const req = {
        params: {
          propertyId: '999',
        },
      };
      const res = mockResponse();

      // 부동산 지분 목록 조회 컨트롤러 실행
      await shareController.getSharesByProperty(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '해당 부동산을 찾을 수 없습니다',
        })
      );
    });
  });
}); 