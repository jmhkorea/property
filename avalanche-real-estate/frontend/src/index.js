import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { startMockServiceWorker } from './mocks/browser';
import 'bootstrap/dist/css/bootstrap.min.css';

// 로컬 환경 및 GitHub Pages 환경 모두에서 MSW 활성화
// GitHub Pages에서는 개발 모드가 아니더라도 MSW를 사용
startMockServiceWorker();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 성능 측정을 위한 웹 바이탈
reportWebVitals(); 