import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Table, Badge, Spinner, Alert, Form, Row, Col, Modal, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import IncomeDistributionForm from '../components/IncomeDistributionForm';

const IncomeDistribution = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [token, setToken] = useState(null);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDistributionForm, setShowDistributionForm] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 부동산 정보 조회
        const propertyResponse = await axios.get(`/api/properties/${propertyId}`);
        setProperty(propertyResponse.data);
        
        // 토큰 정보 조회
        if (propertyResponse.data.isTokenized) {
          const tokenResponse = await axios.get(`/api/tokens/property/${propertyId}`);
          setToken(tokenResponse.data);
        }
        
        // 수익 분배 이력 조회
        const distributionsResponse = await axios.get(`/api/income-distributions/property/${propertyId}`);
        setDistributions(distributionsResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError('데이터를 가져오는 중 오류가 발생했습니다.');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  }, [propertyId]);

  const handleCreateDistribution = async (distributionData) => {
    try {
      const response = await axios.post('/api/income-distributions', {
        ...distributionData,
        property: propertyId,
        token: token._id
      });
      
      setDistributions([...distributions, response.data]);
      setShowDistributionForm(false);
    } catch (err) {
      setError('수익 분배 생성 중 오류가 발생했습니다.');
      console.error('Error creating income distribution:', err);
    }
  };

  const handleExecuteDistribution = async (distributionId) => {
    try {
      const response = await axios.post(`/api/income-distributions/${distributionId}/execute`);
      
      // 수익 분배 목록 업데이트
      const updatedDistributions = distributions.map(dist => 
        dist._id === distributionId ? response.data : dist
      );
      
      setDistributions(updatedDistributions);
      setConfirmAction(null);
    } catch (err) {
      setError('수익 분배 실행 중 오류가 발생했습니다.');
      console.error('Error executing income distribution:', err);
    }
  };

  const handleCancelDistribution = async (distributionId) => {
    try {
      const response = await axios.post(`/api/income-distributions/${distributionId}/cancel`);
      
      // 수익 분배 목록 업데이트
      const updatedDistributions = distributions.map(dist => 
        dist._id === distributionId ? response.data : dist
      );
      
      setDistributions(updatedDistributions);
      setConfirmAction(null);
    } catch (err) {
      setError('수익 분배 취소 중 오류가 발생했습니다.');
      console.error('Error cancelling income distribution:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'scheduled': <Badge bg="info">예정됨</Badge>,
      'in_progress': <Badge bg="warning">진행 중</Badge>,
      'completed': <Badge bg="success">완료됨</Badge>,
      'cancelled': <Badge bg="danger">취소됨</Badge>,
      'failed': <Badge bg="danger">실패</Badge>
    };
    
    return statusMap[status] || <Badge bg="light">알 수 없음</Badge>;
  };

  const getIncomeTypeName = (type) => {
    const typeMap = {
      'rental': '임대료',
      'dividend': '배당금',
      'interest': '이자',
      'capital_gain': '자본 이득',
      'other': '기타'
    };
    
    return typeMap[type] || '알 수 없음';
  };

  const getPeriodText = (period) => {
    if (!period) return '없음';
    
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const getFilteredDistributions = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return distributions.filter(dist => 
          ['scheduled'].includes(dist.status) && new Date(dist.distributionDate) > now
        );
      case 'in_progress':
        return distributions.filter(dist => 
          ['in_progress'].includes(dist.status)
        );
      case 'completed':
        return distributions.filter(dist => 
          ['completed'].includes(dist.status)
        );
      case 'cancelled':
        return distributions.filter(dist => 
          ['cancelled', 'failed'].includes(dist.status)
        );
      case 'all':
      default:
        return distributions;
    }
  };

  const showDistributionDetails = (distribution) => {
    setSelectedDistribution(distribution);
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
          <h2 className="mb-4">수익 분배 관리</h2>
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
                  {token && (
                    <>
                      <p><strong>토큰 ID:</strong> {token.tokenId}</p>
                      <p><strong>토큰 심볼:</strong> {token.symbol}</p>
                      <p><strong>총 발행량:</strong> {token.totalSupply.toLocaleString()} 토큰</p>
                    </>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>수익 분배 이력</h4>
            <Button 
              variant="primary" 
              onClick={() => setShowDistributionForm(true)}
              disabled={!property.isTokenized}
            >
              새 수익 분배 생성
            </Button>
          </div>

          {property.isTokenized ? (
            distributions.length > 0 ? (
              <>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-3"
                >
                  <Tab eventKey="upcoming" title="예정된 분배" />
                  <Tab eventKey="in_progress" title="진행 중" />
                  <Tab eventKey="completed" title="완료됨" />
                  <Tab eventKey="cancelled" title="취소됨" />
                  <Tab eventKey="all" title="전체" />
                </Tabs>
                
                {getFilteredDistributions().length > 0 ? (
                  <Table responsive bordered hover>
                    <thead>
                      <tr>
                        <th>수익 유형</th>
                        <th>총 금액</th>
                        <th>분배 일자</th>
                        <th>기간</th>
                        <th>상태</th>
                        <th>수령인</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredDistributions().map((distribution) => (
                        <tr key={distribution._id}>
                          <td>{getIncomeTypeName(distribution.incomeType)}</td>
                          <td>{Number(distribution.totalAmount).toLocaleString()}원</td>
                          <td>{new Date(distribution.distributionDate).toLocaleDateString()}</td>
                          <td>{getPeriodText(distribution.period)}</td>
                          <td>{getStatusBadge(distribution.status)}</td>
                          <td>{distribution.receivers?.length || 0}명</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-info" 
                              className="me-1 mb-1"
                              onClick={() => showDistributionDetails(distribution)}
                            >
                              상세 정보
                            </Button>
                            
                            {distribution.status === 'scheduled' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline-success" 
                                  className="me-1 mb-1"
                                  onClick={() => setConfirmAction({
                                    type: 'execute',
                                    id: distribution._id,
                                    title: '수익 분배 실행',
                                    message: '이 수익 분배를 실행하시겠습니까? 이 작업은 블록체인 트랜잭션을 발생시키며 취소할 수 없습니다.'
                                  })}
                                >
                                  실행
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline-danger" 
                                  className="mb-1"
                                  onClick={() => setConfirmAction({
                                    type: 'cancel',
                                    id: distribution._id,
                                    title: '수익 분배 취소',
                                    message: '이 수익 분배를 취소하시겠습니까?'
                                  })}
                                >
                                  취소
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">
                    선택한 상태의 수익 분배가 없습니다.
                  </Alert>
                )}
              </>
            ) : (
              <Alert variant="info">
                아직 등록된 수익 분배가 없습니다. 새 수익 분배를 생성해주세요.
              </Alert>
            )
          ) : (
            <Alert variant="warning">
              수익 분배를 생성하려면 먼저 부동산을 토큰화해야 합니다.
            </Alert>
          )}
        </>
      )}

      {/* 새 수익 분배 생성 모달 */}
      <Modal show={showDistributionForm} onHide={() => setShowDistributionForm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>새 수익 분배 생성</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <IncomeDistributionForm 
            onSubmit={handleCreateDistribution} 
            onCancel={() => setShowDistributionForm(false)} 
            tokenId={token?.tokenId}
          />
        </Modal.Body>
      </Modal>

      {/* 수익 분배 상세 정보 모달 */}
      <Modal 
        show={!!selectedDistribution} 
        onHide={() => setSelectedDistribution(null)} 
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>수익 분배 상세 정보</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDistribution && (
            <>
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">일반 정보</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>수익 유형:</strong> {getIncomeTypeName(selectedDistribution.incomeType)}</p>
                      <p><strong>총 금액:</strong> {Number(selectedDistribution.totalAmount).toLocaleString()}원</p>
                      <p><strong>분배 일자:</strong> {new Date(selectedDistribution.distributionDate).toLocaleDateString()}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>상태:</strong> {getStatusBadge(selectedDistribution.status)}</p>
                      <p><strong>기간:</strong> {getPeriodText(selectedDistribution.period)}</p>
                      <p><strong>설명:</strong> {selectedDistribution.description || '없음'}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {selectedDistribution.contractCallTransactionHash && (
                <Card className="mb-3">
                  <Card.Header>
                    <h5 className="mb-0">블록체인 정보</h5>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>트랜잭션 해시:</strong> {selectedDistribution.contractCallTransactionHash}</p>
                    {selectedDistribution.blockchainDistributionId && (
                      <p><strong>분배 ID:</strong> {selectedDistribution.blockchainDistributionId}</p>
                    )}
                    {selectedDistribution.completedAt && (
                      <p><strong>완료 시간:</strong> {new Date(selectedDistribution.completedAt).toLocaleString()}</p>
                    )}
                  </Card.Body>
                </Card>
              )}

              <Card>
                <Card.Header>
                  <h5 className="mb-0">수령인 목록</h5>
                </Card.Header>
                <Card.Body>
                  {selectedDistribution.receivers && selectedDistribution.receivers.length > 0 ? (
                    <Table responsive bordered>
                      <thead>
                        <tr>
                          <th>지갑 주소</th>
                          <th>지분</th>
                          <th>금액</th>
                          <th>상태</th>
                          {selectedDistribution.status === 'completed' && (
                            <th>트랜잭션 해시</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDistribution.receivers.map((receiver, index) => (
                          <tr key={index}>
                            <td>{receiver.walletAddress}</td>
                            <td>{receiver.shares} ({(receiver.shares / selectedDistribution.ownershipSnapshot.totalShares * 100).toFixed(2)}%)</td>
                            <td>{Number(receiver.amount).toLocaleString()}원</td>
                            <td>
                              {receiver.status === 'pending' && <Badge bg="secondary">대기 중</Badge>}
                              {receiver.status === 'processing' && <Badge bg="warning">처리 중</Badge>}
                              {receiver.status === 'completed' && <Badge bg="success">완료됨</Badge>}
                              {receiver.status === 'failed' && <Badge bg="danger">실패</Badge>}
                            </td>
                            {selectedDistribution.status === 'completed' && (
                              <td>{receiver.transactionHash || '-'}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      수령인 정보가 없습니다.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedDistribution(null)}>
            닫기
          </Button>
        </Modal.Footer>
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
              if (confirmAction?.type === 'execute') {
                handleExecuteDistribution(confirmAction.id);
              } else if (confirmAction?.type === 'cancel') {
                handleCancelDistribution(confirmAction.id);
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

export default IncomeDistribution; 