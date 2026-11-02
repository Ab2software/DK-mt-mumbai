const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');

// 1. API Overview & Documentation
router.get('/', resultController.getApiOverview);

// 2. Today's live market results (all markets)
router.get('/today', resultController.getTodayResults);

// 3. Live declared results only (markets with numbers declared today)
router.get('/live', resultController.getLiveDeclaredResults);

// 4. All declared results history (supports ?date=YYYY-MM-DD, ?game_name=NAME, ?limit=50, ?page=1)
router.get('/all', resultController.getAllDeclaredResults);

// 5. Latest declared results across markets
router.get('/latest', resultController.getLatestResults);

// 6. All registered markets list and timings
router.get('/markets', resultController.getMarketsList);

// 7. Results for a specific market
router.get('/market/:gameName', resultController.getMarketResults);

// 8. Results for a specific date (YYYY-MM-DD)
router.get('/date/:date', resultController.getResultByDate);

// 9. Full Panel & Jodi chart for a specific market
router.get('/chart/:gameName', resultController.getMarketChart);

module.exports = router;
