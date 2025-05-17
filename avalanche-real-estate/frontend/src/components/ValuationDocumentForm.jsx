import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';

const ValuationDocumentForm = ({ valuationId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    documentType: 'appraisal_report',
    fileUrl: '',
    isUploading: false,
    uploadError: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      setFormData(prev => ({
        ...prev,
        uploadError: '파일 크기가 10MB를 초과할 수 없습니다.'
      }));
      return;
    }

    // 지원되는 파일 형식 검증
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!supportedTypes.includes(file.type)) {
      setFormData(prev => ({
        ...prev,
        uploadError: '지원되지 않는 파일 형식입니다. PDF, JPEG, PNG, DOC, DOCX 형식만 지원됩니다.'
      }));
      return;
    }

    try {
      setFormData(prev => ({
        ...prev,
        isUploading: true,
        uploadError: ''
      }));

      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('valuationId', valuationId);

      // 파일 업로드 API 호출 (실제 구현 시에는 해당 API를 사용하세요)
      // const response = await axios.post('/api/upload', formData);
      
      // 임시로 성공 처리 (실제 구현에서는 이 부분을 서버 응답으로 대체하세요)
      const mockResponse = {
        success: true,
        fileUrl: `https://example.com/files/${file.name}`
      };

      setFormData(prev => ({
        ...prev,
        fileUrl: mockResponse.fileUrl,
        isUploading: false
      }));
    } catch (err) {
      setFormData(prev => ({
        ...prev,
        uploadError: '파일 업로드 중 오류가 발생했습니다.',
        isUploading: false
      }));
      console.error('Error uploading file:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 폼 데이터 검증
    if (!formData.title || !formData.documentType) {
      setFormData(prev => ({
        ...prev,
        uploadError: '모든 필수 필드를 입력해주세요.'
      }));
      return;
    }
    
    if (!formData.fileUrl) {
      setFormData(prev => ({
        ...prev,
        uploadError: '문서 파일을 업로드해주세요.'
      }));
      return;
    }
    
    const documentData = {
      title: formData.title,
      documentType: formData.documentType,
      fileUrl: formData.fileUrl
    };
    
    onSubmit(documentData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {formData.uploadError && (
        <Alert variant="danger" className="mb-3">
          {formData.uploadError}
        </Alert>
      )}
      
      <Form.Group className="mb-3" controlId="title">
        <Form.Label>문서 제목</Form.Label>
        <Form.Control
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="문서 제목을 입력하세요"
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="documentType">
        <Form.Label>문서 유형</Form.Label>
        <Form.Select
          name="documentType"
          value={formData.documentType}
          onChange={handleChange}
          required
        >
          <option value="appraisal_report">평가 보고서</option>
          <option value="property_inspection">부동산 검사 보고서</option>
          <option value="market_analysis">시장 분석 자료</option>
          <option value="comparables">비교 대상 자료</option>
          <option value="income_analysis">수입 분석 자료</option>
          <option value="cost_analysis">비용 분석 자료</option>
          <option value="supporting_document">기타 증빙 자료</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="file">
        <Form.Label>문서 파일</Form.Label>
        <Form.Control
          type="file"
          onChange={handleFileChange}
          disabled={formData.isUploading}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <Form.Text className="text-muted">
          최대 파일 크기: 10MB. 지원 형식: PDF, JPEG, PNG, DOC, DOCX
        </Form.Text>
      </Form.Group>

      {formData.fileUrl && (
        <div className="mb-3">
          <Alert variant="success">
            파일이 성공적으로 업로드되었습니다.
          </Alert>
        </div>
      )}

      <Row>
        <Col className="d-flex justify-content-end">
          <Button variant="secondary" onClick={onCancel} className="me-2" disabled={formData.isUploading}>
            취소
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={formData.isUploading || !formData.fileUrl}
          >
            {formData.isUploading ? '업로드 중...' : '저장'}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

ValuationDocumentForm.propTypes = {
  valuationId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ValuationDocumentForm; 