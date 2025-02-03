import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024, // 5GB in bytes
    },
    fileFilter: (req, file, cb) => {
        // Accept video files only
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
}).single('video');

app.use(cors({
    origin: '*',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));
app.options('*', cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

app.post('/upload-to-airtable', (req, res) => {
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    success: false,
                    error: 'File is too large. Maximum size is 5GB'
                });
            }
            return res.status(400).json({
                success: false,
                error: err.message
            });
        } else if (err) {
            // An unknown error occurred
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // If everything went fine with Multer, proceed with the upload
        try {
            if (!req.file) {
                throw new Error('No file uploaded');
            }

            // Upload to S3
            const filename = `embedded-recording-${Date.now()}.webm`;
            const s3Response = await s3Client.send(new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: filename,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            }));

            // Get S3 URL
            const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${filename}`;

            // Forward to Airtable
            const response = await fetch(process.env.AIRTABLE_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoUrl: s3Url,
                    filename: filename,
                    metadata: {
                        recordedAt: new Date().toISOString(),
                        fileType: req.file.mimetype,
                        fileName: filename,
                        size: req.file.size
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Airtable responded with status: ${response.status}`);
            }

            const data = await response.json();
            res.json({
                success: true,
                videoUrl: s3Url,
                data
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
