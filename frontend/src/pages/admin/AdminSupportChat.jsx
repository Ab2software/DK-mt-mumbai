import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Send, 
  Save, 
  Search, 
  CheckCircle, 
  ExternalLink, 
  ShieldCheck, 
  Users, 
  RefreshCw,
  Wallet,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../../utils/api';

const TEMPLATES = [
  {
    id: 'welcome',
    title: '👋 Welcome Greeting',
    text: 'Hello {name}, welcome to Bharat Matka! How can I assist you with your account or gameplay today?'
  },
  {
    id: 'deposit_verify',
    title: '💰 Deposit Verification',
    text: 'Hello {name}, regarding your deposit request: please share your 12-digit UTR transaction number and payment receipt screenshot so we can verify and credit your wallet points promptly.'
  },
  {
    id: 'deposit_success',
    title: '✅ Deposit Credited',
    text: 'Hello {name}, your deposit points have been successfully verified and added to your Bharat Matka wallet! Happy gaming and best of luck!'
  },
  {
    id: 'withdraw_processed',
    title: '💸 Withdrawal Processed',
    text: 'Hello {name}, your withdrawal request has been approved and processed to your provided bank/UPI account. Please check your bank statement. Thank you for playing with Bharat Matka!'
  },
  {
    id: 'pin_reset',
    title: '🔐 Password / M-PIN Assistance',
    text: 'Hello {name}, we received your inquiry regarding account login or M-PIN reset. Please confirm your registered mobile number so we can help you regain access securely.'
  },
  {
    id: 'results_query',
    title: '🎯 Market Timings & Results',
    text: 'Hello {name}, for market timings and live declared results, you can check the Live Results tab or let us know which market you have a question about.'
  }
];

