export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HistoricalDataResponse {
  candles: Candle[];
  status?: string;
}

export interface TimeframeSelection {
  "15Min": boolean;
  "1H": boolean;
  "4H": boolean;
  "1D": boolean;
}