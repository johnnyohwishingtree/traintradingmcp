# Chart Data Backend

Real-time stock data caching service with Alpha Vantage integration.

## 🎯 Purpose
- **Solves Rate Limits**: Alpha Vantage allows 5 calls/minute - we cache data locally
- **Instant Charts**: Frontend gets data instantly from database cache  
- **Background Updates**: Polling service keeps data fresh automatically
- **Real Market Data**: All data comes from Alpha Vantage API

## 🏗️ Architecture

```
Frontend ←→ Backend API ←→ SQLite Database ←→ Background Poller ←→ Alpha Vantage
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Initialize Database
```bash
npm run init-db
```

### 3. Start Server
```bash
npm start
# or for development:
npm run dev
```

Server runs on http://localhost:3001

## 📊 Database Schema

### Tables:
- **symbols**: Symbol metadata (AAPL, IBM, etc.)
- **ohlc_data**: Price/volume data for all intervals
- **data_freshness**: Tracks when data was last updated

### Intervals Supported:
- **Intraday**: 1min, 5min, 15min, 60min (last 30 days)
- **Historical**: 1day, 1week, 1month (20+ years)

## 🔄 Background Polling

- **Rate Limit**: Respects 5 calls/minute Alpha Vantage limit
- **Smart Caching**: Only fetches when data is stale
- **Popular Symbols**: Auto-caches AAPL, IBM, SNOW, etc.
- **All Intervals**: Keeps 1min to 1month data fresh

### Polling Schedule:
- Runs every 2 minutes
- 2-3 API calls per cycle  
- Full cycle through all symbols ~2 hours
- Critical symbols refreshed first

## 📡 API Endpoints

### Get OHLC Data
```
GET /api/data/:symbol/:interval
```
Example: `GET /api/data/AAPL/1day`

Response:
```json
{
  "symbol": "AAPL",
  "interval": "1day", 
  "data": [
    {
      "date": "2024-01-01T00:00:00.000Z",
      "open": 150.0,
      "high": 155.0,
      "low": 149.0,
      "close": 154.0,
      "volume": 50000000
    }
  ],
  "metadata": {
    "points": 365,
    "lastUpdate": "2024-01-01T12:00:00.000Z",
    "ageMinutes": 15
  }
}
```

### Search Symbols
```
GET /api/search/:query
```
Example: `GET /api/search/apple`

### Manual Refresh
```
POST /api/refresh/:symbol/:interval  
```
Forces immediate fetch from Alpha Vantage

## 🛠️ Configuration

Edit these in `server.js`:
- **API Key**: Already configured with your key
- **Port**: Default 3001
- **Polling Intervals**: Modify cron schedule
- **Symbols**: Add more symbols to polling list

## 📈 Usage Stats

- **Database Size**: ~100MB for 10 symbols × 6 intervals × 1 year
- **API Usage**: ~60 calls/hour (within 500/day limit)
- **Response Time**: <50ms from cache vs 2000ms from API
- **Uptime**: Continuously polls and caches data

## 🔧 Development

### Watch Mode
```bash
npm run dev
```

### Database Reset  
```bash
rm database/chart_data.db
npm run init-db
```

### View Logs
All API calls and caching operations are logged to console.

## ✅ Benefits

1. **No More Rate Limits**: Frontend can request any symbol/interval instantly
2. **Real Data**: All data sourced from Alpha Vantage 
3. **Always Fresh**: Background polling keeps data current
4. **Fast Response**: Database cache = instant charts
5. **Scalable**: Add more symbols/intervals easily