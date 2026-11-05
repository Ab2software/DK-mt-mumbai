import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, BarChart3, PlusCircle, ArrowUpRight, Trophy, Percent, Megaphone, Clock, Sparkles, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import api from '../utils/api';
import { compareMarketTimes } from '../utils/timeSort';

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [sortBy, setSortBy] = useState('time_asc');
  const [marketFilter, setMarketFilter] = useState('all');
  const [alertMsg, setAlertMsg] = useState('Welcome to Bharat Matka! Place your bets wisely.');
  const [welcomeToast, setWelcomeToast] = useState(null);
  const [sliderStatus, setSliderStatus] = useState('1');
  const [sliders, setSliders] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const justRegistered = sessionStorage.getItem('just_registered_welcome');
      if (justRegistered) {
        sessionStorage.removeItem('just_registered_welcome');
        setWelcomeToast(`🎉 Welcome, ${justRegistered}! Your account has been registered successfully.`);
        setTimeout(() => setWelcomeToast(null), 8000);
      }
    } catch (e) {}
  }, []);

  const loadData = async () => {
    try {
      const [gamesRes, walletRes, appRes] = await Promise.all([
        api.get('/games').catch(() => null),
        api.get('/wallet/info').catch(() => null),
        api.get('/app-info').catch(() => null)
      ]);

      if (gamesRes?.data?.result) {
        const sorted = [...gamesRes.data.result].sort(compareMarketTimes);
        setGames(sorted);
      }

      if (appRes?.data?.data) {
        setSliderStatus(appRes.data.data.slider_status ?? '1');
        if (Array.isArray(appRes.data.data.sliders) && appRes.data.data.sliders.length > 0) {
          setSliders(appRes.data.data.sliders);
        }
      }

      const walletAlert = walletRes?.data?.data?.alert_message;
      const appAlert = appRes?.data?.data?.alert_message;
      const msg = walletAlert || appAlert || '';
      if (msg) {
        setAlertMsg(msg);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);

    const handleAppRefresh = () => {
      loadData();
    };
    window.addEventListener('app_refresh', handleAppRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('app_refresh', handleAppRefresh);
    };
  }, []);

  // Auto-play slider carousel every 4 seconds
  useEffect(() => {
    if (sliderStatus === '1' && sliders.length > 1) {
      const slideTimer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % sliders.length);
      }, 4000);
      return () => clearInterval(slideTimer);
    }
  }, [sliderStatus, sliders.length]);

  const cleanTimeToToday = (timeStr) => {
    if (!timeStr) return null;
    const clean = String(timeStr).trim().toLowerCase();
    const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[4];
    if (modifier === 'pm' && hours < 12) hours += 12;
    else if (modifier === 'am' && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const isMarketOpen = (g) => {
    try {
      if (!g) return false;
      if (g.is_running !== undefined) {
        return !!g.is_running;
      }
      if (g.game_status !== undefined && String(g.game_status) === '0') {
        return false;
      }

      const now = new Date();
      const closeTime = cleanTimeToToday(g.close_time);
      if (!closeTime) return false;

      const openTime = cleanTimeToToday(g.open_time);
      if (openTime && closeTime.getTime() <= openTime.getTime()) {
        if (now.getTime() >= openTime.getTime()) {
          closeTime.setDate(closeTime.getDate() + 1);
        } else if (now.getTime() <= closeTime.getTime()) {
          // overnight session past midnight
        } else {
          closeTime.setDate(closeTime.getDate() + 1);
        }
      }

      return now.getTime() <= closeTime.getTime();
    } catch (e) {
      return false;
    }
  };

  const sortedGames = useMemo(() => {
    let list = [...games];

    if (marketFilter === 'open') {
      list = list.filter(g => isMarketOpen(g));
    } else if (marketFilter === 'closed') {
      list = list.filter(g => !isMarketOpen(g));
    }

    return list.sort((a, b) => {
      if (sortBy === 'open_first') {
        const openA = isMarketOpen(a) ? 1 : 0;
        const openB = isMarketOpen(b) ? 1 : 0;
        if (openA !== openB) return openB - openA;
        return compareMarketTimes(a, b);
      }
      if (sortBy === 'time_desc') {
        return compareMarketTimes(b, a);
      }
      if (sortBy === 'name_asc') {
        return (a.games_name || '').localeCompare(b.games_name || '');
      }
      // Default: 'time_asc' - Market Time (Earliest Open to Latest)
      return compareMarketTimes(a, b);
    });
  }, [games, sortBy, marketFilter]);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px 16px 32px' }}>
      {/* Welcome Toast Notification on New User Registration */}
      {welcomeToast && (
        <div style={{
          backgroundColor: '#065f46',
          border: '1px solid #10b981',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} style={{ color: '#34d399', flexShrink: 0 }} />
            <span style={{ fontSize: '0.92rem', fontWeight: '600' }}>{welcomeToast}</span>
          </div>
          <button
            onClick={() => setWelcomeToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.3rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px'
            }}
            title="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {/* Marquee Notice Banner */}
      {alertMsg && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '10px 16px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0, 30, 80, 0.06)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#043490',
            padding: '6px 12px',
            borderRadius: '50px',
            flexShrink: 0
          }}>
            <Megaphone size={16} style={{ color: '#ffffff' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              NOTICE
            </span>
          </div>

          <marquee style={{ color: '#1e293b', fontWeight: '600', fontSize: '0.92rem', verticalAlign: 'middle' }}>
            <span style={{ color: '#ff7607', fontWeight: '800', marginRight: '8px' }}>★</span>
            {alertMsg}
          </marquee>
        </div>
      )}

      {/* Multiple Image Slider Carousel Banner */}
      {sliderStatus === '1' && sliders.length > 0 && (
        <div style={{
          position: 'relative',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0, 30, 80, 0.08)',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          <div style={{
            display: 'flex',
            transition: 'transform 0.5s ease-in-out',
            transform: `translateX(-${currentSlide * 100}%)`,
            width: '100%'
          }}>
            {sliders.map((img, idx) => {
              const src = img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')
                ? img
                : (img.startsWith('/') ? img : `/uploads/${img}`);

              return (
                <div key={idx} style={{ minWidth: '100%', flexShrink: 0, height: '180px', position: 'relative' }}>
                  <img
                    src={src}
                    alt={`Banner ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      if (!e.target.dataset.fallbackTried && !img.startsWith('http') && !img.startsWith('data:')) {
                        e.target.dataset.fallbackTried = 'true';
                        e.target.src = `/${img.replace(/^\//, '')}`;
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Prev/Next Controls */}
          {sliders.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentSlide(prev => (prev - 1 + sliders.length) % sliders.length)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '10px',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide(prev => (prev + 1) % sliders.length)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '10px',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2
                }}
              >
                <ChevronRight size={20} />
              </button>

              {/* Dot Indicators */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                zIndex: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '4px 10px',
                borderRadius: '12px',
                backdropFilter: 'blur(4px)'
              }}>
                {sliders.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    style={{
                      width: currentSlide === i ? '18px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: currentSlide === i ? '#FF6B00' : 'rgba(255, 255, 255, 0.5)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Quick Action Shortcut Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <Link to="/add-fund" className="quick-action-pill">
          <PlusCircle size={20} style={{ color: '#00A843' }} />
          <span>Add Points</span>
        </Link>
        <Link to="/withdraw" className="quick-action-pill">
          <ArrowUpRight size={20} style={{ color: '#EF4444' }} />
          <span>Withdraw</span>
        </Link>
        <Link to="/win-history" className="quick-action-pill">
          <Trophy size={20} style={{ color: '#F59E0B' }} />
          <span>Win History</span>
        </Link>
        <Link to="/game-rate" className="quick-action-pill">
          <Percent size={20} style={{ color: '#043490' }} />
          <span>Game Rates</span>
        </Link>
      </div>

      {/* Markets Section Header & Sorting Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h4 style={{
            color: '#043490',
            fontWeight: '800',
            fontSize: '1.25rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={20} style={{ color: '#043490' }} /> Live Game Markets
          </h4>
          <span style={{
            fontSize: '0.72rem',
            padding: '3px 8px',
            borderRadius: '12px',
            background: 'rgba(4, 52, 144, 0.08)',
            border: '1px solid rgba(4, 52, 144, 0.2)',
            color: '#043490',
            fontWeight: '700'
          }}>
            {sortedGames.length} Markets
          </span>
        </div>

        {/* Sort & Filter Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {/* Quick Filter: All / Open Only */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setMarketFilter('all')}
              style={{
                background: marketFilter === 'all' ? '#043490' : 'transparent',
                color: marketFilter === 'all' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setMarketFilter('open')}
              style={{
                background: marketFilter === 'open' ? '#059669' : 'transparent',
                color: marketFilter === 'open' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ● Open Only
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '4px 8px',
            boxShadow: '0 2px 8px rgba(0, 30, 80, 0.04)'
          }}>
            <Clock size={14} style={{ color: '#043490', flexShrink: 0 }} />
            <select
              id="market-sort-select"
              aria-label="Sort Live Markets"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1e293b',
                fontSize: '0.76rem',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none',
                paddingRight: '4px'
              }}
            >
              <option value="time_asc" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
                ⏰ Time: Earliest First
              </option>
              <option value="open_first" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
                🟢 Open Markets First
              </option>
              <option value="time_desc" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
                ⏰ Time: Latest First
              </option>
              <option value="name_asc" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
                🔤 Name: A to Z
              </option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', borderTopColor: '#043490' }} />
          <span style={{ fontWeight: '600' }}>Loading live markets...</span>
        </div>
      ) : sortedGames.length === 0 ? (
        <div className="card-glass-v2" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          {marketFilter === 'open' ? (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: '600' }}>No open markets available right now.</p>
              <button
                type="button"
                onClick={() => setMarketFilter('all')}
                style={{
                  background: '#EEF2FF',
                  border: '1px solid #043490',
                  color: '#043490',
                  borderRadius: '8px',
                  padding: '6px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                View All Markets
              </button>
            </div>
          ) : (
            <span style={{ fontWeight: '600' }}>No active games found for today.</span>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px'
        }}>
          {sortedGames.map((g) => {
            const open = isMarketOpen(g);
            return (
              <div
                key={g.id || g.games_name}
                className="game-card-v2"
                style={{ padding: '12px 14px', borderRadius: '16px' }}
              >
                {/* Top Row: Game Name & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    fontWeight: '800',
                    margin: 0,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                  }}>
                    {g.games_name}
                  </h4>
                  <span className={open ? 'badge-open-v2' : 'badge-closed-v2'} style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                    {open ? '● Open' : '✕ Closed'}
                  </span>
                </div>

                {/* Middle Row: Result & Timings (Combined Compact Box) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  {/* Left: Result */}
                  <div>
                    <span style={{ fontSize: '0.64rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', display: 'block', lineHeight: 1 }}>
                      Result
                    </span>
                    <span style={{
                      fontSize: '1.15rem',
                      fontWeight: '800',
                      color: '#043490',
                      letterSpacing: '1.5px',
                      fontFamily: 'monospace',
                      marginTop: '2px',
                      display: 'inline-block'
                    }}>
                      {g.open_pana || '***'}-{(g.open_digit || '*') + (g.close_digit || '*')}-{g.close_pana || '***'}
                    </span>
                  </div>

                  {/* Right: Timings */}
                  <div style={{ textAlign: 'right', fontSize: '0.74rem' }}>
                    <div style={{ color: '#334155' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.64rem', fontWeight: '600', marginRight: '4px' }}>OPEN:</span>
                      <strong>{g.open_time}</strong>
                    </div>
                    <div style={{ color: '#043490', marginTop: '2px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.64rem', fontWeight: '600', marginRight: '4px' }}>CLOSE:</span>
                      <strong>{g.close_time}</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Chart Link & Play Action */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Link
                    to={`/chart?game=${encodeURIComponent(g.games_name)}`}
                    style={{
                      color: '#043490',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <BarChart3 size={14} style={{ color: '#043490' }} />
                    <span>Chart</span>
                  </Link>

                  {open ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/game-types?game=${encodeURIComponent(g.games_name)}&openTime=${encodeURIComponent(g.open_time || '')}&closeTime=${encodeURIComponent(g.close_time || '')}`)}
                      style={{
                        background: '#043490',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '6px 16px',
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 3px 10px rgba(4, 52, 144, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Play size={14} fill="#ffffff" />
                      <span>Play Now</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: '#94a3b8',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '6px 14px',
                        fontWeight: '600',
                        fontSize: '0.78rem',
                        cursor: 'not-allowed'
                      }}
                    >
                      Closed
                    </button>
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

export default Dashboard;
