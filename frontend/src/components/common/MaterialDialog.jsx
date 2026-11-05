import React from 'react';
import { AlertCircle, CheckCircle2, Wallet, XCircle, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MaterialDialog = ({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  showCancel = false
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isInsufficient = type === 'insufficient_funds';

  // Theme configurations based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={36} style={{ color: '#34d399' }} />,
          iconBg: 'rgba(52, 211, 153, 0.15)',
          borderColor: 'rgba(52, 211, 153, 0.3)',
          glowColor: 'rgba(52, 211, 153, 0.2)',
          defaultTitle: 'Success!',
          defaultConfirm: 'OK'
        };
      case 'insufficient_funds':
        return {
          icon: <Wallet size={36} style={{ color: '#f59e0b' }} />,
          iconBg: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          glowColor: 'rgba(245, 158, 11, 0.25)',
          defaultTitle: 'Insufficient Wallet Balance',
          defaultConfirm: 'ADD FUNDS'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={36} style={{ color: '#f59e0b' }} />,
          iconBg: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          glowColor: 'rgba(245, 158, 11, 0.2)',
          defaultTitle: 'Attention',
          defaultConfirm: 'OK'
        };
      case 'error':
      default:
        return {
          icon: <XCircle size={36} style={{ color: '#f87171' }} />,
          iconBg: 'rgba(248, 113, 113, 0.15)',
          borderColor: 'rgba(248, 113, 113, 0.3)',
          glowColor: 'rgba(248, 113, 113, 0.2)',
          defaultTitle: 'Error',
          defaultConfirm: 'OK'
        };
    }
  };

  const config = getTypeConfig();
  const dialogTitle = title || config.defaultTitle;
  const dialogConfirmText = confirmText || config.defaultConfirm;

  const handleConfirmAction = () => {
    if (onConfirm) {
      onConfirm();
    } else if (isInsufficient) {
      if (onClose) onClose();
      navigate('/add-fund');
    } else {
      if (onClose) onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
        padding: '24px 20px 20px 20px',
        textAlign: 'center',
        position: 'relative',
        color: '#0f172a',
        transform: 'translateY(0)',
        animation: 'slideUp 0.25s ease-out'
      }}>
        {/* Close Icon (Top Right) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Header Icon Badge */}
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          backgroundColor: config.iconBg,
          border: `1px solid ${config.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          {config.icon}
        </div>

        {/* Title */}
        <h4 style={{
          fontSize: '1.25rem',
          fontWeight: '800',
          margin: '0 0 10px 0',
          color: '#0f172a',
          letterSpacing: '0.01em'
        }}>
          {dialogTitle}
        </h4>

        {/* Message Content */}
        <div style={{
          fontSize: '0.92rem',
          color: '#475569',
          lineHeight: '1.5',
          marginBottom: '24px'
        }}>
          {message}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          {(showCancel || isInsufficient) && (
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#475569',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              {cancelText || 'Cancel'}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmAction}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: '800',
              cursor: 'pointer',
              letterSpacing: '0.03em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isInsufficient
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : type === 'error'
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #053FA8 0%, #03256C 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(4, 52, 144, 0.3)'
            }}
          >
            {isInsufficient && <Wallet size={16} />}
            <span>{dialogConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialDialog;