const AdminSupportChat = ({ isMobile }) => {
  // Official WhatsApp helpline state
  const [helplineNumber, setHelplineNumber] = useState('');
  const [contactData, setContactData] = useState({});
  const [isSavingHelpline, setIsSavingHelpline] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Direct chat launcher state
  const [targetPhone, setTargetPhone] = useState('');
  const [targetName, setTargetName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [messageBody, setMessageBody] = useState(TEMPLATES[0].text);

  // User directory state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch initial contact settings and user directory
  useEffect(() => {
    fetchHelplineSettings();
    fetchUsersDirectory('');
  }, []);

  const fetchHelplineSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res && res.data && res.data.contact) {
        setContactData(res.data.contact);
        const wp = res.data.contact.wp_mobile || res.data.contact.mobile || '';
        setHelplineNumber(wp.replace(/\D/g, '').slice(-10));
      } else {
        const appRes = await api.get('/app-info');
        if (appRes && appRes.data) {
          const wp = appRes.data.wp_mobile || appRes.data.mobile || '';
          setHelplineNumber(wp.replace(/\D/g, '').slice(-10));
        }
      }
    } catch (err) {
      console.error('Failed to load contact settings:', err);
    }
  };

  const handleSaveHelpline = async (e) => {
    e.preventDefault();
    const cleanNum = helplineNumber.replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length < 10) {
      alert('Please enter a valid 10-digit mobile number for WhatsApp support.');
      return;
    }

    setIsSavingHelpline(true);
    setSaveStatus(null);
    try {
      const payload = {
        ...contactData,
        wp_mobile: cleanNum,
        mobile: contactData.mobile || cleanNum
      };
      const res = await api.post('/admin/contact-settings', payload);
      if (res && (res.data?.success === '1' || res.data?.success === 1 || res.data?.msg)) {
        setSaveStatus({ type: 'success', text: 'Official WhatsApp Helpline number updated successfully!' });
        setContactData(payload);
      } else {
        setSaveStatus({ type: 'error', text: res.data?.error || 'Failed to update helpline number.' });
      }
    } catch (err) {
      console.error('Error saving helpline:', err);
      setSaveStatus({ type: 'error', text: err.response?.data?.error || err.message || 'Error saving settings' });
    } finally {
      setIsSavingHelpline(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const fetchUsersDirectory = async (searchTerm = '') => {
    setIsLoadingUsers(true);
    try {
      const query = searchTerm ? `?page=1&limit=25&search=${encodeURIComponent(searchTerm)}` : '?page=1&limit=25';
      const res = await api.get(`/admin/users${query}`);
      if (res && res.data && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else if (res && res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users directory:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSelectUser = (u) => {
    const phone = String(u.phone || u.username || '').replace(/\D/g, '').slice(-10);
    const name = u.name || u.user_name || 'Member';
    setTargetPhone(phone);
    setTargetName(name);

    // Update message text with selected user's name
    const tmpl = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];
    setMessageBody(tmpl.text.replace('{name}', name));
  };

  const handleTemplateChange = (tmplId) => {
    setSelectedTemplate(tmplId);
    const tmpl = TEMPLATES.find(t => t.id === tmplId);
    if (tmpl) {
      setMessageBody(tmpl.text.replace('{name}', targetName || 'Member'));
    }
  };

  const handleOpenWhatsAppChat = (phoneToUse, textToUse) => {
    const rawNum = phoneToUse || targetPhone;
    const cleanNum = String(rawNum).replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length < 10) {
      alert('Please enter a valid 10-digit mobile number to chat on WhatsApp.');
      return;
    }
    const finalMsg = textToUse !== undefined ? textToUse : messageBody;
    const url = `https://wa.me/91${cleanNum}?text=${encodeURIComponent(finalMsg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #075E54 0%, #128C7E 50%, #25D366 100%)',
        borderRadius: '16px',
        padding: isMobile ? '20px 16px' : '26px 30px',
        color: '#ffffff',
        boxShadow: '0 10px 25px rgba(18, 140, 126, 0.25)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            flexShrink: 0
          }}>
            💬
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: '800' }}>
              WhatsApp Support & Direct Chat Hub
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.92 }}>
              Directly chat with users on WhatsApp and manage your official support helpline number.
            </p>
          </div>
        </div>

        {helplineNumber && (
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            padding: '10px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85 }}>
              Current Helpline
            </span>
            <strong style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>
              +91 {helplineNumber}
            </strong>
          </div>
        )}
      </div>

      {/* 2. Top Grid: Helpline Settings & Quick Launcher */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.35fr',
        gap: '24px'
      }}>

        {/* Card A: Official Helpline Settings */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#e8fdf0',
                color: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Phone size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>
                  Official WhatsApp Helpline
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  The number users reach when clicking "Chat on WhatsApp" across the app
                </span>
              </div>
            </div>

            {saveStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor: saveStatus.type === 'success' ? '#def7ec' : '#fde8e8',
                color: saveStatus.type === 'success' ? '#03543f' : '#9b1c1c',
                border: `1px solid ${saveStatus.type === 'success' ? '#bcf0da' : '#f8b4b4'}`
              }}>
                {saveStatus.text}
              </div>
            )}

            <form onSubmit={handleSaveHelpline}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  Support WhatsApp Mobile Number
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: '#475569'
                  }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number (e.g. 9876543210)"
                    value={helplineNumber}
                    onChange={(e) => setHelplineNumber(e.target.value.replace(/\D/g, ''))}
                    style={{
                      flex: 1,
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                  <Info size={14} />
                  <span>Updates immediately reflect on the user Support screen, floating WhatsApp widget & headers.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={isSavingHelpline}
                  style={{
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: isSavingHelpline ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                    opacity: isSavingHelpline ? 0.7 : 1
                  }}
                >
                  <Save size={16} />
                  {isSavingHelpline ? 'Updating...' : 'Save Helpline Number'}
                </button>

                {helplineNumber && (
                  <a
                    href={`https://wa.me/91${helplineNumber}?text=${encodeURIComponent('Hello! Testing official Bharat Matka support helpline.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#075E54',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Test Helpline</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </form>
          </div>

          <div style={{
            marginTop: '20px',
            backgroundColor: '#f0fdf4',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid #bbf7d0',
            fontSize: '0.82rem',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldCheck size={20} style={{ flexShrink: 0, color: '#16a34a' }} />
            <span>
              <strong>Verified WhatsApp Integration:</strong> All conversations open encrypted in official WhatsApp client (Web or App). No third-party tokens required.
            </span>
          </div>
        </div>

        {/* Card B: Direct WhatsApp Launcher & Quick Templates */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Send size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>
                  Direct WhatsApp Chat Launcher
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Send pre-filled or custom WhatsApp message to any user in 1 click
                </span>
              </div>
            </div>
          </div>

          {/* Recipient inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                User Mobile Number *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit number"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    flex: 1,
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                User / Player Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={targetName}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetName(val);
                  const tmpl = TEMPLATES.find(t => t.id === selectedTemplate);
                  if (tmpl) {
                    setMessageBody(tmpl.text.replace('{name}', val || 'Member'));
                  }
                }}
                style={{
                  width: '100%',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Quick Template Selector Chips */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
              Choose Fast Template:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {TEMPLATES.map((tmpl) => {
                const isActive = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tmpl.id)}
                    style={{
                      border: isActive ? '1px solid #10b981' : '1px solid #e2e8f0',
                      backgroundColor: isActive ? '#ecfdf5' : '#f8fafc',
                      color: isActive ? '#065f46' : '#475569',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tmpl.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              Message Text to Pre-Fill
            </label>
            <textarea
              rows={3}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Type message here..."
              style={{
                width: '100%',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.88rem',
                color: '#1e293b',
                boxSizing: 'border-box',
                resize: 'vertical',
                lineHeight: '1.4'
              }}
            />
          </div>

          {/* Open WhatsApp Chat Button */}
          <button
            type="button"
            onClick={() => handleOpenWhatsAppChat()}
            style={{
              width: '100%',
              backgroundColor: '#25D366',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
              transition: 'transform 0.1s ease, box-shadow 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#20ba5a'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#25D366'}
          >
            <span style={{ fontSize: '1.2rem' }}>💬</span>
            <span>Launch WhatsApp Chat (wa.me)</span>
            <ExternalLink size={16} />
          </button>
        </div>

      </div>

      {/* 3. Registered Users Quick Directory */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#f3e8ff',
              color: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>
                Registered Users WhatsApp Directory
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Search any member and launch direct WhatsApp chat in 1 click
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
            <div style={{ position: 'relative', width: isMobile ? '100%' : '280px' }}>
              <input
                type="text"
                placeholder="Search name or phone..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  fetchUsersDirectory(e.target.value);
                }}
                style={{
                  width: '100%',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 12px 8px 34px',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
            <button
              type="button"
              onClick={() => fetchUsersDirectory(userSearch)}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}
              title="Refresh users"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* User Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '700' }}>#</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '700' }}>User Name</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '700' }}>Mobile Number</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '700' }}>Wallet Balance</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '700' }}>Joined Date</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '700', textAlign: 'center' }}>WhatsApp Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const phone = String(u.phone || u.username || '').replace(/\D/g, '').slice(-10);
                  const name = u.name || u.user_name || 'Member';
                  const walletBal = u.wallet !== undefined ? u.wallet : (u.wallet_amount || 0);

                  return (
                    <tr
                      key={u.id || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1e293b' }}>
                        {name}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#334155', fontWeight: '600' }}>
                        {phone ? `+91 ${phone}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: '700' }}>
                        ₹{Number(walletBal).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem' }}>
                        {u.date || u.created_at || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleSelectUser(u)}
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                            title="Load into Launcher"
                          >
                            Use in Launcher
                          </button>

                          {phone.length === 10 && (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectUser(u);
                                handleOpenWhatsAppChat(phone, `Hello ${name}, greeting from Bharat Matka Support! How can I assist you today?`);
                              }}
                              style={{
                                backgroundColor: '#25D366',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 12px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 6px rgba(37,211,102,0.3)'
                              }}
                              title="Direct 1-Click WhatsApp Chat"
                            >
                              <span>💬 Chat Now</span>
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminSupportChat;
