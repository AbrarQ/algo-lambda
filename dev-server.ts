import { createServer } from 'http';
import handler from './api/swing-points/calculate';

const server = createServer(async (req, res) => {
    if (req.url === '/api/swing-points/calculate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const mockReq = {
                    method: 'POST',
                    body: JSON.parse(body),
                    url: req.url,
                    headers: req.headers
                };
                
                const mockRes = {
                    status: (code: number) => ({
                        json: (data: any) => {
                            res.writeHead(code, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(data));
                        }
                    }),
                    json: (data: any) => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(data));
                    }
                };
                
                await handler(mockReq as any, mockRes as any);
            } catch (error) {
                console.error('Server error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Swing Points API: POST http://localhost:${PORT}/api/swing-points/calculate`);
});