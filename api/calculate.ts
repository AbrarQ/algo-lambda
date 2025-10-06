import { VercelRequest, VercelResponse } from '@vercel/node';
import {
    fetchAllTimeframeData,
    calculateAllSwingPoints,
    createProcessedCompanyObject
} from '../lib/swingsCalculation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { lookback = 5, instrumentKey, companyName, fromDate, timeFrameSelection } = req.body;

        console.log('🎯 SWING POINTS API CALLED');
        console.log('📝 Request params:', { instrumentKey, companyName, fromDate, lookback });

        if (!instrumentKey || !companyName) {
            return res.status(400).json({
                error: 'instrumentKey and companyName are required'
            });
        }

        const today = new Date();
        const toDate = today.toISOString().split('T')[0];

        const selectedTimeframes = {
            "15Min": timeFrameSelection.min15,
            "1H": timeFrameSelection.hour1,
            "4H": timeFrameSelection.hour4,
            "1D": timeFrameSelection.day1,
        };

        let processedCompany = null;
        const { dailyDataReversed, hourly4DataReversed, hourly1DataReversed, fifteenMinuteDataReversed } =
            await fetchAllTimeframeData(instrumentKey, fromDate, toDate, selectedTimeframes);

        const hasAnyData = [dailyDataReversed, hourly4DataReversed, hourly1DataReversed, fifteenMinuteDataReversed].some(arr => Array.isArray(arr) && arr.length > 0);

        if (hasAnyData) {
            // Calculate swing points only for selected frames
            const { swingPointsDay, swingPoints4H, swingPoints1H, swingPoints15Min } =
                calculateAllSwingPoints(dailyDataReversed, hourly4DataReversed, hourly1DataReversed, fifteenMinuteDataReversed, selectedTimeframes);

            // Create processed company object using utility function
            processedCompany = createProcessedCompanyObject(
                instrumentKey,
                companyName,
                1,
                swingPointsDay,
                swingPoints4H,
                swingPoints1H,
                swingPoints15Min
            );
        }

        return res.json({
            success: true,
            data: processedCompany
        });

    } catch (error) {
        console.error('Error calculating swing points:', error);
        return res.status(500).json({
            error: 'Failed to calculate swing points'
        });
    }
}