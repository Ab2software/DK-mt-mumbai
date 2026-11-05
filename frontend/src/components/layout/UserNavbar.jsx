import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, PlusCircle, Wallet } from 'lucide-react';
import api from '../../utils/api';

const UserNavbar = ({ onOpenSidebar, wallet = '0', themeColor = 'blue', onThemeChange, onLogout }) => {
  const [appName, setAppName] = useState('Bharat Matka');

  useEffect(() => {
    api.get('/app-info').then(res => {
      if (res.data?.success === '1' && res.data.data?.app_name) {
        setAppName(res.data.data.app_name);
      }
    }).catch(() => {});
  }, []);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'linear-gradient(135deg, #053FA8 0%, #03256C 100%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 1000,
      boxShadow: '0 4px 18px rgba(4, 52, 144, 0.28)'
    }}>
      {/* Left: Hamburger Menu & Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Toggle Menu"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            transition: 'all 0.2s',
            outline: 'none',
            color: '#ffffff'
          }}
        >
          <Menu size={22} />
        </button>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)'
          }}>
            <img
              src="/img/logo.png"
              alt={`${appName} Logo`}
              style={{
                height: '38px',
                width: 'auto',
                maxWidth: '140px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.src = '/img/logo.png';
              }}
            />
          </div>
        </Link>
      </div>

      {/* Right: Quick Action Buttons & Balance Chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link
          to="/add-fund"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            height: '36px',
            padding: '0 14px',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #FF7A00 0%, #E65A00 100%)',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: '800',
            textDecoration: 'none',
            boxShadow: '0 3px 12px rgba(255, 107, 0, 0.4)',
            boxSizing: 'border-box'
          }}
        >
          <PlusCircle size={16} />
          <span>Deposit</span>
        </Link>

        <Link
          to="/wallet-history"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            height: '36px',
            padding: '0 14px',
            borderRadius: '50px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            color: '#ffffff',
            fontSize: '0.88rem',
            fontWeight: '800',
            textDecoration: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            boxSizing: 'border-box'
          }}
        >
          <Wallet size={16} style={{ color: '#FCD34D' }} />
          <span>₹ {wallet}</span>
        </Link>
      </div>
    </header>
  );
};

export default UserNavbar;
