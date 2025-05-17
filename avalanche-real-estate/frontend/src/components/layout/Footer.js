import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h1 className="text-white font-bold text-xl">AVAX Estate</h1>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                아발란체 블록체인을 활용한 부동산 토큰화 플랫폼으로 누구나 쉽게 부동산 투자에 참여할 수 있습니다.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">서비스</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/properties" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    부동산 목록
                  </Link>
                </li>
                <li>
                  <Link to="/market" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    지분 마켓
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    시장 분석
                  </Link>
                </li>
                <li>
                  <Link to="/register-property" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    부동산 등록
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">정보</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    회사 소개
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    자주 묻는 질문
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    개인정보처리방침
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">연락처</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  02-123-4567
                </li>
                <li className="flex items-center text-gray-300 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  info@avaxestate.com
                </li>
                <li className="flex items-center text-gray-300 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  서울특별시 강남구 테헤란로 123
                </li>
              </ul>
              
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  <span className="sr-only">Telegram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.05 1.577c-.393-.016-.784.08-1.117.235-.484.186-4.92 1.902-9.41 3.64-2.26.873-4.518 1.746-6.256 2.415-1.737.67-3.045 1.168-3.114 1.192-.46.16-1.067.362-1.356.77-.302.43-.282 1.053-.23 1.5.055.468.33.888.714.064.026.07.036.136.065.29.153.616.246.957.263.047.002.095.003.146.003.28 0 .585-.058.856-.14.032-.007.06-.012.086-.016.43-.078 1.784-.585 1.784-.585l.862-.28s11.19-4.59 11.69-5.09c.074-.073.142-.116.21-.14.124-.04.25-.016.33.112.083.13.055.634-.124 1.052-.18.417-6.954 6.696-6.954 6.696l-.427.41s-.316.317-.22.623c.06.198.226.34.442.43.155.066.178.05 1.137.586.402.225.402.236.556.354.155.117.302.254.42.415.117.16.21.35.296.557.085.204.153.437.21.687.058.25.106.514.144.79.036.274.06.56.069.855.03.873-.149 1.805-.385 2.752-.236.948-.52 1.903-.748 2.865-.23.962-.407 1.928-.5 2.905-.094.976-.175 1.99-.099 2.947.076.956.324 1.814.591 2.635.268.82.552 1.607.869 2.362.318.755.669 1.478 1.096 2.16.167.267.335.527.522.783.187.256.403.497.613.74l.307.33.327.306.347.282.366.256.385.23.4.2.413.168.42.134.422.094.417.05.405.002.38-.05.352-.106.314-.17.278-.229.238-.288.192-.35.146-.413.1-.476.05-.544-.001-.61-.045-.67-.093-.728-.14-.784-.18-.834-.219-.877-.258-.912-.296-.942-.328-.968-.357-.983-.385-.997-.405-.997-.418-.994-.428-.98-.43-.958-.427-.932-.417-.896-.402-.854-.381-.802-.355-.741-.324-.669-.29-.588-.25-.5-.207-.4-.16-.3-.113-.183-.217-.233-.274-.216-.27-.149-.254-.102-.225-.067-.179-.038-.126-.02.009-.198.044-.384.074-.574.097-.765.113-.954.125-1.145.133-1.334.14-1.525.145-1.715.149-1.902.152-2.086.154-2.266.155-2.442.155-2.611.155-2.772.154-2.925.151-3.065.148-3.193.144-3.306.138-3.402.133-3.481.127-3.542.12-3.584.113-3.604.107-3.602.1-3.575.093-3.527.086-3.451.08-3.351.073-3.222.066-3.063.06-2.869.053-2.642.046-2.376.039-2.069.032-1.71.022-1.31z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-blue-800 py-6">
          <p className="text-center text-sm text-gray-300">
            &copy; {currentYear} AVAX Estate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 