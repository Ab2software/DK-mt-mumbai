import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import UserNavbar from './UserNavbar';
import SidebarDrawer from './SidebarDrawer';
import BottomNav from './BottomNav';
import LockScreen from './LockScreen';
import PullToRefresh from '../common/PullToRefresh';
import QuizApp from '../../pages/QuizApp';
import api from '../../utils/api';

const UserLayout = ({ children, setAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('auth_theme_color') || 'blue');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [userData, setUserData] = useState({
    name: localStorage.getItem('name') || '',
    phone: localStorage.getItem('phone') || '',
    email: '',
    wallet: '0'
  });
  const [wpNumber, setWpNumber] = useState('');
  const [mpinStatus, setMpinStatus] = useState(() => localStorage.getItem('app_mpin_status') || '0');
  const [autoActiveStatus, setAutoActiveStatus] = useState('1');
  const [isLocked, setIsLocked] = useState(() => {
    const savedStatus = localStorage.getItem('app_mpin_status');
    if (savedStatus !== '1') return false;
    return sessionStorage.getItem('mpin_unlocked') !== 'true';
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePageRefresh = async () => {
    try {
      await loadUserData();
      window.dispatchEvent(new CustomEvent('app_refresh'));
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  const loadUserData = async () => {
    try {
      const [walletRes, profileRes, appRes] = await Promise.all([
        api.get('/wallet/info').catch(() => null),
        api.get('/profile').catch(() => null),
        api.get('/app-info').catch(() => null)
      ]);

      const rawWallet = walletRes?.data?.data?.wallet ?? profileRes?.data?.data?.wallet;
      const wallet = (rawWallet !== undefined && rawWallet !== null) ? String(rawWallet) : '0';
      const prof = profileRes?.data?.data || walletRes?.data?.data || {};
      const appInfo = appRes?.data?.data || {};

      // Check if user account is inactive
      if (prof.status === '0' || prof.status === 0 || walletRes?.data?.is_inactive || profileRes?.data?.is_inactive) {
        handleLogout();
        navigate('/login?error=inactive', { replace: true });
        return;
      }

      const currentMpinStatus = (appInfo.mpin_status !== undefined && appInfo.mpin_status !== null)
        ? String(appInfo.mpin_status)
        : (walletRes?.data?.data?.mpin_status !== undefined && walletRes?.data?.data?.mpin_status !== null)
          ? String(walletRes?.data?.data?.mpin_status)
          : '0';
      setMpinStatus(currentMpinStatus);
      localStorage.setItem('app_mpin_status', currentMpinStatus);
      if (currentMpinStatus !== '1') {
        sessionStorage.setItem('mpin_unlocked', 'true');
        setIsLocked(false);
      }

      if (appInfo.auto_active_status !== undefined && appInfo.auto_active_status !== null) {
        setAutoActiveStatus(String(appInfo.auto_active_status));
      }

      setUserData({
        name: prof.name || localStorage.getItem('name') || 'Bharat Matka Player',
        phone_number: prof.phone_number || prof.phone || localStorage.getItem('phone') || '',
        phone: prof.phone || localStorage.getItem('phone') || '',
        email: prof.email || '',
        wallet: wallet,
        status: String(prof.status ?? '1'),
        betting_status: String(prof.betting_status ?? walletRes?.data?.data?.betting_status ?? '1'),
        transfer_status: String(prof.transfer_status ?? walletRes?.data?.data?.transfer_status ?? '1')
      });

      if (appInfo.wp_mobile || appInfo.mobile) {
        setWpNumber(appInfo.wp_mobile || appInfo.mobile);
      }

      if (prof.name) localStorage.setItem('name', prof.name);
      if (prof.phone) localStorage.setItem('phone', prof.phone);
    } catch (err) {
      console.error('Error loading user layout data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    const interval = setInterval(loadUserData, 15000); // 15s refresh

    const handleWalletUpdated = (e) => {
      if (e?.detail?.balance !== undefined) {
        setUserData(prev => ({ ...prev, wallet: String(e.detail.balance) }));
      }
      loadUserData();
    };

    const onThemeChange = () => {
      setThemeColor(localStorage.getItem('auth_theme_color') || 'gold');
    };

    const isMobileDevice = () => {
      if (typeof window === 'undefined') return false;
      const ua = navigator.userAgent || navigator.vendor || window.opera || '';
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|wv/i.test(ua) || (window.innerWidth <= 768);
    };

    let lockTimeoutId = null;

    const handleLockTrigger = () => {
      const activeStatus = localStorage.getItem('app_mpin_status') || mpinStatus;
      if (String(activeStatus) !== '1') {
        setIsLocked(false);
        return;
      }
      sessionStorage.removeItem('mpin_unlocked');
      setIsLocked(true);
    };

    const handleVisibilityChange = () => {
      // Only lock on mobile devices & Android WebViews
      if (!isMobileDevice()) return;
      const activeStatus = localStorage.getItem('app_mpin_status') || mpinStatus;
      if (String(activeStatus) !== '1') return;

      if (document.visibilityState === 'hidden') {
        // Debounce lock trigger to prevent nuisance locking when opening native pickers or brief app pauses
        lockTimeoutId = setTimeout(() => {
          handleLockTrigger();
        }, 1500);
      } else if (document.visibilityState === 'visible') {
        if (lockTimeoutId) {
          clearTimeout(lockTimeoutId);
          lockTimeoutId = null;
        }
      }
    };

    window.addEventListener('wallet_updated', handleWalletUpdated);
    window.addEventListener('storage', onThemeChange);
    window.addEventListener('focus', loadUserData);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (lockTimeoutId) clearTimeout(lockTimeoutId);
      clearInterval(interval);
      window.removeEventListener('wallet_updated', handleWalletUpdated);
      window.removeEventListener('storage', onThemeChange);
      window.removeEventListener('focus', loadUserData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Lock body scroll when LockScreen is active
  useEffect(() => {
    if (mpinStatus === '1' && isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mpinStatus, isLocked]);

  const changeTheme = (newColor) => {
    setThemeColor(newColor);
    localStorage.setItem('auth_theme_color', newColor);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mpin_unlocked');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('name');
    localStorage.removeItem('phone');
    if (setAuth) setAuth(false);
    navigate('/login', { replace: true });
  };

  // Fetch unread in-app chat count
  useEffect(() => {
    const phone = localStorage.getItem('phone');
    if (!phone) return;
    const checkUnread = () => {
      api.get(`/chat/unread-count?phone=${phone}`).then(res => {
        if (res.data?.success === '1') {
          setUnreadChatCount(Number(res.data.count) || 0);
        }
      }).catch(() => {});
    };
    checkUnread();
    const interval = setInterval(checkUnread, 12000);
    return () => clearInterval(interval);
  }, []);

  if (dataLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0f172a',
        padding: '20px'
      }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          border: '3px solid rgba(4, 52, 144, 0.2)',
          borderTopColor: '#043490',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px'
        }} />
        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '600' }}>
          Loading application...
        </span>
      </div>
    );
  }

  if (String(userData.betting_status) === '0') {
    return <QuizApp onLogout={handleLogout} wpNumber={wpNumber} />;
  }

  return (
    <div className={`app-theme-${themeColor}`} style={{
      minHeight: '100vh',
      backgroundColor: 'var(--app-bg, #f4f6fa)',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--color-text-primary, #0f172a)',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background 0.4s ease'
    }}>
      {/* Background Decorative Subtle Ambient Orbs */}
      <div style={{
        position: 'fixed',
        top: '-120px',
        left: '-120px',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'rgba(4, 52, 144, 0.04)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-120px',
        right: '-120px',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'rgba(255, 118, 7, 0.04)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Fixed Top Navbar */}
      <UserNavbar
        onOpenSidebar={() => setSidebarOpen(true)}
        wallet={userData.wallet}
        themeColor={themeColor}
        onThemeChange={changeTheme}
        onLogout={handleLogout}
      />

      {/* Slide-out Left Drawer */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={userData}
        onLogout={handleLogout}
        themeColor={themeColor}
        onThemeChange={changeTheme}
      />

      {/* Main Content Area with Pull-to-Refresh */}
      <main style={{
        flex: 1,
        paddingTop: '64px',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        position: 'relative',
        zIndex: 1
      }}>
        <PullToRefresh onRefresh={handlePageRefresh} themeColor={themeColor}>
          <div key={refreshKey}>
            {children}
          </div>
        </PullToRefresh>
      </main>

      {/* Floating Direct WhatsApp Connect Button */}
      {location.pathname !== '/support' && (
        <a
          href={`https://wa.me/${String(wpNumber || '').replace(/\D/g, '').startsWith('91') && String(wpNumber || '').replace(/\D/g, '').length > 10 ? String(wpNumber || '').replace(/\D/g, '') : (String(wpNumber || '').replace(/\D/g, '') ? `91${String(wpNumber || '').replace(/\D/g, '')}` : '919876543210')}?text=${encodeURIComponent('Hello Bharat Matka Support, I need assistance.')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))',
            right: '16px',
            zIndex: 998,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '50px',
            fontWeight: '800',
            fontSize: '0.86rem',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.25s ease'
          }}
          title="Direct WhatsApp Support"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.03C8.92 7.03 8.61 7.1 8.36 7.37C8.11 7.64 7.41 8.3 7.41 9.64C7.41 10.98 8.39 12.27 8.52 12.45C8.66 12.63 10.43 15.36 13.15 16.53C13.79 16.81 14.3 16.98 14.69 17.11C15.34 17.31 15.93 17.29 16.4 17.22C16.92 17.14 18 16.56 18.23 15.91C18.46 15.26 18.46 14.7 18.39 14.59C18.32 14.47 18.13 14.41 17.85 14.27C17.57 14.13 16.2 13.45 15.94 13.36C15.69 13.27 15.5 13.22 15.32 13.5C15.13 13.77 14.6 14.41 14.44 14.59C14.28 14.78 14.12 14.8 13.84 14.66C13.56 14.53 12.67 14.23 11.62 13.29C10.79 12.55 10.23 11.64 10.07 11.36C9.91 11.09 10.05 10.93 10.2 10.79C10.32 10.67 10.48 10.46 10.62 10.3C10.76 10.13 10.8 10.02 10.89 9.83C10.99 9.65 10.94 9.48 10.87 9.35C10.8 9.21 10.24 7.84 10.01 7.28C9.78 6.74 9.55 6.81 9.38 6.81C9.22 6.81 9.03 6.8 8.85 6.8L9.11 7.03Z" />
          </svg>
          <span>WhatsApp Chat</span>
        </a>
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav themeColor={themeColor} />

      {/* M-PIN Lock Screen Overlay */}
      {String(mpinStatus) === '1' && isLocked && (
        <LockScreen
          onUnlock={() => setIsLocked(false)}
          onLogout={handleLogout}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};

export default UserLayout;
