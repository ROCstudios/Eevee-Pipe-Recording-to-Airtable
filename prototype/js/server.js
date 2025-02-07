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
console.log('Environment variables check:', {
    AWS_REGION: process.env.AWS_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    HAS_ACCESS_KEY: !!process.env.AWS_ACCESS_KEY_ID,
    HAS_SECRET_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
});

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
app.use(express.urlencoded({ extended: true }));

app.post('/upload-video', (req, res) => {
    upload(req, res, async function(err) {

        let loggedInUser = {};

        console.log('Inside upload callback');
        if (req.body.loggedInUser) {
            loggedInUser = JSON.parse(req.body.loggedInUser);
            console.log('Logged in user:', loggedInUser);
        }

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
            const filename = `${Date.now()}.webm`;
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
                    url: s3Url,
                    filename: filename,
                    loggedInUser: loggedInUser,
                    fileType: "Video",
                    metadata: {
                        recordedAt: new Date().toISOString(),
                        fileName: filename,
                        size: req.file.size,
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

const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB in bytes
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files only
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed!'), false);
        }
    }
}).single('audio');

app.post('/upload-audio', (req, res) => {
    audioUpload(req, res, async function(err) {
        let loggedInUser = {};

        if (req.body.loggedInUser) {
            loggedInUser = JSON.parse(req.body.loggedInUser);
            console.log('Logged in user:', loggedInUser);
        }

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    success: false,
                    error: 'File is too large. Maximum size is 100MB'
                });
            }
            return res.status(400).json({
                success: false,
                error: err.message
            });
        } else if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        try {
            if (!req.file) {
                throw new Error('No file uploaded');
            }

            // Upload to S3
            const filename = `${Date.now()}.webm`;
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
                    url: s3Url,
                    filename: filename,
                    loggedInUser: loggedInUser,
                    fileType: "Audio",
                    metadata: {
                        recordedAt: new Date().toISOString(),
                        fileName: filename,
                        size: req.file.size,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Airtable responded with status: ${response.status}`);
            }

            const data = await response.json();
            res.json({
                success: true,
                audioUrl: s3Url,
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
