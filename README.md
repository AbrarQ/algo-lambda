# Algo Lambda - Swing Points API

A Node.js/TypeScript API for calculating swing points from OHLC (Open, High, Low, Close) candlestick data. This API provides endpoints for technical analysis of financial market data.

## Features

- **Swing Point Calculation**: Calculate Higher Highs (HH), Higher Lows (HL), Lower Highs (LH), and Lower Lows (LL)
- **Multiple Timeframes**: Support for 15-minute, 1-hour, 4-hour, and daily timeframes
- **TypeScript Support**: Fully typed for better development experience
- **RESTful API**: Clean and intuitive API design
- **Mock Data Support**: Built-in mock data generation for testing

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd algo-lambda
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```
Returns the API health status.

### Calculate Swing Points
```
POST /api/swing-points/calculate
```

Calculate swing points from provided candle data.

**Request Body:**
```json
{
  "candles": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "open": 100.0,
      "high": 105.0,
      "low": 98.0,
      "close": 103.0,
      "volume": 10000
    }
  ],
  "lookback": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swingPoints": [
      {
        "time": 1704067200,
        "price": 105.0,
        "label": "HH",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "index": 5
      }
    ],
    "totalPoints": 1,
    "lookback": 5
  }
}
```

### Analyze Multiple Timeframes
```
POST /api/swing-points/analyze
```

Analyze swing points across multiple timeframes.

**Request Body:**
```json
{
  "instrumentKey": "NSE_EQ|INE002A01018",
  "companyName": "Reliance Industries",
  "yearsBack": 2,
  "timeframes": {
    "15Min": true,
    "1H": true,
    "4H": true,
    "1D": true
  }
}
```

### Demo Endpoint
```
GET /api/swing-points/demo
```

Get a demo calculation with sample data.

## Data Structures

### Candle
```typescript
interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

### Swing Point
```typescript
interface SwingPoint {
  time: number;          // Unix timestamp
  price: number;         // Price at swing point
  label: 'HH' | 'HL' | 'LH' | 'LL';  // Swing point type
  timestamp: string;     // ISO timestamp
  candle: Candle;       // Original candle data
  index: number;        // Index in the candles array
}
```

### Swing Point Labels
- **HH (Higher High)**: A peak that's higher than the previous peak
- **HL (Higher Low)**: A trough that's higher than the previous trough
- **LH (Lower High)**: A peak that's lower than the previous peak
- **LL (Lower Low)**: A trough that's lower than the previous trough

## Development

### Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm test         # Run tests (placeholder)
```

### Project Structure

```
src/
├── index.ts              # Main server file
├── routes/
│   └── swingPoints.ts    # Swing points API routes
├── utils/
│   ├── swingsCalculation.ts      # Main swing calculation utilities
│   └── swingPointCalculator.ts   # Core swing point algorithm
└── types/
    └── candle.ts         # TypeScript type definitions
```

## Algorithm Details

The swing point calculation algorithm:

1. **Identification**: Identifies potential swing highs and lows using a lookback period
2. **Validation**: Validates that a high/low is indeed a swing point by comparing with surrounding candles
3. **Classification**: Classifies swing points as HH, HL, LH, or LL based on comparison with previous swing points
4. **Gap Filling**: Ensures alternating swing points by finding missing highs/lows between consecutive points

### Parameters

- **Lookback Period**: Number of candles to look back/forward for swing point validation (default: 5)
- **Timeframes**: Multiple timeframe analysis support
- **Date Range**: Configurable historical data range

## External API Integration

The mock implementation includes placeholders for external API integration. To integrate with real market data:

1. Replace the `mockFetchHistoricalData` function in `swingsCalculation.ts`
2. Implement your preferred market data provider (e.g., Upstox, Zerodha, Alpha Vantage)
3. Update the API credentials in your `.env` file

## Error Handling

The API includes comprehensive error handling:
- Input validation for all endpoints
- Proper HTTP status codes
- Detailed error messages in development mode
- Graceful handling of calculation errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For questions or issues, please create an issue in the repository or contact the maintainers.