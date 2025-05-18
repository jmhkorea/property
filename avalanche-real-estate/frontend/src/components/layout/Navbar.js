import React, { useState, useContext, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { MenuIcon, XIcon, BellIcon } from '@heroicons/react/outline';
import { AuthContext } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext.jsx';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { account, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  // 내비게이션 아이템
  const navigation = [
    { name: '홈', href: '/', current: true },
    { name: '마켓플레이스', href: '/properties', current: false },
    { name: '내 포트폴리오', href: '/my-portfolio', current: false },
    { name: 'DeFi', href: '/defi', current: false },
    { name: 'NFT', href: '/nft', current: false },
    { name: '학습하기', href: '/learn', current: false },
    { name: '대시보드', href: '/dashboard', current: false },
  ];

  // 로그인 상태에 따른 사용자 메뉴
  const userNavigation = isAuthenticated
    ? [
        { name: '대시보드', href: '/dashboard' },
        { name: '내 부동산', href: '/my-properties' },
        { name: '내 지분', href: '/my-shares' },
        { name: '설정', href: '/settings' },
        { name: '로그아웃', href: '#', onClick: logout },
      ]
    : [
        { name: '로그인', href: '/login' },
        { name: '회원가입', href: '/register' },
      ];

  // 현재 경로에 따라 navigation 항목의 current 속성 업데이트
  const updateNavigation = () => {
    const path = window.location.pathname;
    return navigation.map(item => ({
      ...item,
      current: path === item.href,
    }));
  };

  // 클래스 결합 유틸리티 함수
  const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ');
  };

  // 지갑 주소 포맷팅
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Disclosure as="nav" className="bg-gradient-to-r from-blue-900 to-indigo-800 shadow-lg">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to="/" className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h1 className="text-white font-bold text-xl">AVAX Estate</h1>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {updateNavigation().map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? 'bg-indigo-700 text-white'
                            : 'text-gray-200 hover:bg-indigo-600 hover:text-white',
                          'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200'
                        )}
                        aria-current={item.current ? 'page' : undefined}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  {/* 지갑 연결 버튼 */}
                  <button
                    onClick={account ? disconnectWallet : connectWallet}
                    disabled={isConnecting}
                    className={classNames(
                      account 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700',
                      'text-white px-4 py-1.5 rounded-full text-sm font-medium mr-4 transition-all duration-200 shadow-md hover:shadow-lg flex items-center'
                    )}
                  >
                    {isConnecting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        연결 중...
                      </>
                    ) : account ? (
                      <>
                        <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                        {formatAddress(account)}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Wallet Connect
                      </>
                    )}
                  </button>

                  {/* 알림 버튼 */}
                  {isAuthenticated && (
                    <button
                      className="bg-blue-800 p-2 rounded-full text-gray-300 hover:text-white focus:outline-none transition-colors duration-200 hover:bg-blue-700"
                      onClick={() => navigate('/notifications')}
                    >
                      <span className="sr-only">알림 보기</span>
                      <div className="relative">
                        <BellIcon className="h-5 w-5" aria-hidden="true" />
                        {notificationCount > 0 && (
                          <span className="flex h-2 w-2 absolute top-0 right-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                      </div>
                    </button>
                  )}

                  {/* 프로필 드롭다운 */}
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="max-w-xs bg-blue-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-800 focus:ring-white transition-all duration-200 hover:bg-blue-700">
                        <span className="sr-only">사용자 메뉴 열기</span>
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
                          {user?.name?.charAt(0) || '?'}
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        {isAuthenticated && (
                          <div className="px-4 py-2 text-sm text-gray-700 border-b">
                            <p className="font-medium">{user?.name}</p>
                            <p className="text-gray-500 text-xs">{user?.email}</p>
                          </div>
                        )}
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <Link
                                to={item.href}
                                onClick={item.onClick}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                                )}
                              >
                                {item.name}
                              </Link>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                {/* 모바일 메뉴 버튼 */}
                <Disclosure.Button className="bg-blue-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-blue-700 focus:outline-none transition-colors duration-200">
                  <span className="sr-only">메뉴 열기</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* 모바일 메뉴 */}
          <Disclosure.Panel className="md:hidden bg-indigo-900">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {updateNavigation().map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-indigo-700 text-white'
                      : 'text-gray-300 hover:bg-indigo-600 hover:text-white',
                    'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-indigo-700">
              {isAuthenticated ? (
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-800 flex items-center justify-center text-white font-medium">
                      {user?.name?.charAt(0) || '?'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-white">
                      {user?.name}
                    </div>
                    <div className="text-sm font-medium leading-none text-gray-400 mt-1">
                      {user?.email}
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="mt-3 px-2 space-y-1">
                {/* 모바일 지갑 연결 버튼 */}
                <button
                  onClick={account ? disconnectWallet : connectWallet}
                  disabled={isConnecting}
                  className={classNames(
                    account ? 'bg-green-700' : 'bg-blue-700',
                    'w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-opacity-90 flex items-center'
                  )}
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      연결 중...
                    </>
                  ) : account ? (
                    <>
                      <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                      {formatAddress(account)}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Wallet Connect
                    </>
                  )}
                </button>

                {userNavigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    onClick={item.onClick}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar; 