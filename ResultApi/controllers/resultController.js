const db = require('../config/db');
const {
  getISTDate,
  getISTDateStr,
  getISTTime12h,
  compareMarketTimes
} = require('../utils/istDate');

// Helper: Format result string (e.g. 123-45-678)
function formatResultDisplay(openPana, openDigit, closePana, closeDigit) {
  const oP = (openPana && String(openPana).trim() !== '') ? String(openPana).trim() : '***';
  const oD = (openDigit !== null && openDigit !== undefined && String(openDigit).trim() !== '') ? String(openDigit).trim() : '*';
  const cP = (closePana && String(closePana).trim() !== '') ? String(closePana).trim() : '***';
  const cD = (closeDigit !== null && closeDigit !== undefined && String(closeDigit).trim() !== '') ? String(closeDigit).trim() : '*';

  let jodi = '**';
  if (oD !== '*' && cD !== '*') {
    jodi = `${oD}${cD}`;
  } else if (oD !== '*') {
    jodi = `${oD}*`;
  } else if (cD !== '*') {
    jodi = `*${cD}`;
  }

  return {
    open_pana: oP,
    open_digit: oD,
    close_pana: cP,
    close_digit: cD,
    jodi: jodi,
    result_display: `${oP}-${jodi}-${cP}`
  };
}

// 1. API Documentation / Overview
exports.getApiOverview = async (req, res) => {
  const nowIST = getISTDate();
  return res.json({
    success: '1',
    api_name: 'Bharat Matka Public Result API',
    version: '1.0.0',
    current_time_ist: getISTTime12h(nowIST, true),
    current_date_ist: getISTDateStr(nowIST),
    description: 'Public API to fetch real-time and historical declared market results (result_chart). No authentication required.',
    endpoints: {
      today_results: {
        method: 'GET',
        path: '/api/results/today',
        description: "Fetch all active markets with today's live declared results"
      },
      live_declared: {
        method: 'GET',
        path: '/api/results/live',
        description: 'Fetch only the markets that have results declared today'
      },
      all_results: {
        method: 'GET',
        path: '/api/results/all',
        description: 'Fetch declared results history with optional filters (?date=YYYY-MM-DD, ?game_name=NAME, ?limit=50, ?page=1)'
      },
      latest_results: {
        method: 'GET',
        path: '/api/results/latest',
        description: 'Fetch latest 20 declared market results across all games'
      },
      market_history: {
        method: 'GET',
        path: '/api/results/market/:gameName',
        description: 'Fetch historical declared results for a specific market (?limit=30)'
      },
      results_by_date: {
        method: 'GET',
        path: '/api/results/date/:date',
        description: 'Fetch all declared results for a specific date (YYYY-MM-DD)'
      },
      market_chart: {
        method: 'GET',
        path: '/api/results/chart/:gameName',
        description: 'Fetch complete Panel & Jodi chart data for a specific market'
      },
      markets_list: {
        method: 'GET',
        path: '/api/results/markets',
        description: 'Fetch all registered markets with open/close timings'
      }
    }
  });
};

