import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  MessageCircle,
  HelpCircle,
  X,
  CheckCircle2,
  Headphones
} from 'lucide-react';
import api from '../utils/api';

const Login = ({ setAuth }) => {
  const [phone, setPhone] = useState(() => localStorage.getItem('remember_login_phone') || '');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remember_login_phone'));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appName, setAppName] = useState('Bharat Matka');
  const [wpNumber, setWpNumber] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('error') === 'inactive') {
      setError('Account Inactive! Contact Admin to activate your account.');
    }

    api.get('/app-info').then(res => {
      if (res.data?.success === '1' && res.data.data) {
        if (res.data.data.app_name) {
          setAppName(res.data.data.app_name);
        }
        if (res.data.data.mpin_status !== undefined) {
          const rawM = String(res.data.data.mpin_status).trim().toLowerCase();
          const mVal = (rawM === '0' || rawM === 'inactive' || rawM === 'false' || rawM === 'off') ? '0' : '1';
          localStorage.setItem('app_mpin_status', mVal);
        }
        const supportNum = res.data.data.wp_mobile || res.data.data.mobile || '';
        if (supportNum) {
          setWpNumber(supportNum);
        }
      }
    }).catch(() => { });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/login', {
        phone_number: phone,
        password: password
      });

      const resData = response.data;
      if (resData.success === '1') {
        const savedMpinStatus = localStorage.getItem('app_mpin_status');
        if (savedMpinStatus !== '1') {
          sessionStorage.setItem('mpin_unlocked', 'true');
        } else {
          sessionStorage.removeItem('mpin_unlocked');
        }
        localStorage.setItem('token', resData.data.token);
        localStorage.setItem('phone', resData.data.phone_number);
        localStorage.setItem('name', resData.data.name);

        if (rememberMe) {
          localStorage.setItem('remember_login_phone', phone);
        } else {
          localStorage.removeItem('remember_login_phone');
        }

        setAuth(true);
        navigate('/');
      } else {
        setError(resData.data?.msg || resData.msg || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.msg || err.response?.data?.data?.msg;
      setError(serverMsg || 'Login failed. Please verify your phone number and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-bg">
      <div className="auth-ref-container">
        {/* Top Header Row matching Image 1 */}
        <div className="auth-ref-header">
          <div>
            <h1 className="auth-ref-title">LOGIN</h1>
            <p className="auth-ref-subtitle">Sign In To Your Account</p>
          </div>
          <div style={{ color: '#043490', display: 'flex', alignItems: 'center' }}>
            <Smartphone size={32} strokeWidth={2.2} />
          </div>
        </div>

        {/* Center Logo Card matching Image 1 */}
        <div className="auth-ref-logo-card">
          <div className="auth-ref-logo-box">
            <img
              src="/img/logo.png"
              alt={`${appName} Logo`}
              className="auth-ref-logo-img"
              onError={(e) => { e.target.src = '/img/logo.png'; }}
            />
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Mobile No */}
          <div className="auth-pill-input-wrap">
            <div className="auth-pill-icon">
              <Phone size={19} />
            </div>
            <input
              type="tel"
              name="phone"
              className="auth-pill-input"
              placeholder="Enter Mobile No"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
          </div>

          {/* Password */}
          <div className="auth-pill-input-wrap">
            <div className="auth-pill-icon">
              <Lock size={19} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="auth-pill-input"
              style={{ paddingRight: '48px' }}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              style={{ color: '#64748B' }}
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {/* Options Row: Remember Me & Forgot Password */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            padding: '0 4px',
            fontSize: '0.85rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#043490', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#043490',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              padding: '11px 16px',
              borderRadius: '50px',
              marginBottom: '14px',
              textAlign: 'center',
              fontSize: '0.88rem',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        {/* Secondary Action Button */}
        <Link to="/signup" className="auth-btn-secondary">
          DON'T HAVE AN ACCOUNT? REGISTER
        </Link>

        {/* WhatsApp Link matching Image 1 */}
        <div className="auth-whatsapp-row">
          <a
            href={`https://wa.me/${(wpNumber || '919876543210').replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="auth-whatsapp-link"
          >
            <div className="auth-whatsapp-icon-circle">
              <MessageCircle size={16} fill="#ffffff" />
            </div>
            <span>{wpNumber ? (wpNumber.startsWith('+') ? wpNumber : `+${wpNumber}`) : '+919876543210'}</span>
          </a>
        </div>
      </div>

      {/* Forgot Password / Help Modal */}
      {showHelpModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowHelpModal(false)}>
          <div className="auth-modal-content" style={{ backgroundColor: '#ffffff', color: '#1e293b' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="auth-modal-close"
              style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
              onClick={() => setShowHelpModal(false)}
              title="Close"
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(4, 52, 144, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: '#043490'
              }}>
                <HelpCircle size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#043490', marginBottom: '6px' }}>
                Password Recovery
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.4' }}>
                For security reasons, password resets are verified directly by our team via Live Support or Helpline.
              </p>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              color: '#334155'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Verify your registered mobile number</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Receive instant PIN or reset instructions</span>
              </div>
            </div>

            <a
              href={`https://wa.me/${(wpNumber || '919876543210').replace(/\D/g, '')}?text=${encodeURIComponent('Hello Bharat Matka Team, I need help recovering my account password for phone: ' + phone)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px',
                borderRadius: '50px',
                fontSize: '0.92rem',
                textDecoration: 'none',
                background: '#043490',
                color: '#ffffff',
                fontWeight: '700',
                boxShadow: '0 4px 14px rgba(4, 52, 144, 0.3)'
              }}
            >
              <Headphones size={18} />
              <span>Connect with Support on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
