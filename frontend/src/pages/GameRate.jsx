import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Coins, Award } from 'lucide-react';
import api from '../utils/api';

const GameRate = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      const res = await api.get('/games/rates');
      if (res.data.success === '1') {
        setRates(res.data.data || res.data.result || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '16px 14px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        marginBottom: '20px',
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
            <TrendingUp size={20} style={{ color: '#ffb703' }} />
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>Game Payout Rates</span>
          </div>
        </div>
      </div>

      {/* Column Alignment Header */}
      {!loading && rates.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px 10px',
          fontSize: '0.74rem',
          fontWeight: '800',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <span>Game Type</span>
          <span style={{ textAlign: 'right', width: '155px', flexShrink: 0 }}>
            Payout Rate (Bet - Win)
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading game rates...</div>
      ) : rates.length === 0 ? (
        <div className="card-glass-v2" style={{
          borderRadius: '16px',
          padding: '36px 20px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Coins size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <div>No game rates available at the moment.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rates.map((item, idx) => (
            <div
              key={item.id || idx}
              className="card-glass-v2"
              style={{
                borderRadius: '16px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: '4px solid #043490',
                gap: '12px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Left: Icon & Game Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(4, 52, 144, 0.08)',
                  border: '1px solid rgba(4, 52, 144, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#043490',
                  flexShrink: 0
                }}>
                  <Award size={22} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h5 style={{
                    margin: 0,
                    fontWeight: '800',
                    color: '#0f172a',
                    fontSize: '1.02rem',
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.type}
                  </h5>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b', fontWeight: '600' }}>
                    Standard Market Rate
                  </p>
                </div>
              </div>

              {/* Right: Perfectly Aligned Payout Rate Box */}
              <div style={{
                width: '155px',
                flexShrink: 0,
                background: 'rgba(4, 52, 144, 0.06)',
                border: '1.5px solid rgba(4, 52, 144, 0.2)',
                borderRadius: '12px',
                padding: '7px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(4, 52, 144, 0.05)',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 14px 1fr',
                  alignItems: 'center',
                  width: '100%',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {/* Bet Amount */}
                  <span style={{
                    textAlign: 'right',
                    fontWeight: '800',
                    color: '#043490',
                    fontSize: '0.94rem',
                    whiteSpace: 'nowrap'
                  }}>
                    ₹{item.min_value || '10'}
                  </span>

                  {/* Separator */}
                  <span style={{
                    textAlign: 'center',
                    fontWeight: '700',
                    color: '#94a3b8',
                    fontSize: '0.85rem'
                  }}>
                    -
                  </span>

                  {/* Win Payout */}
                  <span style={{
                    textAlign: 'left',
                    fontWeight: '900',
                    color: '#0f172a',
                    fontSize: '0.96rem',
                    letterSpacing: '0.01em',
                    paddingLeft: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                    ₹{Number(item.max_value || '0').toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info Notice */}
      {!loading && rates.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(4, 52, 144, 0.05)',
          border: '1px solid rgba(4, 52, 144, 0.15)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#475569',
          fontSize: '0.8rem'
        }}>
          <Coins size={18} color="#043490" style={{ flexShrink: 0 }} />
          <span>All winning payout rates are calculated per standard ₹10 bet and credited instantly to wallet upon result announcement.</span>
        </div>
      )}
    </div>
  );
};

export default GameRate;

