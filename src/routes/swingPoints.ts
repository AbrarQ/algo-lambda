
import { Request, Response, Router } from 'express';
import {
    fetchAllTimeframeData,
    calculateAllSwingPoints,
    createProcessedCompanyObject
} from '../utils/swingsCalculation';

const router = Router();

// POST /api/swing-points/calculate
// Calculate swing points for given candle data
router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
    try {
        const { lookback = 5, instrumentKey, companyName, fromDate, timeFrameSelection } = req.body;

        console.log('🎯 SWING POINTS API CALLED');
        console.log('📝 Request params:', { instrumentKey, companyName, fromDate, lookback });

        if (!instrumentKey || !companyName) {
            res.status(400).json({
                error: 'instrumentKey and companyName are required'
            });
            return;
        }

        const today = new Date();
        const toDate = today.toISOString().split('T')[0];

        const selectedTimeframes = {
            ...(timeFrameSelection.min15 && { "15Min": true }),
            ...(timeFrameSelection.hour1 && { "1H": true }),
            ...(timeFrameSelection.hour4 && { "4H": true }),
            ...(timeFrameSelection.daySwings && { "1D": true }),
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

        res.json({
            success: true,
            data: processedCompany
        });

    } catch (error) {
        console.error('Error calculating swing points:', error);
        res.status(500).json({
            error: 'Failed to calculate swing points'
        });
    }
});

export default router;