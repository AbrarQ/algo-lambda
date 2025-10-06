import { calculateSwingPointsFromCandles } from './swingPointCalculator';
import { Candle } from './types/candle';
import axios from 'axios';

interface UpstoxHistoricalDataResponse {
  status: string;
  data: {
    candles: [string, number, number, number, number, number, number][]; // [timestamp, open, high, low, close, volume, open_interest]
  };
}

// Helper function to remove timezone info from timestamps for Java compatibility
const removeTimezoneFromTimestamp = (timestamp: string): string => {
    return timestamp.replace(/(\.\d{3})?Z$/, '');
};

export const calculateDateRangeDynamic = (yearsBack: number) => {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

    const fromDateObj = new Date(today);
    fromDateObj.setFullYear(fromDateObj.getFullYear() - yearsBack); // X years back
    const fromDate = fromDateObj.toISOString().split('T')[0];

    return { fromDate, toDate };
};

const adjustFromDateByDays = (fromDate: string, daysToReduce: number): string => {
  const fromDateObj = new Date(fromDate);
  fromDateObj.setDate(fromDateObj.getDate() + daysToReduce);
  return fromDateObj.toISOString().split('T')[0];
};

/**
 * Helper to rebuild URL with new fromDate
 */
const rebuildUrlWithFromDate = (
  instrumentKey: string,
  unit: string,
  interval: string,
  toDate: string,
  fromDate: string
): string => {
  const encodedInstrumentKey = encodeURIComponent(instrumentKey);
  return `https://api.upstox.com/v3/historical-candle/${encodedInstrumentKey}/${unit}/${interval}/${toDate}/${fromDate}`;
};

// Mock function for historical data fetching (replace with your actual API implementation)
const mockFetchHistoricalData = async (
    instrumentKey: string,
    unit: string,
    interval: string,
    toDate: string,
    fromDate: string
) => {
    // This is a mock implementation
    // Replace this with your actual API call to fetch historical data
    console.log(`Fetching ${unit} ${interval} data for ${instrumentKey} from ${fromDate} to ${toDate}`);
    
    // Generate mock candle data for demonstration
    const mockCandles: any[] = [];
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    let currentDate = new Date(startDate);
    let basePrice = 100;
    
    while (currentDate <= endDate) {
        const timestamp = removeTimezoneFromTimestamp(currentDate.toISOString());
        const open = basePrice + (Math.random() - 0.5) * 10;
        const close = open + (Math.random() - 0.5) * 5;
        const high = Math.max(open, close) + Math.random() * 3;
        const low = Math.min(open, close) - Math.random() * 3;
        
        mockCandles.push({
            timestamp,
            open,
            high,
            low,
            close,
            volume: Math.floor(Math.random() * 10000)
        });
        
        basePrice = close;
        
        // Increment date based on unit and interval
        if (unit === 'days') {
            currentDate.setDate(currentDate.getDate() + parseInt(interval));
        } else if (unit === 'hours') {
            currentDate.setHours(currentDate.getHours() + parseInt(interval));
        } else if (unit === 'minutes') {
            currentDate.setMinutes(currentDate.getMinutes() + parseInt(interval));
        }
    }
    
    return { candles: mockCandles };
};

