import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Table, Badge, Spinner, Alert, Form, Row, Col, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PropertyValuationForm from '../components/PropertyValuationForm';
import ValuationDocumentForm from '../components/ValuationDocumentForm';

const PropertyValuation = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [valuations, setValuations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showValuationForm, setShowValuationForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [selectedValuation, setSelectedValuation] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const fetchPropertyAndValuations = async () => {
      try {
        setLoading(true);
        // 부동산 정보 조회
        const propertyResponse = await axios.get(`/api/properties/${propertyId}`);
        setProperty(propertyResponse.data);
        
        // 부동산 평가 이력 조회
        const valuationsResponse = await axios.get(`/api/valuations/property/${propertyId}`);
        setValuations(valuationsResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError('데이터를 가져오는 중 오류가 발생했습니다.');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };
    
    fetchPropertyAndValuations();
  }, [propertyId]);

  const handleCreateValuation = async (valuationData) => {
    try {
      const response = await axios.post('/api/valuations', {
        ...valuationData,
        property: propertyId
      });
      
      setValuations([...valuations, response.data]);
      setShowValuationForm(false);
    } catch (err) {
      setError('평가 생성 중 오류가 발생했습니다.');
      console.error('Error creating valuation:', err);
    }
  };

  const handleAddDocument = async (documentData) => {
    try {
      const response = await axios.post(`/api/valuations/${selectedValuation._id}/documents`, documentData);
      
      // 평가 목록 업데이트
      const updatedValuations = valuations.map(val => 
        val._id === selectedValuation._id ? response.data : val
      );
      
      setValuations(updatedValuations);
      setShowDocumentForm(false);
      setSelectedValuation(null);
    } catch (err) {
      setError('문서 추가 중 오류가 발생했습니다.');
      console.error('Error adding document:', err);
    }
  };

  const handleApproveValuation = async (valuationId) => {
    try {
      const response = await axios.put(`/api/valuations/${valuationId}/approve`);
      
      // 평가 목록 업데이트
      const updatedValuations = valuations.map(val => 
        val._id === valuationId ? response.data : val
      );
      
      setValuations(updatedValuations);
      setConfirmAction(null);
    } catch (err) {
      setError('평가 승인 중 오류가 발생했습니다.');
      console.error('Error approving valuation:', err);
    }
  };

  const handleRecordOnBlockchain = async (valuationId) => {
    try {
      const response = await axios.post(`/api/valuations/${valuationId}/record-on-chain`);
      
      // 평가 목록 업데이트
      const updatedValuations = valuations.map(val => 
        val._id === valuationId ? response.data : val
      );
      
      setValuations(updatedValuations);
      setConfirmAction(null);
    } catch (err) {
      setError('블록체인 기록 중 오류가 발생했습니다.');
      console.error('Error recording on blockchain:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'draft': <Badge bg="secondary">초안</Badge>,
      'pending_review': <Badge bg="info">검토 중</Badge>,
      'rejected': <Badge bg="danger">거부됨</Badge>,
      'approved': <Badge bg="success">승인됨</Badge>,
      'published': <Badge bg="primary">게시됨</Badge>
    };
    
    return statusMap[status] || <Badge bg="light">알 수 없음</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
        <p>로딩 중...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          돌아가기
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {property && (
        <>
          <h2 className="mb-4">부동산 평가 관리</h2>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">부동산 정보</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>주소:</strong> {property.propertyAddress}</p>
                  <p><strong>유형:</strong> {property.propertyType}</p>
                  <p><strong>면적:</strong> {property.squareMeters}㎡</p>
                </Col>
                <Col md={6}>
                  <p><strong>평가 기준가:</strong> {Number(property.appraisedValue).toLocaleString()}원</p>
                  <p><strong>토큰화 상태:</strong> {property.isTokenized ? '토큰화됨' : '토큰화되지 않음'}</p>
                  {property.tokenId && <p><strong>토큰 ID:</strong> {property.tokenId}</p>}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>평가 이력</h4>
            <Button 
              variant="primary" 
              onClick={() => setShowValuationForm(true)}
              disabled={!property.isTokenized}
            >
              새 평가 생성
            </Button>
          </div>

          {property.isTokenized ? (
            valuations.length > 0 ? (
              <Table responsive bordered hover>
                <thead>
                  <tr>
                    <th>평가 일자</th>
                    <th>평가 방법론</th>
                    <th>현재 가치</th>
                    <th>신뢰도 점수</th>
                    <th>상태</th>
                    <th>문서</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {valuations.map((valuation) => (
                    <tr key={valuation._id}>
                      <td>{new Date(valuation.valuationDate).toLocaleDateString()}</td>
                      <td>
                        {valuation.methodology === 'comparative_market_analysis' && '비교 시장 분석'}
                        {valuation.methodology === 'income_approach' && '수익 접근법'}
                        {valuation.methodology === 'cost_approach' && '비용 접근법'}
                      </td>
                      <td>{Number(valuation.currentValue).toLocaleString()}원</td>
                      <td>{valuation.confidenceScore || 'N/A'}</td>
                      <td>{getStatusBadge(valuation.status)}</td>
                      <td>{valuation.documents?.length || 0}개</td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline-info" 
                          className="me-1 mb-1"
                          onClick={() => {
                            setSelectedValuation(valuation);
                            setShowDocumentForm(true);
                          }}
                        >
                          문서 추가
                        </Button>
                        
                        {valuation.status === 'pending_review' && currentUser?.role === 'admin' && (
                          <Button 
                            size="sm" 
                            variant="outline-success" 
                            className="me-1 mb-1"
                            onClick={() => setConfirmAction({
                              type: 'approve',
                              id: valuation._id,
                              title: '평가 승인',
                              message: '이 평가를 승인하시겠습니까?'
                            })}
                          >
                            승인
                          </Button>
                        )}
                        
                        {valuation.status === 'approved' && !valuation.recordedOnChain && (
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1 mb-1"
                            onClick={() => setConfirmAction({
                              type: 'record',
                              id: valuation._id,
                              title: '블록체인 기록',
                              message: '이 평가를 블록체인에 기록하시겠습니까?'
                            })}
                          >
                            블록체인 기록
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Alert variant="info">
                아직 등록된 평가가 없습니다. 새 평가를 생성해주세요.
              </Alert>
            )
          ) : (
            <Alert variant="warning">
              평가를 생성하려면 먼저 부동산을 토큰화해야 합니다.
            </Alert>
          )}
        </>
      )}

      {/* 새 평가 생성 모달 */}
      <Modal show={showValuationForm} onHide={() => setShowValuationForm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>새 부동산 평가 생성</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PropertyValuationForm 
            onSubmit={handleCreateValuation} 
            onCancel={() => setShowValuationForm(false)} 
          />
        </Modal.Body>
      </Modal>

      {/* 문서 추가 모달 */}
      <Modal show={showDocumentForm} onHide={() => {
        setShowDocumentForm(false);
        setSelectedValuation(null);
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>평가 문서 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedValuation && (
            <ValuationDocumentForm 
              valuationId={selectedValuation._id}
              onSubmit={handleAddDocument} 
              onCancel={() => {
                setShowDocumentForm(false);
                setSelectedValuation(null);
              }} 
            />
          )}
        </Modal.Body>
      </Modal>

      {/* 확인 모달 */}
      <Modal show={!!confirmAction} onHide={() => setConfirmAction(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{confirmAction?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{confirmAction?.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmAction(null)}>
            취소
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (confirmAction?.type === 'approve') {
                handleApproveValuation(confirmAction.id);
              } else if (confirmAction?.type === 'record') {
                handleRecordOnBlockchain(confirmAction.id);
              }
            }}
          >
            확인
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PropertyValuation; 