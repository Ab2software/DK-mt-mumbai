import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Lock, KeyRound, Gift, Eye, EyeOff, Smartphone, MessageCircle } from 'lucide-react';
import api from '../utils/api';

const Signup = ({ setAuth }) => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_phone: '',
    user_password: '',
    user_mpin: '',
    user_email: '',
    referral_phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [appName, setAppName] = useState('Bharat Matka');
  const [wpNumber, setWpNumber] = useState('');
  const [referralStatus, setReferralStatus] = useState(() => localStorage.getItem('app_referral_status') || '1');
  const [mpinStatus, setMpinStatus] = useState(() => {
    const saved = localStorage.getItem('app_mpin_status');
    if (saved !== null && saved !== undefined) {
      const s = String(saved).trim().toLowerCase();
      return (s === '0' || s === 'inactive' || s === 'false' || s === 'off') ? '0' : '1';
    }
    return '0';
  });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/app-info').then(res => {
      if (res.data?.success === '1' && res.data.data) {
        if (res.data.data.app_name) {
          setAppName(res.data.data.app_name);
        }
        if (res.data.data.referral_status !== undefined) {
          const rStatus = String(res.data.data.referral_status);
          setReferralStatus(rStatus);
          localStorage.setItem('app_referral_status', rStatus);
        }
        if (res.data.data.mpin_status !== undefined) {
          const rawM = String(res.data.data.mpin_status).trim().toLowerCase();
          const mVal = (rawM === '0' || rawM === 'inactive' || rawM === 'false' || rawM === 'off') ? '0' : '1';
          setMpinStatus(mVal);
          localStorage.setItem('app_mpin_status', mVal);
        }
        const supportNum = res.data.data.wp_mobile || res.data.data.mobile || '';
        if (supportNum) {
          setWpNumber(supportNum);
        }
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.user_phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (formData.user_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (String(mpinStatus) === '1') {
      if (formData.user_mpin.length !== 4) {
        setError('M-PIN must be exactly 4 digits');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.post('/signup', {
        user_name: formData.user_name,
        user_phone: formData.user_phone,
        user_password: formData.user_password,
        user_mpin: String(mpinStatus) === '1' ? formData.user_mpin : '',
        user_email: formData.user_email,
        referral_phone: String(referralStatus) !== '0' ? formData.referral_phone : ''
      });

      const resData = response.data;
      if (resData.success === '1') {
        const welcomeName = resData.data?.name || formData.user_name || 'Player';
        setSuccess(`🎉 Registration Successful! Welcome, ${welcomeName}. Logging you in...`);
        if (resData.data?.token) {
          localStorage.setItem('token', resData.data.token);
          localStorage.setItem('phone', resData.data.phone_number);
          localStorage.setItem('name', resData.data.name);
          sessionStorage.setItem('just_registered_welcome', welcomeName);
          if (setAuth) setAuth(true);
        }
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setError(resData.msg || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during registration. Please try again.');
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
            <h1 className="auth-ref-title">REGISTER</h1>
            <p className="auth-ref-subtitle">Create New Account</p>
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

        {/* Form Controls */}
        <form onSubmit={handleSignup}>
          {/* Username */}
          <div className="auth-pill-input-wrap">
            <div className="auth-pill-icon">
              <User size={19} />
            </div>
            <input
              type="text"
              name="user_name"
              className="auth-pill-input"
              placeholder="Username"
              value={formData.user_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Mobile No */}
          <div className="auth-pill-input-wrap">
            <div className="auth-pill-icon">
              <Phone size={19} />
            </div>
            <input
              type="tel"
              name="user_phone"
              className="auth-pill-input"
              placeholder="Enter Mobile No"
              value={formData.user_phone}
              onChange={(e) => setFormData({ ...formData, user_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
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
              name="user_password"
              className="auth-pill-input"
              style={{ paddingRight: '48px' }}
              placeholder="Enter Password"
              value={formData.user_password}
              onChange={handleChange}
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

          {/* Conditional M-PIN */}
          {String(mpinStatus) === '1' && (
            <div className="auth-pill-input-wrap">
              <div className="auth-pill-icon">
                <KeyRound size={19} />
              </div>
              <input
                type={showMpin ? 'text' : 'password'}
                name="user_mpin"
                className="auth-pill-input"
                style={{ paddingRight: '48px' }}
                placeholder="Enter 4-Digit M-PIN"
                value={formData.user_mpin}
                onChange={(e) => setFormData({ ...formData, user_mpin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                style={{ color: '#64748B' }}
                onClick={() => setShowMpin(!showMpin)}
                title={showMpin ? 'Hide M-PIN' : 'Show M-PIN'}
              >
                {showMpin ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          )}

          {/* Conditional Referral */}
          {String(referralStatus) !== '0' && (
            <div className="auth-pill-input-wrap">
              <div className="auth-pill-icon">
                <Gift size={19} />
              </div>
              <input
                type="tel"
                name="referral_phone"
                className="auth-pill-input"
                placeholder="Referral Mobile (Optional)"
                value={formData.referral_phone}
                onChange={(e) => setFormData({ ...formData, referral_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </div>
          )}

          {/* Feedback messages */}
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

          {success && (
            <div style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1px solid #86efac',
              padding: '11px 16px',
              borderRadius: '50px',
              marginBottom: '14px',
              textAlign: 'center',
              fontSize: '0.88rem',
              fontWeight: '600'
            }}>
              {success}
            </div>
          )}

          {/* Primary Action Button matching Image 1 */}
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </form>

        {/* Secondary Action Button matching Image 1 */}
        <Link to="/login" className="auth-btn-secondary">
          ALREADY HAVE AN ACCOUNT? LOGIN
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
    </div>
  );
};

export default Signup;
