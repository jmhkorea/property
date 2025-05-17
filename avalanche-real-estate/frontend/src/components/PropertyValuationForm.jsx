import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import PropTypes from 'prop-types';

const PropertyValuationForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    valuationType: initialData.valuationType || 'initial',
    currentValue: initialData.currentValue || '',
    methodology: initialData.methodology || 'comparative_market_analysis',
    valuationDate: initialData.valuationDate ? new Date(initialData.valuationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    confidenceScore: initialData.confidenceScore || 85,
    notes: initialData.notes || '',
    appraiser: {
      name: initialData.appraiser?.name || '',
      license: initialData.appraiser?.license || '',
      company: initialData.appraiser?.company || ''
    },
    factors: initialData.factors || [
      {
        factorName: '',
        factorType: 'location',
        impact: 'positive',
        valueImpact: 0,
        description: ''
      }
    ]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAppraiserChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      appraiser: {
        ...prev.appraiser,
        [name]: value
      }
    }));
  };

  const handleFactorChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFactors = [...formData.factors];
    updatedFactors[index] = {
      ...updatedFactors[index],
      [name]: name === 'valueImpact' ? Number(value) : value
    };
    
    setFormData(prev => ({
      ...prev,
      factors: updatedFactors
    }));
  };

  const addFactor = () => {
    setFormData(prev => ({
      ...prev,
      factors: [
        ...prev.factors,
        {
          factorName: '',
          factorType: 'location',
          impact: 'positive',
          valueImpact: 0,
          description: ''
        }
      ]
    }));
  };

  const removeFactor = (index) => {
    const updatedFactors = formData.factors.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      factors: updatedFactors
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 폼 데이터 검증
    if (!formData.currentValue || !formData.methodology || !formData.valuationDate) {
      return;
    }
    
    // 요인 데이터 정리
    const cleanedFactors = formData.factors.filter(factor => factor.factorName && factor.description);
    
    const submissionData = {
      ...formData,
      currentValue: Number(formData.currentValue),
      confidenceScore: Number(formData.confidenceScore),
      factors: cleanedFactors,
    };
    
    onSubmit(submissionData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="valuationType">
            <Form.Label>평가 유형</Form.Label>
            <Form.Select 
              name="valuationType"
              value={formData.valuationType}
              onChange={handleChange}
              required
            >
              <option value="initial">초기 평가</option>
              <option value="periodic">정기 평가</option>
              <option value="special">특별 평가</option>
              <option value="renovation">리모델링 후 평가</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="currentValue">
            <Form.Label>현재 가치 (원)</Form.Label>
            <Form.Control
              type="number"
              name="currentValue"
              value={formData.currentValue}
              onChange={handleChange}
              min="0"
              required
              placeholder="예: 500000000"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="methodology">
            <Form.Label>평가 방법론</Form.Label>
            <Form.Select
              name="methodology"
              value={formData.methodology}
              onChange={handleChange}
              required
            >
              <option value="comparative_market_analysis">비교 시장 분석</option>
              <option value="income_approach">수익 접근법</option>
              <option value="cost_approach">비용 접근법</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="valuationDate">
            <Form.Label>평가 일자</Form.Label>
            <Form.Control
              type="date"
              name="valuationDate"
              value={formData.valuationDate}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3" controlId="confidenceScore">
        <Form.Label>신뢰도 점수 ({formData.confidenceScore})</Form.Label>
        <Form.Range
          name="confidenceScore"
          value={formData.confidenceScore}
          onChange={handleChange}
          min="0"
          max="100"
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="notes">
        <Form.Label>평가 노트</Form.Label>
        <Form.Control
          as="textarea"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="평가에 대한 추가 설명이나 참고 사항을 입력하세요."
        />
      </Form.Group>

      <Card className="mb-3">
        <Card.Header>평가사 정보</Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group controlId="appraiserName">
                <Form.Label>이름</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.appraiser.name}
                  onChange={handleAppraiserChange}
                  required
                  placeholder="평가사 이름"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="appraiserLicense">
                <Form.Label>자격증 번호</Form.Label>
                <Form.Control
                  type="text"
                  name="license"
                  value={formData.appraiser.license}
                  onChange={handleAppraiserChange}
                  required
                  placeholder="자격증 번호"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="appraiserCompany">
                <Form.Label>소속 회사</Form.Label>
                <Form.Control
                  type="text"
                  name="company"
                  value={formData.appraiser.company}
                  onChange={handleAppraiserChange}
                  required
                  placeholder="소속 회사"
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">평가 요인</h5>
          <Button variant="outline-primary" size="sm" onClick={addFactor}>
            요인 추가
          </Button>
        </Card.Header>
        <Card.Body>
          {formData.factors.map((factor, index) => (
            <div key={index} className="p-3 border rounded mb-3">
              <div className="d-flex justify-content-between mb-2">
                <h6>요인 #{index + 1}</h6>
                {formData.factors.length > 1 && (
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => removeFactor(index)}
                  >
                    삭제
                  </Button>
                )}
              </div>
              
              <Row className="mb-2">
                <Col md={6}>
                  <Form.Group controlId={`factorName-${index}`}>
                    <Form.Label>요인 이름</Form.Label>
                    <Form.Control
                      type="text"
                      name="factorName"
                      value={factor.factorName}
                      onChange={(e) => handleFactorChange(index, e)}
                      required
                      placeholder="예: 위치, 시설, 교통 등"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId={`factorType-${index}`}>
                    <Form.Label>요인 유형</Form.Label>
                    <Form.Select
                      name="factorType"
                      value={factor.factorType}
                      onChange={(e) => handleFactorChange(index, e)}
                      required
                    >
                      <option value="location">위치</option>
                      <option value="condition">건물 상태</option>
                      <option value="market">시장 상황</option>
                      <option value="facilities">시설</option>
                      <option value="environment">주변 환경</option>
                      <option value="legal">법적 요인</option>
                      <option value="other">기타</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-2">
                <Col md={6}>
                  <Form.Group controlId={`impact-${index}`}>
                    <Form.Label>영향</Form.Label>
                    <Form.Select
                      name="impact"
                      value={factor.impact}
                      onChange={(e) => handleFactorChange(index, e)}
                      required
                    >
                      <option value="positive">긍정적</option>
                      <option value="negative">부정적</option>
                      <option value="neutral">중립</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId={`valueImpact-${index}`}>
                    <Form.Label>가치 영향 (-10 ~ +10)</Form.Label>
                    <Form.Control
                      type="number"
                      name="valueImpact"
                      value={factor.valueImpact}
                      onChange={(e) => handleFactorChange(index, e)}
                      min="-10"
                      max="10"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group controlId={`description-${index}`}>
                <Form.Label>설명</Form.Label>
                <Form.Control
                  as="textarea"
                  name="description"
                  value={factor.description}
                  onChange={(e) => handleFactorChange(index, e)}
                  rows={2}
                  required
                  placeholder="이 요인이 부동산 가치에 어떤 영향을 미치는지 설명하세요."
                />
              </Form.Group>
            </div>
          ))}
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onCancel} className="me-2">
          취소
        </Button>
        <Button variant="primary" type="submit">
          저장
        </Button>
      </div>
    </Form>
  );
};

PropertyValuationForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default PropertyValuationForm; 