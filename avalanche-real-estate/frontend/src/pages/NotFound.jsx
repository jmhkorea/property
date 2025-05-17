import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-indigo-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-800 mt-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-600 mt-2 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
          <Link
            to="/"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            홈으로 돌아가기
          </Link>
          <Link
            to="/properties"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            부동산 목록 보기
          </Link>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-gray-500">
          문제가 계속되면 <Link to="/contact" className="text-indigo-600 hover:text-indigo-800">고객센터</Link>로 문의해주세요.
        </p>
      </div>
    </div>
  );
};

export default NotFound; 