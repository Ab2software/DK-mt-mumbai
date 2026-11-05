import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Calendar, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const Chart = () => {
  const [searchParams] = useSearchParams();
  const gameName = searchParams.get('game');
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChartData = async () => {
    if (!gameName) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/games/chart?game_name=${encodeURIComponent(gameName)}`);
      if (res.data.success === '1') {
        setChartData(res.data.data || []);
      } else {
        setError(res.data.error || 'Failed to load chart data');
      }
    } catch (err) {
      console.error(err);
      setError('Connection refused by Backend Server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
  }, [gameName]);

  const formatDate = (dateStr) => {
    try {
      const dateObj = new Date(dateStr);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = days[dateObj.getDay()];
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      
      return {
        formatted: `${day} ${monthName} ${year}`,
        day: dayName
      };
    } catch (e) {
      return { formatted: dateStr, day: '' };
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', padding: '16px 14px' }}>
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
            <BarChart3 size={20} style={{ color: '#ffb703' }} />
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>{gameName} Panel Chart</span>
          </div>
        </div>
      </div>

      <div className="card-glass-v2" style={{ width: '100%', borderRadius: '18px', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#043490', fontSize: '1.35rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
            {gameName} Result Chart
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Historical result chart for the last 30 games
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '12px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#64748b' }}>
            Loading result chart...
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <Calendar size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <div>No records found for this game yet.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', background: '#f8fafc' }}>
                  <th style={{ padding: '12px', color: '#043490', textTransform: 'uppercase', fontSize: '0.82rem', textAlign: 'center', fontWeight: '800' }}>Day / Date</th>
                  <th style={{ padding: '12px', color: '#043490', textTransform: 'uppercase', fontSize: '0.82rem', textAlign: 'center', fontWeight: '800' }}>Open Pana</th>
                  <th style={{ padding: '12px', color: '#043490', textTransform: 'uppercase', fontSize: '0.82rem', textAlign: 'center', fontWeight: '800' }}>Jodi</th>
                  <th style={{ padding: '12px', color: '#043490', textTransform: 'uppercase', fontSize: '0.82rem', textAlign: 'center', fontWeight: '800' }}>Close Pana</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => {
                  const dateInfo = formatDate(row.date);
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.88rem', color: '#0f172a' }}>
                        <span style={{ fontWeight: '800', color: '#043490' }}>{dateInfo.day}</span>
                        <br />
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{dateInfo.formatted}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.98rem', fontWeight: '700', color: '#0f172a', letterSpacing: '1px' }}>
                        {row.open_panna || '***'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '1.25rem', fontWeight: '900', color: '#e65100' }}>
                        {(row.open_digit !== null && row.open_digit !== undefined && row.open_digit !== '') ? row.open_digit : '*'}
                        {(row.close_digit !== null && row.close_digit !== undefined && row.close_digit !== '') ? row.close_digit : '*'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.98rem', fontWeight: '700', color: '#0f172a', letterSpacing: '1px' }}>
                        {row.close_panna || '***'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;

