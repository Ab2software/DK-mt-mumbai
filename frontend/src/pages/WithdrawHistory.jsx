import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, PlusCircle, CheckCircle2, XCircle, Clock, ArrowUpRight, Calendar, Filter } from 'lucide-react';
import api from '../utils/api';
import { getISTTodayStr, getISTDaysAgoStr, formatDisplayDate } from '../utils/indianTime';

const WithdrawHistory = () => {
  const [fromDate, setFromDate] = useState(getISTDaysAgoStr(6));
  const [toDate, setToDate] = useState(getISTTodayStr());
  const [history, setHistory] = useState([]);
  const [wallet, setWallet] = useState('0');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (d1 = fromDate, d2 = toDate) => {
    setLoading(true);
    try {
      const [histRes, walRes] = await Promise.all([
        api.get(`/wallet/withdraw-history?date1=${d1}&date2=${d2}`),
        api.get('/wallet/info')
      ]);

      if (histRes.data.success === '1') {
        setHistory(histRes.data.result || histRes.data.data || []);
      }
      if (walRes.data.success === '1') {
        setWallet(walRes.data.data?.wallet || '0');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleApply = (e) => {
    e.preventDefault();
    fetchHistory(fromDate, toDate);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: '0.88rem',
    outline: 'none'
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '16px 14px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        marginBottom: '18px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #043490 0%, #002663 100%)',
        boxShadow: '0 4px 14px rgba(4, 52, 144, 0.25)',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpRight size={20} style={{ color: '#ffb703' }} />
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>Withdraw History</span>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          fontWeight: '700',
          fontSize: '0.88rem',
          color: '#ffffff'
        }}>
          <Wallet size={16} />
          <span>₹ {wallet}</span>
        </div>
      </div>

      {/* Date Filter Box */}
      <div className="card-glass-v2" style={{ padding: '18px', marginBottom: '20px', borderRadius: '16px' }}>
        <form onSubmit={handleApply}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '50px',
              fontWeight: '700',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #043490 0%, #002663 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(4, 52, 144, 0.25)'
            }}
          >
            <Filter size={16} /> Apply Date Filter
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: '#475569', margin: 0, fontSize: '0.85rem' }}>
          Your withdrawal requests & approval status
        </p>
        <Link
          to="/withdraw"
          style={{
            padding: '7px 16px',
            borderRadius: '50px',
            fontSize: '0.78rem',
            fontWeight: '700',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #ff7b00 0%, #e65100 100%)',
            color: '#ffffff',
            boxShadow: '0 3px 10px rgba(255, 123, 0, 0.3)'
          }}
        >
          <PlusCircle size={14} /> Request Withdraw
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading withdraw requests...</div>
      ) : history.length === 0 ? (
        <div className="card-glass-v2" style={{
          borderRadius: '16px',
          padding: '36px 20px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Clock size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p style={{ marginBottom: '14px', fontSize: '0.9rem' }}>No withdrawal requests found.</p>
          <Link
            to="/withdraw"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '50px',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '0.88rem',
              background: 'linear-gradient(135deg, #043490 0%, #002663 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(4, 52, 144, 0.25)'
            }}
          >
            <PlusCircle size={16} /> Submit Withdraw Request
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item, idx) => {
            const isApproved = item.status === '1';
            const isRejected = item.status === '-1';
            const statusLabel = isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING';
            const statusColor = isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
            const StatusIcon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;

            return (
              <div
                key={item.id || idx}
                className="card-glass-v2"
                style={{
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: `4px solid ${statusColor}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${statusColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: statusColor
                  }}>
                    <StatusIcon size={20} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>
                      {item.remark || 'Withdrawal'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '0.78rem', color: '#64748b' }}>
                      {formatDisplayDate(item.date)}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      color: statusColor,
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px'
                    }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <h5 style={{ margin: 0, color: '#043490', fontWeight: '800', fontSize: '1.15rem' }}>
                  ₹ {item.points || item.amount || '0'}
                </h5>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WithdrawHistory;

