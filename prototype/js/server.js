import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

app.post('/upload-to-airtable', async (req, res) => {
    try {
        console.log('Received video URL:', req.body.videoUrl);
        
        // Forward the video URL to Airtable
        const response = await fetch('https://hooks.airtable.com/workflows/v1/genericWebhook/appuWM4ZBKR6yUFZn/wfl6GApXZ2IAeOAWM/wtr4xMY44r1hDr1nr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                videoUrl: req.body.videoUrl,
                metadata: req.body.metadata
            })
        });

        if (!response.ok) {
            throw new Error(`Airtable responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Upload successful:', data);
        res.json({
            success: true,
            message: 'Video URL sent successfully',
            data: data
        });
    } catch (error) {
        console.error('Error during upload:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
