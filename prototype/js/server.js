import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({limit: '50mb'}));

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '../')));

// Create proxy endpoint
app.post('/upload-to-airtable', async (req, res) => {
    try {
        const response = await fetch('https://hooks.airtable.com/workflows/v1/genericWebhook/appp3tzVSKUUmSpK9/wflgvy3tHoLJpmGgE/wtr1ojQHr0SckYjlo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
