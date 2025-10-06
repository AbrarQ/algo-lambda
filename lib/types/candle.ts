export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest: number;
  ema?: number;
  ema8?: number;
  ema30?: number;
  rsi?: number;
  isHigherHigh?: boolean;
  isHigherLow?: boolean;
  isLowerHigh?: boolean;
  isLowerLow?: boolean;
  isSwingHigh?: boolean;
  isSwingLow?: boolean;
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