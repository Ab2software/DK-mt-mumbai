import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, BookOpen, CheckCircle2, HelpCircle, ShieldCheck, PhoneCall, Headphones, Sparkles } from 'lucide-react';
import api from '../utils/api';

const HowToPlay = () => {
  const [content, setContent] = useState('');
  const [contact, setContact] = useState({ mobile: '', whatsapp: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch public/user settings
        const res = await api.get('/wallet/info').catch(() => null);
        if (res?.data?.success === '1' && res.data.data) {
          const d = res.data.data;
          setContent(d.how_to_play || '');
          setContact({
            mobile: d.admin_mobile || '',
            whatsapp: d.admin_wp || ''
          });
        } else {
          // Fallback to how-to-play public endpoint
          const publicRes = await api.get('/how-to-play').catch(() => null);
          if (publicRes?.data?.content) {
            setContent(publicRes.data.content);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cleanPhone = (contact.mobile || '').replace(/\D/g, '');


  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 14px 50px' }}>
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        marginBottom: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #043490 0%, #002663 100%)',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(4, 52, 144, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#fff', textDecoration: 'none' }}>
            <ArrowLeft size={22} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlayCircle size={22} style={{ color: '#ffb703' }} />
            <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#fff', letterSpacing: '0.03em' }}>
              How To Play
            </span>
          </div>
        </div>
      </div>

      {/* Main Admin How To Play Instructions Card */}
      <div className="card-glass-v2" style={{
        borderRadius: '20px',
        padding: '24px 20px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <BookOpen size={22} style={{ color: '#043490' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>
            Game Rules & Instructions
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            Loading game instructions...
          </div>
        ) : content ? (
          <div style={{
            color: '#1e293b',
            fontSize: '0.95rem',
            lineHeight: '1.7',
            whiteSpace: 'pre-line',
            backgroundColor: '#f8fafc',
            padding: '16px 18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            {content}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Welcome to the online game portal! Below are the step-by-step instructions to place your bids and start winning.
          </div>
        )}
      </div>

      {/* Step-by-Step Playing Guide */}
      <div className="card-glass-v2" style={{
        borderRadius: '20px',
        padding: '24px 20px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ margin: '0 0 18px 0', fontSize: '1.05rem', color: '#043490', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} /> Step-by-Step Guide to Play
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#043490',
              color: '#ffffff',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>1</div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: '700' }}>Deposit / Add Funds</h5>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Go to "Deposit Request" from menu, scan the QR code or use UPI ID to pay, and submit UTR / reference number.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#043490',
              color: '#ffffff',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>2</div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: '700' }}>Select Game Market</h5>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Choose your desired live game market (e.g. Kalyan, Milan, Rajdhani) from the Home dashboard.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#043490',
              color: '#ffffff',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>3</div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: '700' }}>Choose Game Type & Place Bid</h5>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Select Single Digit, Single Pana, Double Pana, Triple Pana, or Jodi. Enter digits & amount and click "Submit Bid".
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#043490',
              color: '#ffffff',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>4</div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: '700' }}>Winning & Automatic Payout</h5>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4' }}>
                When result is declared, winning points will be credited automatically to your wallet balance instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Need Help CTA */}
      <div className="card-glass-v2" style={{
        borderRadius: '20px',
        padding: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(4, 52, 144, 0.08) 0%, rgba(4, 52, 144, 0.03) 100%)',
        border: '1px solid rgba(4, 52, 144, 0.2)'
      }}>
        <HelpCircle size={32} style={{ color: '#043490', marginBottom: '8px' }} />
        <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '1rem', fontWeight: '800' }}>Have Any Doubts?</h4>
        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.85rem' }}>
          Contact our 24/7 in-app support team for instant guidance.
        </p>

        <Link
          to="/support"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: '#ffffff',
            padding: '11px 24px',
            borderRadius: '50px',
            fontWeight: '800',
            fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.03C8.92 7.03 8.61 7.1 8.36 7.37C8.11 7.64 7.41 8.3 7.41 9.64C7.41 10.98 8.39 12.27 8.52 12.45C8.66 12.63 10.43 15.36 13.15 16.53C13.79 16.81 14.3 16.98 14.69 17.11C15.34 17.31 15.93 17.29 16.4 17.22C16.92 17.14 18 16.56 18.23 15.91C18.46 15.26 18.46 14.7 18.39 14.59C18.32 14.47 18.13 14.41 17.85 14.27C17.57 14.13 16.2 13.45 15.94 13.36C15.69 13.27 15.5 13.22 15.32 13.5C15.13 13.77 14.6 14.41 14.44 14.59C14.28 14.78 14.12 14.8 13.84 14.66C13.56 14.53 12.67 14.23 11.62 13.29C10.79 12.55 10.23 11.64 10.07 11.36C9.91 11.09 10.05 10.93 10.2 10.79C10.32 10.67 10.48 10.46 10.62 10.3C10.76 10.13 10.8 10.02 10.89 9.83C10.99 9.65 10.94 9.48 10.87 9.35C10.8 9.21 10.24 7.84 10.01 7.28C9.78 6.74 9.55 6.81 9.38 6.81C9.22 6.81 9.03 6.8 8.85 6.8L9.11 7.03Z" />
          </svg>
          <span>Chat on WhatsApp</span>
        </Link>
      </div>
    </div>
  );
};

export default HowToPlay;
