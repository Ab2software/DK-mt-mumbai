# Bharat Matka - Public Result API (ResultApi)

Welcome to the **Public Declared Market Results API** for Bharat Matka. This API allows fetching real-time and historical market results directly from the admin declared results database (`result_chart` & `game_time`).

No authentication or API key is required — this API is completely **Public**.

---

## 🚀 How to Run Standalone

```bash
cd ResultApi
npm install
npm start
```

Default Port: `5002` (configurable in `.env` or with `PORT=5002`).

---

## 📡 Available Public Endpoints

### 1. Today's All Market Results
- **URL:** `GET /today` or `GET /api/results/today`
- **Description:** Returns all markets for today with their live timings and current declared result numbers.
- **Example Response:**
```json
{
  "success": "1",
  "total_markets": 44,
  "declared_count": 12,
  "current_date_ist": "2026-11-02",
  "current_time_ist": "01:30:00 PM",
  "data": [
    {
      "id": 1,
      "market_name": "MILAN MORNING",
      "game_name": "MILAN MORNING",
      "open_time": "10:15 AM",
      "close_time": "11:15 AM",
      "status": "1",
      "date": "2026-11-02",
      "open_pana": "148",
      "open_digit": "3",
      "close_pana": "239",
      "close_digit": "4",
      "jodi": "34",
      "result_display": "148-34-239",
      "is_declared_today": true,
      "is_open_declared": true,
      "is_close_declared": true,
      "status_label": "RESULT DECLARED"
    }
  ]
}
```

---

### 2. Live Declared Results (Only Declared Markets)
- **URL:** `GET /live` or `GET /api/results/live`
- **Description:** Returns only the markets that have open or close results declared today.
- **Example Response:**
```json
{
  "success": "1",
  "current_date_ist": "2026-11-02",
  "declared_count": 5,
  "data": [
    {
      "id": 352,
      "market_name": "KALYAN",
      "date": "2026-11-02",
      "open_time": "04:10 PM",
      "close_time": "06:10 PM",
      "open_pana": "358",
      "open_digit": "6",
      "close_pana": "***",
      "close_digit": "*",
      "jodi": "6*",
      "result_display": "358-6*-***",
      "is_open_declared": true,
      "is_close_declared": false
    }
  ]
}
```

---

### 3. All Declared Results History with Filters
- **URL:** `GET /all` or `GET /api/results/all`
- **Query Parameters:**
  - `date`: Filter by date (e.g. `?date=2026-11-02`)
  - `game_name`: Filter by market name (e.g. `?game_name=KALYAN`)
  - `limit`: Number of results (default `100`, max `500`)
  - `page`: Page number for pagination (default `1`)
- **Example:** `GET /all?game_name=KALYAN&limit=10`

---

### 4. Latest Declared Results
- **URL:** `GET /latest` or `GET /api/results/latest`
- **Query Parameters:**
  - `limit`: Number of results (default `20`, max `100`)
- **Description:** Returns the most recent declared results across all games.

---

### 5. Specific Market Results History
- **URL:** `GET /market/:gameName` or `GET /api/results/market/:gameName`
- **Example:** `GET /market/KALYAN?limit=30`
- **Description:** Returns the last 30 declared results for the specified market.

---

### 6. Results by Specific Date
- **URL:** `GET /date/:date` or `GET /api/results/date/:date`
- **Example:** `GET /date/2026-11-02`
- **Description:** Returns all market results declared on the specified date.

---

### 7. Market Panel & Jodi Chart Data
- **URL:** `GET /chart/:gameName` or `GET /api/results/chart/:gameName`
- **Example:** `GET /chart/KALYAN`
- **Description:** Complete chronological panel and jodi chart data for charting tables.

---

### 8. All Markets List
- **URL:** `GET /markets` or `GET /api/results/markets`
- **Description:** Returns the full list of all markets and their scheduled open/close times.

---

## 🔒 Security & Performance
- **Public Access:** No authentication or tokens required.
- **CORS Enabled:** Fully accessible from any browser, web app, Android WebView, or external server.
- **High Performance:** Pre-fetched in-memory indexing to serve responses under 15ms.
- **IST Timezone:** All dates, times, and timestamps are in India Standard Time (+05:30).
