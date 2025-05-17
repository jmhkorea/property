import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { startMockServiceWorker } from './mocks/browser';
import { WalletProvider } from './contexts/WalletContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';

// 개발 환경에서만 MSW 활성화
if (process.env.NODE_ENV === 'development') {
  startMockServiceWorker();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);

// 성능 측정을 위한 웹 바이탈
reportWebVitals(); 