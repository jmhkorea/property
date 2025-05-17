const mongoose = require('mongoose');
const Property = require('../../src/models/property.model');
const User = require('../../src/models/user.model');
const propertyController = require('../../src/controllers/property.controller');
const web3Utils = require('../../src/utils/web3.utils');

// mock web3 유틸리티 함수
jest.mock('../../src/utils/web3.utils', () => ({
  mintProperty: jest.fn(),
  getPropertyInfo: jest.fn(),
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

// 각 테스트 후 부동산 및 사용자 컬렉션 초기화
afterEach(async () => {
  await Property.deleteMany({});
  await User.deleteMany({});
  jest.clearAllMocks();
});

describe('Property Controller Unit Tests', () => {
  let testUser;

  // 각 테스트 전 테스트용 사용자 생성
  beforeEach(async () => {
    testUser = await User.create({
      email: 'property@example.com',
      password: 'password123',
      name: 'Property User',
      walletAddress: '0x1234567890abcdef',
    });
  });

  describe('부동산 목록 조회', () => {
    test('모든 부동산 목록 조회 성공', async () => {
      // 테스트용 부동산 데이터 생성
      await Property.create({
        propertyAddress: '서울시 강남구 테헤란로 123',
        propertyType: '아파트',
        squareMeters: 85,
        appraisedValue: '100000000000000000000', // 100 AVAX (wei 단위)
        latitude: '37.5665',
        longitude: '126.9780',
        ownerAddress: '0x1234567890abcdef',
        ipfsDocumentURI: 'ipfs://QmXzT',
        createdBy: testUser._id,
      });

      await Property.create({
        propertyAddress: '서울시 서초구 서초대로 456',
        propertyType: '단독주택',
        squareMeters: 150,
        appraisedValue: '200000000000000000000', // 200 AVAX (wei 단위)
        latitude: '37.4969',
        longitude: '127.0276',
        ownerAddress: '0x1234567890abcdef',
        ipfsDocumentURI: 'ipfs://QmYzT',
        createdBy: testUser._id,
      });

      // 요청 및 응답 객체 설정
      const req = {};
      const res = mockResponse();

      // 부동산 목록 조회 컨트롤러 실행
      await propertyController.getAllProperties(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            propertyAddress: '서울시 강남구 테헤란로 123',
            propertyType: '아파트',
          }),
          expect.objectContaining({
            propertyAddress: '서울시 서초구 서초대로 456',
            propertyType: '단독주택',
          }),
        ])
      );
    });
  });

  describe('부동산 상세 조회', () => {
    test('존재하는 부동산 ID로 조회 성공', async () => {
      // 테스트용 부동산 생성
      const property = await Property.create({
        propertyAddress: '서울시 강남구 테헤란로 123',
        propertyType: '아파트',
        squareMeters: 85,
        appraisedValue: '100000000000000000000', // 100 AVAX (wei 단위)
        latitude: '37.5665',
        longitude: '126.9780',
        ownerAddress: '0x1234567890abcdef',
        ipfsDocumentURI: 'ipfs://QmXzT',
        createdBy: testUser._id,
      });

      // 요청 및 응답 객체 설정
      const req = {
        params: {
          id: property._id.toString(),
        },
      };
      const res = mockResponse();

      // 부동산 상세 조회 컨트롤러 실행
      await propertyController.getPropertyById(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyAddress: '서울시 강남구 테헤란로 123',
          propertyType: '아파트',
          squareMeters: 85,
        })
      );
    });

    test('존재하지 않는 부동산 ID로 조회 실패', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const req = {
        params: {
          id: nonExistentId.toString(),
        },
      };
      const res = mockResponse();

      // 부동산 상세 조회 컨트롤러 실행
      await propertyController.getPropertyById(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '해당 부동산을 찾을 수 없습니다',
        })
      );
    });
  });

  describe('부동산 등록', () => {
    test('유효한 데이터로 부동산 등록 성공', async () => {
      // web3 유틸리티 mock 함수 설정
      web3Utils.mintProperty.mockResolvedValue({
        success: true,
        tokenId: 1,
        transactionHash: '0x1234567890abcdef',
      });

      // 요청 및 응답 객체 설정
      const req = {
        body: {
          propertyAddress: '서울시 강남구 테헤란로 123',
          propertyType: '아파트',
          squareMeters: 85,
          appraisedValue: '100000000000000000000', // 100 AVAX (wei 단위)
          latitude: '37.5665',
          longitude: '126.9780',
          ipfsDocumentURI: 'ipfs://QmXzT',
          ownerAddress: '0x1234567890abcdef',
        },
        user: testUser,
      };
      const res = mockResponse();

      // 부동산 등록 컨트롤러 실행
      await propertyController.createProperty(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '부동산이 성공적으로 등록되었습니다',
          property: expect.objectContaining({
            propertyAddress: '서울시 강남구 테헤란로 123',
            propertyType: '아파트',
            squareMeters: 85,
          }),
        })
      );

      // 데이터베이스에 부동산이 생성되었는지 확인
      const property = await Property.findOne({ propertyAddress: '서울시 강남구 테헤란로 123' });
      expect(property).not.toBeNull();
      expect(property.propertyType).toBe('아파트');
      expect(property.squareMeters).toBe(85);
      expect(property.tokenId).toBe(1);
      expect(property.blockchainStatus).toBe('등록완료');
    });

    test('블록체인 트랜잭션 실패 시 부동산 등록 실패', async () => {
      // web3 유틸리티 mock 함수 설정 (실패 케이스)
      web3Utils.mintProperty.mockResolvedValue({
        success: false,
        error: '블록체인 트랜잭션 오류',
      });

      // 요청 및 응답 객체 설정
      const req = {
        body: {
          propertyAddress: '서울시 강남구 테헤란로 123',
          propertyType: '아파트',
          squareMeters: 85,
          appraisedValue: '100000000000000000000', // 100 AVAX (wei 단위)
          latitude: '37.5665',
          longitude: '126.9780',
          ipfsDocumentURI: 'ipfs://QmXzT',
          ownerAddress: '0x1234567890abcdef',
        },
        user: testUser,
      };
      const res = mockResponse();

      // 부동산 등록 컨트롤러 실행
      await propertyController.createProperty(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '블록체인 트랜잭션 오류',
        })
      );

      // 데이터베이스에 부동산이 생성되지 않았는지 확인
      const property = await Property.findOne({ propertyAddress: '서울시 강남구 테헤란로 123' });
      expect(property).toBeNull();
    });
  });

  describe('부동산 토큰화', () => {
    test('유효한 데이터로 부동산 토큰화 성공', async () => {
      // 테스트용 부동산 생성
      const property = await Property.create({
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
      });

      // web3 유틸리티 mock 함수 설정
      web3Utils.getPropertyInfo.mockResolvedValue({
        success: true,
        data: {
          propertyAddress: '서울시 강남구 테헤란로 123',
          squareMeters: 85,
          propertyType: '아파트',
          appraisedValue: '100000000000000000000',
          ipfsDocumentURI: 'ipfs://QmXzT',
          latitude: '37.5665',
          longitude: '126.9780',
          owner: '0x1234567890abcdef',
          isTokenized: true,
        },
      });

      // 요청 및 응답 객체 설정
      const req = {
        body: {
          propertyId: 1,
          shareId: 1,
          totalShares: 100,
          pricePerShare: '1000000000000000000', // 1 AVAX (wei 단위)
          ownerAddress: '0x1234567890abcdef',
        },
      };
      const res = mockResponse();

      // 부동산 토큰화 컨트롤러 실행
      await propertyController.tokenizeProperty(req, res);

      // 응답 확인
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '부동산이 성공적으로 토큰화되었습니다',
          property: expect.objectContaining({
            isTokenized: true,
            shareId: 1,
            blockchainStatus: '토큰화완료',
          }),
        })
      );

      // 데이터베이스에 부동산이 업데이트되었는지 확인
      const updatedProperty = await Property.findById(property._id);
      expect(updatedProperty.isTokenized).toBe(true);
      expect(updatedProperty.shareId).toBe(1);
      expect(updatedProperty.blockchainStatus).toBe('토큰화완료');
    });
  });
});