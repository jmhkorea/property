import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';
import axios from 'axios';

const IncomeDistributionForm = ({ onSubmit, onCancel, tokenId, initialData = {} }) => {
  const [formData, setFormData] = useState({
    incomeType: initialData.incomeType || 'rental',
    totalAmount: initialData.totalAmount || '',
    description: initialData.description || '',
    period: {
      start: initialData.period?.start ? new Date(initialData.period.start).toISOString().split('T')[0] : '',
      end: initialData.period?.end ? new Date(initialData.period.end).toISOString().split('T')[0] : ''
    },
    distributionDate: initialData.distributionDate ? new Date(initialData.distributionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const [ownershipSnapshot, setOwnershipSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOwnershipData = async () => {
      if (!tokenId) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(`/api/tokens/${tokenId}/ownership`);
        setOwnershipSnapshot(response.data);
        
        setLoading(false);
      } catch (err) {
        setError('소유권 정보를 가져오는 중 오류가 발생했습니다.');
        setLoading(false);
        console.error('Error fetching ownership data:', err);
      }
    };
    
    fetchOwnershipData();
  }, [tokenId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePeriodChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      period: {
        ...prev.period,
        [name]: value
      }
    }));
  };

  const getTotalShares = () => {
    if (!ownershipSnapshot) return 0;
    return ownershipSnapshot.totalShares;
  };

  const calculateReceiverAmount = (shares) => {
    if (!formData.totalAmount) return 0;
    const totalShares = getTotalShares();
    if (totalShares === 0) return 0;
    
    const sharePercentage = shares / totalShares;
    return Math.floor(Number(formData.totalAmount) * sharePercentage);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 폼 데이터 검증
    if (!formData.totalAmount || !formData.period.start || !formData.period.end || !formData.distributionDate) {
      setError('모든 필수 필드를 입력해주세요.');
      return;
    }
    
    if (!ownershipSnapshot) {
      setError('소유권 정보를 불러올 수 없습니다.');
      return;
    }
    
    // 수령인 목록 생성
    const receivers = ownershipSnapshot.ownershipDistribution.map(owner => ({
      walletAddress: owner.walletAddress,
      user: owner.user || null,
      shares: owner.shares,
      amount: calculateReceiverAmount(owner.shares),
      status: 'pending'
    }));
    
    const submissionData = {
      ...formData,
      totalAmount: Number(formData.totalAmount),
      ownershipSnapshot: {
        snapshotDate: new Date(),
        totalShares: ownershipSnapshot.totalShares,
        ownershipDistribution: ownershipSnapshot.ownershipDistribution
      },
      receivers
    };
    
    onSubmit(submissionData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="incomeType">
            <Form.Label>수익 유형</Form.Label>
            <Form.Select 
              name="incomeType"
              value={formData.incomeType}
              onChange={handleChange}
              required
            >
              <option value="rental">임대료</option>
              <option value="dividend">배당금</option>
              <option value="interest">이자</option>
              <option value="capital_gain">자본 이득</option>
              <option value="other">기타</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="totalAmount">
            <Form.Label>총 금액 (원)</Form.Label>
            <Form.Control
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              min="0"
              required
              placeholder="예: 1000000"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="periodStart">
            <Form.Label>기간 시작일</Form.Label>
            <Form.Control
              type="date"
              name="start"
              value={formData.period.start}
              onChange={handlePeriodChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="periodEnd">
            <Form.Label>기간 종료일</Form.Label>
            <Form.Control
              type="date"
              name="end"
              value={formData.period.end}
              onChange={handlePeriodChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3" controlId="distributionDate">
        <Form.Label>분배 실행일</Form.Label>
        <Form.Control
          type="date"
          name="distributionDate"
          value={formData.distributionDate}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="description">
        <Form.Label>설명</Form.Label>
        <Form.Control
          as="textarea"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          placeholder="이 수익 분배에 대한 설명을 입력하세요."
        />
      </Form.Group>

      <Card className="mb-3">
        <Card.Header>
          <h5 className="mb-0">소유권 분포 및 수익 분배 정보</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" />
              <p className="mt-2">소유권 정보를 로딩 중입니다...</p>
            </div>
          ) : ownershipSnapshot ? (
            <>
              <div className="mb-3">
                <p className="mb-1"><strong>총 지분:</strong> {ownershipSnapshot.totalShares.toLocaleString()}</p>
                <p className="mb-1"><strong>소유자 수:</strong> {ownershipSnapshot.ownershipDistribution.length}명</p>
                <p className="mb-0"><strong>스냅샷 날짜:</strong> {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>지갑 주소</th>
                      <th>지분</th>
                      <th>비율</th>
                      <th>분배 금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownershipSnapshot.ownershipDistribution.map((owner, index) => {
                      const percentage = (owner.shares / ownershipSnapshot.totalShares * 100).toFixed(2);
                      const amount = calculateReceiverAmount(owner.shares);
                      
                      return (
                        <tr key={index}>
                          <td>
                            <span className="text-truncate d-inline-block" style={{maxWidth: '150px'}}>
                              {owner.walletAddress}
                            </span>
                          </td>
                          <td>{owner.shares.toLocaleString()}</td>
                          <td>{percentage}%</td>
                          <td>{amount.toLocaleString()}원</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : error ? (
            <Alert variant="danger">
              {error}
            </Alert>
          ) : (
            <Alert variant="warning">
              소유권 정보를 불러올 수 없습니다.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onCancel} className="me-2">
          취소
        </Button>
        <Button 
          variant="primary" 
          type="submit"
          disabled={loading || !ownershipSnapshot}
        >
          수익 분배 생성
        </Button>
      </div>
    </Form>
  );
};

IncomeDistributionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  tokenId: PropTypes.number,
  initialData: PropTypes.object
};

export default IncomeDistributionForm; 