# Algo Lambda - Vercel Serverless API

A serverless API for calculating swing points from OHLC (Open, High, Low, Close) candlestick data, deployed on Vercel.

## 🚀 Vercel Deployment

### Project Structure
```
algo-lambda/
├── api/
│   └── swing-points/
│       └── calculate.ts     # Serverless function endpoint
├── lib/
│   ├── swingsCalculation.ts # Utility functions
│   ├── swingPointCalculator.ts # Core algorithm
│   └── types/
│       └── candle.ts        # TypeScript types
├── vercel.json              # Vercel configuration
└── package.json             # Dependencies
```

### Live API Endpoint
Once deployed, your API will be available at:
```
https://your-project-name.vercel.app/api/swing-points/calculate
```

### Local Development
```bash
# Install dependencies
npm install

# Install Vercel CLI globally (if not already installed)
npm i -g vercel

# Start local development server
npm run dev
```

### Deployment
```bash
# Deploy to Vercel
npm run deploy
```

## API Usage

### Endpoint
```
POST /api/swing-points/calculate
```

### Request Body
```json
{
  "instrumentKey": "NSE_EQ|INE002A01018",
  "companyName": "Reliance Industries",
  "fromDate": "2023-01-01",
  "lookback": 5
}
```

### Response
```json
{
  "success": true,
  "data": {
    "instrumentKey": "NSE_EQ|INE002A01018",
    "companyName": "Reliance Industries",
    "timeframe": 1,
    "swingPointsDay": [...],
    "swingPoints4H": [...],
    "swingPoints1H": [...],
    "swingPoints15Min": [...]
  }
}
```

### cURL Example
```bash
curl -X POST https://your-project-name.vercel.app/api/swing-points/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "instrumentKey": "NSE_EQ|INE002A01018",
    "companyName": "Reliance Industries",
    "fromDate": "2023-01-01"
  }'
```

## Features

- ✅ **Serverless Architecture**: Scales automatically with Vercel
- ✅ **TypeScript Support**: Fully typed serverless functions
- ✅ **Multi-timeframe Analysis**: 15min, 1H, 4H, and Daily swing points
- ✅ **Mock Data Support**: Built-in sample data generation
- ✅ **Error Handling**: Comprehensive validation and error responses
- ✅ **Fast Cold Starts**: Optimized for serverless deployment

## Configuration

### Vercel Settings
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: Leave empty (serverless functions)
- **Install Command**: `npm install`

### Environment Variables
Add any required environment variables in your Vercel dashboard:
- `NODE_ENV=production`
- Add your API keys if needed

## Limitations

- **Function Timeout**: 30 seconds (configurable in vercel.json)
- **Memory**: 1024MB (Vercel default)
- **Cold Start**: ~1-2 seconds for first request after idle

## Monitoring

Monitor your serverless functions in the Vercel dashboard:
- Function logs
- Performance metrics
- Error tracking
- Usage analytics