export const fetchHourlyDataInChunks = async (instrumentKey: string, interval: string, fromDate: string, toDate: string, unit:string) => {
    const chunks = [];
    let currentFromDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
  
    while (currentFromDate < endDate) {
      const chunkToDate = new Date(currentFromDate);
    
      if (unit === "minutes" && interval === "15") {
        chunkToDate.setMonth(chunkToDate.getMonth() + 1);
      } else {
        chunkToDate.setMonth(chunkToDate.getMonth() + 3);
      }

      if (chunkToDate > endDate) {
        chunkToDate.setTime(endDate.getTime());
      }
      
      const chunkFromStr = currentFromDate.toISOString().split('T')[0];
      const chunkToStr = chunkToDate.toISOString().split('T')[0];
      
      try {
        const chunkData = await mockFetchHistoricalData(
          instrumentKey,
          unit,
          interval,
          chunkToStr,
          chunkFromStr
        );
        
        if (chunkData.candles && chunkData.candles.length > 0) {
          chunks.push(...chunkData.candles);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error fetching ${interval}H chunk:`, error);
      }
      
      currentFromDate = new Date(chunkToDate);
      currentFromDate.setDate(currentFromDate.getDate() + 1);
    }
    
    return { candles: chunks };
  };

  export const getMaxDurationForTimeframe = (unit: string, interval: string): number => {
  const timeframeKey = `${unit}_${interval}`;

  // Based on Upstox API documentation and real-world testing
  // These limits prevent API errors for different timeframes
  const maxDurations: Record<string, number> = {
    // Minutes timeframes - shorter duration limits
    'minutes_1': 7,     // 1m: 7 days max
    'minutes_5': 30,    // 5m: 30 days max
    'minutes_15': 30,   // 15m: 30 days max
    'minutes_30': 90,   // 30m: 90 days max

    // Hours timeframes - medium duration limits
    'hours_1': 90,      // 1h: ~3 months max (based on your example: May 28 to Aug 27)
    'hours_4': 180,     // 4h: ~6 months max

    // Days and larger timeframes - longer duration limits
    'days_1': 365,      // 1d: 1 year max
    'weeks_1': 1825,    // 1w: 5 years max
    'months_1': 1825,   // 1M: 5 years max
  };

  return maxDurations[timeframeKey] || 365; // Default to 1 year if not found
};

const handleRetryAttempt = (params: {
  currentAttempt: number;
  maxRetries: number;
  currentFromDate: string;
  instrumentKey: string;
  unit: string;
  interval: string;
  toDate: string;
  originalFromDate?: string;
}): { shouldRetry: boolean; newFromDate: string; newUrl: string } => {
  const { currentAttempt, maxRetries, currentFromDate, instrumentKey, unit, interval, toDate, originalFromDate } = params;

  if (currentAttempt > maxRetries || !currentFromDate) {
    return { shouldRetry: false, newFromDate: currentFromDate, newUrl: '' };
  }

  console.warn(`⚠️ Attempt ${currentAttempt}: Invalid date range error detected`);

  // Reduce the date range by 10 days for retry
  const newFromDate = adjustFromDateByDays(currentFromDate, 10);
  const newUrl = rebuildUrlWithFromDate(instrumentKey, unit, interval, toDate, newFromDate);

  const originalDays = originalFromDate
    ? Math.abs((new Date(toDate).getTime() - new Date(originalFromDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const newDays = Math.abs((new Date(toDate).getTime() - new Date(newFromDate).getTime()) / (1000 * 60 * 60 * 24));

  console.log(`🔄 Retry ${currentAttempt}: Reducing range by 10 days`);
  console.log(`   Original range: ${originalFromDate} to ${toDate} (${Math.round(originalDays)} days)`);
  console.log(`   New range: ${newFromDate} to ${toDate} (${Math.round(newDays)} days)`);

  return { shouldRetry: true, newFromDate, newUrl };
};

const retryUpstoxApiCall = async (
  url: string,
  token: string,
  instrumentKey: string,
  unit: string,
  interval: string,
  toDate: string,
  fromDate?: string
): Promise<UpstoxHistoricalDataResponse> => {
  const maxRetries = 3;
  let currentAttempt = 0;
  let currentFromDate = fromDate;
  let currentUrl = url;

  while (currentAttempt <= maxRetries) {
    try {
      console.log(`🔄 Attempt ${currentAttempt + 1}/${maxRetries + 1}`);

      const response = await axios.get<UpstoxHistoricalDataResponse>(currentUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🚀 API REQUEST DETAILS:');
      console.log('URL:', currentUrl);
      console.log('Method: GET');
      console.log('Headers:', {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...` // Don't log full token
      });
      console.log('---');

      if (response.status !== 200 || response.data.status !== 'success') {
        throw new Error(`API request failed: ${response.data.status || 'Unknown error'}`);
      }

      console.log(`✅ API request successful on attempt ${currentAttempt + 1}`);
      console.log('📥 API RESPONSE:', {
        status: response.status,
        statusText: response.statusText,
        dataStatus: response.data.status,
        candleCount: response.data.data?.candles?.length || 0
      });
      return response.data;

    } catch (error) {
      currentAttempt++;

      if (isRetryableInvalidDateRangeError(error) && currentAttempt <= maxRetries) {
        const retryResult = handleRetryAttempt({
          currentAttempt,
          maxRetries,
          currentFromDate: currentFromDate || '',
          instrumentKey,
          unit,
          interval,
          toDate,
          originalFromDate: fromDate
        });

        if (retryResult.shouldRetry) {
          currentFromDate = retryResult.newFromDate;
          currentUrl = retryResult.newUrl;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }

      // Handle final error
      if (currentAttempt > maxRetries) {
        console.error(`❌ All ${maxRetries + 1} attempts failed`);
        if (isRetryableInvalidDateRangeError(error)) {
          console.error(`💡 Try a smaller date range. Reduced by ${maxRetries * 10} days but still too large.`);
        }
      }

      if (axios.isAxiosError(error)) {
        throw new Error(`Upstox API Error (${error.response?.status}): ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  throw new Error('Unexpected end of retry logic');
};

const isRetryableInvalidDateRangeError = (error: unknown): boolean => {
  return axios.isAxiosError(error) &&
    error.response?.status === 400 &&
    error.response?.data?.message === "Invalid date range";
};


  export const fetchUpstoxHistoricalData = async (
  instrumentKey: string,
  unit: string = 'days',
  interval: string = '1',
  toDate?: string,
  fromDate?: string,
  apiKey?: string
): Promise<{
  candles: Candle[];
  hasMoreCandles: boolean;
  oldestCandleTime?: string;
  newestCandleTime?: string;
  isFirstTimeCall?: boolean;
}> => {
  // Use environment variable or passed apiKey
  const token = apiKey || "process.env.NEXT_PUBLIC_UPSTOX_API_KEY";

  if (!token) {
    throw new Error('Upstox API key not provided');
  }

  // Build the API URL according to V3 structure
  // GET /v3/historical-candle/:instrument_key/:unit/:interval/:to_date/:from_date
  const today = new Date();
  // Use today's date in YYYY-MM-DD format, ensure it's not in the future
  const todayString = today.toISOString().split('T')[0];
  const defaultToDate = toDate || todayString;

  console.log(`🔍 API URL construction:`, {
    unit,
    interval,
    toDate: defaultToDate,
    fromDate,
    today: todayString
  });

  // Get the maximum duration for this specific timeframe
  const maxDuration = getMaxDurationForTimeframe(unit, interval);

  // Validate date format and range
  if (fromDate && toDate) {
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    const daysDiff = Math.abs((toDateObj.getTime() - fromDateObj.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`Date range validation: ${fromDate} to ${toDate} (${daysDiff} days)`);
    console.log(`Max duration for ${unit}/${interval}: ${maxDuration} days`);

    // Check against timeframe-specific limits
    if (daysDiff > maxDuration) {
      console.warn(`⚠️ Date range (${daysDiff} days) exceeds maximum for ${unit}/${interval} timeframe (${maxDuration} days)`);
      console.warn(`API might reject this request. Consider reducing the date range.`);

      // Optionally auto-adjust the fromDate to fit within limits
      const adjustedFromDate = new Date(toDateObj);
      adjustedFromDate.setDate(adjustedFromDate.getDate() - maxDuration);
      const adjustedFromDateString = adjustedFromDate.toISOString().split('T')[0];

      console.log(`💡 Suggested adjustment: Use fromDate as ${adjustedFromDateString} instead of ${fromDate}`);
    }
  } else if (!fromDate && toDate) {
    // If only toDate is provided, we might want to auto-set a reasonable fromDate
    const toDateObj = new Date(toDate);
    const suggestedFromDate = new Date(toDateObj);
    suggestedFromDate.setDate(suggestedFromDate.getDate() - Math.min(maxDuration, 30)); // Use smaller of max duration or 30 days

    console.log(`💡 No fromDate provided. For ${unit}/${interval}, consider using fromDate: ${suggestedFromDate.toISOString().split('T')[0]}`);
  }

  // URL encode the instrument key to handle special characters like |
  const encodedInstrumentKey = encodeURIComponent(instrumentKey);

  let url = `https://api.upstox.com/v3/historical-candle/${encodedInstrumentKey}/${unit}/${interval}/${defaultToDate}`;

  // Add from_date if provided
  if (fromDate) {
    url += `/${fromDate}`;
  }

  console.log('Upstox Historical API URL:', url);

  try {
    // Use retry helper for API call with automatic date range reduction
    const responseData = await retryUpstoxApiCall(
      url,
      token,
      instrumentKey,
      unit,
      interval,
      defaultToDate,
      fromDate
    );

    // Transform Upstox candle format to our app's Candle format
    const candles: Candle[] = responseData.data.candles.map((candleData: [string, number, number, number, number, number, number]) => {
      const [timestamp, open, high, low, close, volume, openInterest] = candleData;

      // Remove timezone information from timestamps to avoid date shifting issues
      // Upstox returns timestamps like "2025-08-26T00:00:00+05:30"
      // We want to treat this as local time: "2025-08-26T00:00:00"
      let processedTimestamp: string;


      if (typeof timestamp === 'string') {
        // Remove timezone offset (+05:30, +00:00, Z, etc.) to treat as local time
        processedTimestamp = timestamp.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
      } else {
        processedTimestamp = timestamp;
      }

      return {
        timestamp: processedTimestamp,
        open,
        high,
        low,
        close,
        volume,
        openInterest: openInterest || 0,
      };
    });

    // For V3 API, we need to determine if there's more data based on response length
    // and implement our own pagination logic
    const hasMoreCandles = true;// Assume more data exists if we got results

    const oldestCandleTime = candles.length > 0 ? candles[0].timestamp : undefined;
    const newestCandleTime = candles.length > 0 ? candles[candles.length - 1].timestamp : undefined;

    return {
      candles,
      hasMoreCandles : true,
      oldestCandleTime,
      newestCandleTime
    };
  } catch (error) {
    console.error('Error fetching Upstox historical data:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      throw new Error(`Upstox API Error (${error.response?.status}): ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
};

export const fetchAllTimeframeData = async (
    instrumentKey: string,
    fromDate: string,
    toDate: string,
    timeframes: { "15Min": boolean; "1H": boolean; "4H": boolean; "1D": boolean }
  ) => {
    // Return null for any timeframe not selected. Only fetch data for selected frames.
    let dailyDataReversed: any[] | null = null;
    let hourly4DataReversed: any[] | null = null;
    let hourly1DataReversed: any[] | null = null;
    let fifteenMinuteDataReversed: any[] | null = null;

    if (timeframes["1D"]) {
      const dailyData = await fetchUpstoxHistoricalData(
        instrumentKey,
        'days',
        '1',
        toDate,
        fromDate
      );
      dailyDataReversed = dailyData.candles.reverse();
    }

    if (timeframes["4H"]) {
      const hourly4Data = await fetchHourlyDataInChunks(instrumentKey, '4', fromDate, toDate, "hours");
      hourly4DataReversed = hourly4Data.candles.reverse();
    }

    if (timeframes["1H"]) {
      const hourly1Data = await fetchHourlyDataInChunks(instrumentKey, '1', fromDate, toDate, "hours");
      hourly1DataReversed = hourly1Data.candles.reverse();
    }

    if (timeframes["15Min"]) {
      const fifteenMinuteData = await fetchHourlyDataInChunks(instrumentKey, '15', fromDate, toDate, "minutes");
      fifteenMinuteDataReversed = fifteenMinuteData.candles.reverse();
    }

    return {
      dailyDataReversed,
      hourly4DataReversed,
      hourly1DataReversed,
      fifteenMinuteDataReversed
    };
  };

// Utility function to calculate swing points for all timeframes
 export const calculateAllSwingPoints = (
      dailyData: any[] | null,
      hourly4Data: any[] | null,
      hourly1Data: any[] | null,
      fifteenMinData: any[] | null,
      timeframes: { "15Min": boolean; "1H": boolean; "4H": boolean; "1D": boolean }
    ) => {
      const swingPointsDay = timeframes["1D"] && dailyData && dailyData.length > 0
        ? calculateSwingPointsFromCandles(dailyData, 5)
        : null;
  
      const swingPoints4H = timeframes["4H"] && hourly4Data && hourly4Data.length > 0
        ? calculateSwingPointsFromCandles(hourly4Data, 5)
        : null;
  
      const swingPoints1H = timeframes["1H"] && hourly1Data && hourly1Data.length > 0
        ? calculateSwingPointsFromCandles(hourly1Data, 5)
        : null;
  
      const swingPoints15Min = timeframes["15Min"] && fifteenMinData && fifteenMinData.length > 0
        ? calculateSwingPointsFromCandles(fifteenMinData, 5)
        : null;
  
      return { swingPointsDay, swingPoints4H, swingPoints1H, swingPoints15Min };
    };
  

// Utility function to create processed company object
export const createProcessedCompanyObject = (
    instrumentKey: string,
    companyName: string,
    timeframe: number,
    swingPointsDay: any[] | null,
    swingPoints4H: any[] | null,
    swingPoints1H: any[] | null,
    swingPoints15Min: any[] | null
) => {
    return {
        instrumentKey,
        companyName,
        timeframe,
        swingPointsDay: swingPointsDay
            ? swingPointsDay.map((sp: any) => ({ 
                timestamp: removeTimezoneFromTimestamp(sp.timestamp), 
                price: sp.price, 
                label: sp.label, 
                time: sp.time, 
                candle: {
                    ...sp.candle,
                    timestamp: removeTimezoneFromTimestamp(sp.candle.timestamp)
                }
            }))
            : null,
        swingPoints4H: swingPoints4H
            ? swingPoints4H.map((sp: any) => ({ 
                timestamp: removeTimezoneFromTimestamp(sp.timestamp), 
                price: sp.price, 
                label: sp.label, 
                time: sp.time, 
                candle: {
                    ...sp.candle,
                    timestamp: removeTimezoneFromTimestamp(sp.candle.timestamp)
                }
            }))
            : null,
        swingPoints1H: swingPoints1H
            ? swingPoints1H.map((sp: any) => ({ 
                timestamp: removeTimezoneFromTimestamp(sp.timestamp), 
                price: sp.price, 
                label: sp.label, 
                time: sp.time, 
                candle: {
                    ...sp.candle,
                    timestamp: removeTimezoneFromTimestamp(sp.candle.timestamp)
                }
            }))
            : null,
        swingPoints15Min: swingPoints15Min
            ? swingPoints15Min.map((sp: any) => ({ 
                timestamp: removeTimezoneFromTimestamp(sp.timestamp), 
                price: sp.price, 
                label: sp.label, 
                time: sp.time, 
                candle: {
                    ...sp.candle,
                    timestamp: removeTimezoneFromTimestamp(sp.candle.timestamp)
                }
            }))
            : null,
    };
};