// 2. Today's All Market Results (Live Status & Declared Numbers)
exports.getTodayResults = async (req, res) => {
  try {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const nowIST = getISTDate();
    const todayDayName = daysOfWeek[nowIST.getDay()];
    const todayDateStr = getISTDateStr(nowIST);

    // Fetch distinct games for today from game_time
    let gameRows = [];
    try {
      const [rows] = await db.query(
        `SELECT g1.* FROM game_time g1
         INNER JOIN (
           SELECT game, MIN(id) as min_id FROM game_time WHERE LOWER(TRIM(day)) = LOWER(?) GROUP BY game
         ) g2 ON g1.id = g2.min_id
         ORDER BY g1.id ASC`,
        [todayDayName]
      );
      gameRows = rows;
    } catch (e) {
      gameRows = [];
    }

    // Fallback if no day match
    if (!gameRows || gameRows.length === 0) {
      try {
        const [rows] = await db.query(
          `SELECT g1.* FROM game_time g1
           INNER JOIN (
             SELECT game, MIN(id) as min_id FROM game_time GROUP BY game
           ) g2 ON g1.id = g2.min_id
           ORDER BY g1.id ASC`
        );
        gameRows = rows;
      } catch (err2) {
        try {
          const [chartGames] = await db.query('SELECT DISTINCT game_name as game FROM result_chart');
          gameRows = chartGames.map((g, idx) => ({
            id: idx + 1,
            game: g.game,
            open_time: '10:00 AM',
            close_time: '05:00 PM',
            status: '1'
          }));
        } catch (err3) {
          gameRows = [];
        }
      }
    }

    // Pre-fetch today's declared results in a single fast batch query
    const todayResultMap = new Map();
    try {
      const [results] = await db.query(
        'SELECT id, game_name, date, open_panna, open_digit, close_panna, close_digit, status FROM result_chart WHERE date = ? OR DATE(date) = ? OR date LIKE ?',
        [todayDateStr, todayDateStr, `${todayDateStr}%`]
      );
      for (const r of results) {
        if (r.game_name) {
          todayResultMap.set(String(r.game_name).trim().toLowerCase(), r);
        }
      }
    } catch (e) {
      console.error('Error prefetching today results:', e.message);
    }

    const marketResults = [];

    for (const g of gameRows) {
      const gName = g.game || g.game_name || 'MARKET';
      const gKey = String(gName).trim().toLowerCase();
      const openTime = g.open_time || '10:00 AM';
      const closeTime = g.close_time || '05:00 PM';
      const gameStatus = g.status !== undefined ? String(g.status) : '1';

      const resChart = todayResultMap.get(gKey);

      let rawOpenPana = resChart ? resChart.open_panna : '';
      let rawOpenDigit = resChart ? resChart.open_digit : '';
      let rawClosePana = resChart ? resChart.close_panna : '';
      let rawCloseDigit = resChart ? resChart.close_digit : '';

      const formatted = formatResultDisplay(rawOpenPana, rawOpenDigit, rawClosePana, rawCloseDigit);

      const isOpenDeclared = formatted.open_digit !== '*' && formatted.open_pana !== '***';
      const isCloseDeclared = formatted.close_digit !== '*' && formatted.close_pana !== '***';
      const isDeclaredToday = isOpenDeclared || isCloseDeclared;

      let statusLabel = 'CLOSED';
      if (isDeclaredToday) {
        statusLabel = isCloseDeclared ? 'RESULT DECLARED' : 'OPEN DECLARED';
      } else if (gameStatus !== '0') {
        statusLabel = 'LIVE';
      }

      marketResults.push({
        id: g.id || 0,
        result_id: resChart ? resChart.id : null,
        market_name: gName,
        game_name: gName,
        open_time: openTime,
        close_time: closeTime,
        status: gameStatus,
        date: todayDateStr,
        open_pana: formatted.open_pana,
        open_digit: formatted.open_digit,
        close_pana: formatted.close_pana,
        close_digit: formatted.close_digit,
        jodi: formatted.jodi,
        result_display: formatted.result_display,
        is_declared_today: isDeclaredToday,
        is_open_declared: isOpenDeclared,
        is_close_declared: isCloseDeclared,
        status_label: statusLabel
      });
    }

    marketResults.sort(compareMarketTimes);

    return res.json({
      success: '1',
      total_markets: marketResults.length,
      declared_count: marketResults.filter(m => m.is_declared_today).length,
      current_date_ist: todayDateStr,
      current_time_ist: getISTTime12h(nowIST, true),
      data: marketResults
    });
  } catch (err) {
    console.error('getTodayResults error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 3. Live Declared Results Only (Filters out un-declared markets)
exports.getLiveDeclaredResults = async (req, res) => {
  try {
    const nowIST = getISTDate();
    const todayDateStr = getISTDateStr(nowIST);

    const [rows] = await db.query(
      `SELECT r.*, g.open_time, g.close_time 
       FROM result_chart r
       LEFT JOIN (
         SELECT game, MIN(open_time) as open_time, MIN(close_time) as close_time 
         FROM game_time GROUP BY game
       ) g ON LOWER(TRIM(r.game_name)) = LOWER(TRIM(g.game))
       WHERE r.date = ? OR DATE(r.date) = ? OR r.date LIKE ?
       ORDER BY r.id DESC`,
      [todayDateStr, todayDateStr, `${todayDateStr}%`]
    );

    const declaredList = rows.map(r => {
      const formatted = formatResultDisplay(r.open_panna, r.open_digit, r.close_panna, r.close_digit);
      return {
        id: r.id,
        market_name: r.game_name,
        game_name: r.game_name,
        date: r.date,
        open_time: r.open_time || '',
        close_time: r.close_time || '',
        open_pana: formatted.open_pana,
        open_digit: formatted.open_digit,
        close_pana: formatted.close_pana,
        close_digit: formatted.close_digit,
        jodi: formatted.jodi,
        result_display: formatted.result_display,
        is_open_declared: formatted.open_digit !== '*',
        is_close_declared: formatted.close_digit !== '*'
      };
    });

    return res.json({
      success: '1',
      current_date_ist: todayDateStr,
      declared_count: declaredList.length,
      data: declaredList
    });
  } catch (err) {
    console.error('getLiveDeclaredResults error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 4. All Declared Results with Search, Filter & Pagination
exports.getAllDeclaredResults = async (req, res) => {
  try {
    const { date, game_name, limit = 100, page = 1 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM result_chart WHERE 1=1';
    const params = [];

    if (date && String(date).trim() !== '') {
      const cleanDate = String(date).trim();
      sql += ' AND (date = ? OR DATE(date) = ? OR date LIKE ?)';
      params.push(cleanDate, cleanDate, `${cleanDate}%`);
    }

    if (game_name && String(game_name).trim() !== '') {
      sql += ' AND LOWER(TRIM(game_name)) = LOWER(TRIM(?))';
      params.push(String(game_name).trim());
    }

    // Get total count
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await db.query(countSql, params);
    const totalCount = countRows[0] ? countRows[0].total : 0;

    sql += ' ORDER BY date DESC, id DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [rows] = await db.query(sql, params);

    const data = rows.map(r => {
      const formatted = formatResultDisplay(r.open_panna, r.open_digit, r.close_panna, r.close_digit);
      return {
        id: r.id,
        game_name: r.game_name,
        market_name: r.game_name,
        date: r.date,
        open_pana: formatted.open_pana,
        open_digit: formatted.open_digit,
        close_pana: formatted.close_pana,
        close_digit: formatted.close_digit,
        jodi: formatted.jodi,
        result_display: formatted.result_display,
        created_at: r.created_at || null
      };
    });

    return res.json({
      success: '1',
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalCount / limitNum),
      data: data
    });
  } catch (err) {
    console.error('getAllDeclaredResults error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 5. Historical Results for a specific Market
exports.getMarketResults = async (req, res) => {
  try {
    const gameName = req.params.gameName || req.query.game_name;
    if (!gameName || String(gameName).trim() === '') {
      return res.status(400).json({ success: '0', msg: 'Game name / market parameter is required' });
    }

    const limitNum = Math.min(365, Math.max(1, parseInt(req.query.limit, 10) || 30));

    const [rows] = await db.query(
      'SELECT * FROM result_chart WHERE LOWER(TRIM(game_name)) = LOWER(TRIM(?)) ORDER BY date DESC, id DESC LIMIT ?',
      [String(gameName).trim(), limitNum]
    );

    const history = rows.map(r => {
      const formatted = formatResultDisplay(r.open_panna, r.open_digit, r.close_panna, r.close_digit);
      return {
        id: r.id,
        date: r.date,
        game_name: r.game_name,
        open_pana: formatted.open_pana,
        open_digit: formatted.open_digit,
        close_pana: formatted.close_pana,
        close_digit: formatted.close_digit,
        jodi: formatted.jodi,
        result_display: formatted.result_display
      };
    });

    return res.json({
      success: '1',
      market_name: gameName,
      total_records: history.length,
      data: history
    });
  } catch (err) {
    console.error('getMarketResults error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 6. Declared Results for a specific Date
exports.getResultByDate = async (req, res) => {
  try {
    const dateParam = req.params.date || req.query.date;
    if (!dateParam || String(dateParam).trim() === '') {
      return res.status(400).json({ success: '0', msg: 'Date parameter is required (YYYY-MM-DD)' });
    }

    const cleanDate = String(dateParam).trim();
    const [rows] = await db.query(
      `SELECT r.*, g.open_time, g.close_time 
       FROM result_chart r
       LEFT JOIN (
         SELECT game, MIN(open_time) as open_time, MIN(close_time) as close_time 
         FROM game_time GROUP BY game
       ) g ON LOWER(TRIM(r.game_name)) = LOWER(TRIM(g.game))
       WHERE r.date = ? OR DATE(r.date) = ? OR r.date LIKE ?
       ORDER BY r.id DESC`,
      [cleanDate, cleanDate, `${cleanDate}%`]
    );

    const results = rows.map(r => {
      const formatted = formatResultDisplay(r.open_panna, r.open_digit, r.close_panna, r.close_digit);
      return {
        id: r.id,
        market_name: r.game_name,
        game_name: r.game_name,
        date: r.date,
        open_time: r.open_time || '',
        close_time: r.close_time || '',
        open_pana: formatted.open_pana,
        open_digit: formatted.open_digit,
        close_pana: formatted.close_pana,
        close_digit: formatted.close_digit,
        jodi: formatted.jodi,
        result_display: formatted.result_display
      };
    });

    return res.json({
      success: '1',
      date: cleanDate,
      total_results: results.length,
      data: results
    });
  } catch (err) {
    console.error('getResultByDate error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 7. Latest 20 Declared Results
exports.getLatestResults = async (req, res) => {
  try {
    const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const [rows] = await db.query(
      'SELECT * FROM result_chart WHERE (open_digit != "" OR close_digit != "") ORDER BY id DESC LIMIT ?',
      [limitNum]
    );

    const latest = rows.map(r => {
      const formatted = formatResultDisplay(r.open_panna, r.open_digit, r.close_panna, r.close_digit);
      return {
        id: r.id,
        market_name: r.game_name,
        game_name: r.game_name,
        date: r.date,
        open_pana: formatted.open_pana,
        open_digit: formatted.open_digit,
        close_pana: formatted.close_pana,
        close_digit: formatted.close_digit,
        jodi: formatted.jodi,
        result_display: formatted.result_display
      };
    });

    return res.json({
      success: '1',
      total: latest.length,
      data: latest
    });
  } catch (err) {
    console.error('getLatestResults error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 8. Market Chart Data (Panel & Jodi formats)
exports.getMarketChart = async (req, res) => {
  try {
    const gameName = req.params.gameName || req.query.game_name;
    if (!gameName) {
      return res.status(400).json({ success: '0', msg: 'Game name is required' });
    }

    const [rows] = await db.query(
      'SELECT date, open_panna, open_digit, close_panna, close_digit FROM result_chart WHERE LOWER(TRIM(game_name)) = LOWER(TRIM(?)) ORDER BY date ASC',
      [String(gameName).trim()]
    );

    const chart = rows.map(r => {
      const formatted = formatResultDisplay(r.open_panna, r.open_digit, r.close_panna, r.close_digit);
      return {
        date: r.date,
        open_pana: formatted.open_pana,
        open_digit: formatted.open_digit,
        close_pana: formatted.close_pana,
        close_digit: formatted.close_digit,
        jodi: formatted.jodi,
        display: formatted.result_display
      };
    });

    return res.json({
      success: '1',
      market_name: gameName,
      total_records: chart.length,
      chart: chart
    });
  } catch (err) {
    console.error('getMarketChart error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 9. All Markets List
exports.getMarketsList = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g1.id, g1.game as market_name, g1.open_time, g1.close_time, g1.status
       FROM game_time g1
       INNER JOIN (
         SELECT game, MIN(id) as min_id FROM game_time GROUP BY game
       ) g2 ON g1.id = g2.min_id
       ORDER BY g1.id ASC`
    );

    return res.json({
      success: '1',
      total_markets: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('getMarketsList error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};
