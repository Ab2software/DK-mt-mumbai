import React, { useState } from 'react';
import { Lock, Delete, LogOut, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const LockScreen = ({ onUnlock, onLogout, themeColor = 'blue' }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const phone = localStorage.getItem('phone') || '';
  const name = localStorage.getItem('name') || 'User';

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = async (mpinToVerify) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/verify-mpin', { mpin: mpinToVerify });
      if (res.data.success === '1') {
        sessionStorage.setItem('mpin_unlocked', 'true');
        if (onUnlock) onUnlock();
      } else {
        setError(res.data.msg || 'Invalid M-PIN! Please try again.');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      setError('Error verifying M-PIN. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      pointerEvents: 'all',
      backgroundColor: '#f4f6fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: '#1e293b'
    }}>
      <div style={{
        maxWidth: '380px',
        width: '100%',
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 30, 80, 0.12)',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff'
      }}>
        {/* Header Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(4, 52, 144, 0.08)',
          border: '2px solid #043490',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 4px 16px rgba(4, 52, 144, 0.2)'
        }}>
          <Lock size={32} style={{ color: '#043490' }} />
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px 0', color: '#043490' }}>
          App Lock Screen
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>
          Welcome back, <strong style={{ color: '#043490' }}>{name}</strong> ({phone})
        </p>

        {/* PIN Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid #043490',
                backgroundColor: pin.length > index ? '#043490' : 'transparent',
                boxShadow: pin.length > index ? '0 0 10px rgba(4, 52, 144, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            padding: '8px 12px',
            borderRadius: '50px',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleKeyPress(String(num))}
              style={{
                padding: '16px 0',
                fontSize: '1.4rem',
                fontWeight: '700',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#043490',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(0, 30, 80, 0.04)'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={handleClear}
            style={{
              padding: '16px 0',
              fontSize: '0.85rem',
              fontWeight: '700',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#64748B',
              cursor: 'pointer'
            }}
          >
            CLR
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleKeyPress('0')}
            style={{
              padding: '16px 0',
              fontSize: '1.4rem',
              fontWeight: '700',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#043490',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 30, 80, 0.04)'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            0
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleBackspace}
            style={{
              padding: '16px 0',
              fontSize: '1rem',
              fontWeight: '700',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Footer Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={14} /> Switch Account / Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default LockScreen;
