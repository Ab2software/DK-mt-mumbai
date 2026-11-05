import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, Trophy, Wallet, MessageCircle } from 'lucide-react';

const BottomNav = ({ themeColor = 'blue' }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const activeColor = '#043490';
  const inactiveColor = '#64748B';

  const navItems = [
    {
      id: 'bid-history',
      path: '/bid-history',
      label: 'Bid Logs',
      icon: History
    },
    {
      id: 'win-history',
      path: '/win-history',
      label: 'Win Logs',
      icon: Trophy
    },
    {
      id: 'home',
      path: '/',
      label: 'Home',
      icon: Home,
      isCenter: true
    },
    {
      id: 'wallet',
      path: '/wallet-history',
      altPaths: ['/wallet'],
      label: 'Wallet',
      icon: Wallet
    },
    {
      id: 'support',
      path: '/support',
      label: 'Support',
      icon: MessageCircle
    }
  ];

  return (
    <footer className="bottom-nav-container">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = item.altPaths
          ? (currentPath === item.path || item.altPaths.includes(currentPath))
          : currentPath === item.path;

        if (item.isCenter) {
          return (
            <Link
              key={item.id}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                flex: 1,
                height: '100%',
                color: isActive ? activeColor : inactiveColor,
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-18px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #053FA8 0%, #03256C 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(4, 52, 144, 0.35)',
                  border: '3px solid #ffffff',
                  color: '#ffffff',
                  transition: 'transform 0.2s ease'
                }}>
                  <Home size={22} />
                </div>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: isActive ? '800' : '600',
                letterSpacing: '0.01em',
                lineHeight: 1,
                marginTop: '4px',
                color: isActive ? activeColor : inactiveColor
              }}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.id}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              flex: 1,
              height: '100%',
              color: isActive ? activeColor : inactiveColor,
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}>
              <IconComponent size={20} style={{ strokeWidth: isActive ? 2.5 : 2 }} />
            </div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: isActive ? '800' : '600',
              letterSpacing: '0.01em',
              lineHeight: 1,
              marginTop: '4px'
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </footer>
  );
};

export default BottomNav;
