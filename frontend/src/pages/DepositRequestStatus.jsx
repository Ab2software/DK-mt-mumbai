import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, PlusCircle, ArrowDownRight, CheckCircle2, XCircle, Clock, Copy, Check, Filter, Sparkles, Calendar } from 'lucide-react';
import api from '../utils/api';
import { getISTTodayStr, getISTDaysAgoStr, formatDisplayDate } from '../utils/indianTime';

const DepositRequestStatus = () => {
  const [fromDate, setFromDate] = useState(getISTDaysAgoStr(6));
  const [toDate, setToDate] = useState(getISTTodayStr());
  const [deposits, setDeposits] = useState([]);
  const [wallet, setWallet] = useState('0');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [copiedUtr, setCopiedUtr] = useState('');

  const fetchData = async (d1 = fromDate, d2 = toDate) => {
    setLoading(true);
    try {
      const [depRes, walRes] = await Promise.all([
        api.get(`/wallet/deposit-requests?date1=${d1}&date2=${d2}`).catch(() => null),
        api.get('/wallet/info').catch(() => null)
      ]);

      if (depRes?.data?.success === '1') {
        setDeposits(depRes.data.result || []);
      }
      if (walRes?.data?.success === '1') {
        setWallet(walRes.data.data?.wallet || '0');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = (e) => {
    e.preventDefault();
    fetchData(fromDate, toDate);
  };

  const handleCopyUtr = (utr) => {
    if (!utr) return;
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(''), 2500);
  };

  // Filtered deposits list
  const filteredDeposits = deposits.filter(item => {
    if (activeFilter === 'pending') return item.status === '0' || (!item.status && item.status !== '-1');
    if (activeFilter === 'approved') return item.status === '1';
    if (activeFilter === 'rejected') return item.status === '-1';
    return true;
  });

  // Calculate statistics
  const pendingCount = deposits.filter(d => d.status === '0' || (!d.status && d.status !== '-1')).length;
  const approvedCount = deposits.filter(d => d.status === '1').length;
  const rejectedCount = deposits.filter(d => d.status === '-1').length;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 14px 32px' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #043490 0%, #002663 100%)',
        padding: '14px 18px',
        borderRadius: '16px',
        marginBottom: '20px',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(4, 52, 144, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#ffffff' }}>
            <ArrowLeft size={20} />
          </Link>
          <span style={{ fontWeight: '800', fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Deposit History</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '800',
          fontSize: '0.9rem',
          background: 'rgba(255, 255, 255, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '6px 12px',
          borderRadius: '20px',
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
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
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
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
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

      {/* Statistics Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <div className="card-glass-v2" style={{ padding: '12px', textAlign: 'center', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block' }}>TOTAL</span>
          <strong style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '800' }}>{deposits.length}</strong>
        </div>
        <div className="card-glass-v2" style={{ padding: '12px', textAlign: 'center', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600', display: 'block' }}>PENDING</span>
          <strong style={{ fontSize: '1.25rem', color: '#d97706', fontWeight: '800' }}>{pendingCount}</strong>
        </div>
        <div className="card-glass-v2" style={{ padding: '12px', textAlign: 'center', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600', display: 'block' }}>APPROVED</span>
          <strong style={{ fontSize: '1.25rem', color: '#059669', fontWeight: '800' }}>{approvedCount}</strong>
        </div>
      </div>

      {/* Filter Tabs & New Deposit Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'approved', label: `Approved (${approvedCount})` },
            { key: 'rejected', label: `Rejected (${rejectedCount})` }
          ].map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={activeFilter === f.key ? 'btn-gold' : 'btn-outline'}
              style={{
                padding: '6px 14px',
                borderRadius: '50px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Link
          to="/add-fund"
          style={{
            padding: '7px 16px',
            borderRadius: '50px',
            fontSize: '0.8rem',
            fontWeight: '800',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #ff7b00 0%, #e65100 100%)',
            color: '#ffffff',
            boxShadow: '0 3px 10px rgba(255, 123, 0, 0.3)'
          }}
        >
          <PlusCircle size={15} /> <span>ADD FUND</span>
        </Link>
      </div>

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b', fontSize: '0.92rem' }}>
          <Clock size={28} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
          <p style={{ margin: 0 }}>Loading deposit requests...</p>
        </div>
      ) : filteredDeposits.length === 0 ? (
        <div className="card-glass-v2" style={{
          borderRadius: '18px',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Clock size={48} style={{ color: '#043490', opacity: 0.5, marginBottom: '12px' }} />
          <h4 style={{ color: '#0f172a', fontSize: '1.1rem', margin: '0 0 6px 0', fontWeight: '700' }}>
            {activeFilter === 'all' ? 'No Deposit Requests Found' : `No ${activeFilter.toUpperCase()} Deposit Requests`}
          </h4>
          <p style={{ marginBottom: '20px', fontSize: '0.85rem', color: '#64748b' }}>
            Submit a deposit request to add points to your wallet instantly.
          </p>
          <Link
            to="/add-fund"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              borderRadius: '50px',
              fontWeight: '800',
              textDecoration: 'none',
              fontSize: '0.88rem',
              background: 'linear-gradient(135deg, #043490 0%, #002663 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(4, 52, 144, 0.25)'
            }}
          >
            <PlusCircle size={18} /> <span>SUBMIT DEPOSIT REQUEST</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredDeposits.map((item) => {
            const isApproved = item.status === '1';
            const isRejected = item.status === '-1';
            const isPending = !isApproved && !isRejected;

            const statusColor = isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
            const statusBg = isApproved ? 'rgba(16, 185, 129, 0.12)' : isRejected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)';
            const statusBorder = isApproved ? 'rgba(16, 185, 129, 0.3)' : isRejected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)';
            const StatusIcon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;

            const utrNumber = item.utr || item.txt_id || item.transaction_id || '';

            return (
              <div
                key={item.id || Math.random()}
                className="card-glass-v2"
                style={{
                  borderRadius: '16px',
                  padding: '16px 18px',
                  borderLeft: `5px solid ${statusColor}`,
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>
                      Deposit Amount
                    </span>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#043490', margin: '2px 0 0 0' }}>
                      ₹ {parseFloat(item.amount || 0).toLocaleString('en-IN')}
                    </h3>
                  </div>

                  <span
                    style={{
                      backgroundColor: statusBg,
                      color: statusColor,
                      border: `1px solid ${statusBorder}`,
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <StatusIcon size={14} />
                    {item.status_text || (isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Verification')}
                  </span>
                </div>

                {utrNumber && (
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: '600' }}>
                        TRANSACTION UTR / REF NO.
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', letterSpacing: '0.02em' }}>
                        {utrNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyUtr(utrNumber)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedUtr === utrNumber ? '#10b981' : '#043490',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: '700'
                      }}
                    >
                      {copiedUtr === utrNumber ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedUtr === utrNumber ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: '#64748b'
                }}>
                  <span>Date: {formatDisplayDate(item.date || item.txt_date)}</span>
                  {isPending && (
                    <span style={{ color: '#d97706', fontStyle: 'italic' }}>
                      ⏳ Admin verification in progress
                    </span>
                  )}
                  {isApproved && (
                    <span style={{ color: '#059669', fontWeight: '600' }}>
                      ✓ Wallet Credited
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DepositRequestStatus;


