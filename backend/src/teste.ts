import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { pipeline, Stream } from 'stream';
import { spawn } from 'child_process';

const app = express();
const port = 3000;

// Utility function to ensure a directory exists
const ensureDirectoryExists = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const uploadDirectory = path.resolve(__dirname, 'uploads');
const processedDirectory = path.resolve(__dirname, 'processed');

// Ensure required directories exist
ensureDirectoryExists(uploadDirectory);
ensureDirectoryExists(processedDirectory);

// Set storage engine for Multer to store uploaded files
const storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}_${file.originalname}`;
        cb(null, uniqueSuffix);
    },
});

// Initialize Multer with defined storage
const upload = multer({ storage });

// Middleware to check if a file exists
const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
};

// 1. Video Upload Endpoint
app.post('/stream-upload', async (req: Request, res: Response) => {
    ensureDirectoryExists(uploadDirectory);

    const fileName = req.headers['file-name'] as string;
    
    if (!fileName) {
        return res.status(400).send('File name header is missing.');
    }

    const filePath = path.join(uploadDirectory, fileName);
    const writeStream = fs.createWriteStream(filePath);

    pipeline(req, writeStream, (err) => {
        if (err) {
            console.error('Pipeline failed.', err);
            return res.status(500).send('File upload failed.');
        }
        res.status(200).send(`File uploaded successfully: ${fileName}`);
    });
});

// 2. Video Streaming Endpoint
app.get('/video/:filename', async (req, res) => {
    const { filename } = req.params;
    const videoPath = path.join(uploadDirectory, filename);

    if (!await fileExists(videoPath)) {
        return res.status(404).json({ message: 'Video not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
            return res.status(416).json({ message: 'Requested range not satisfiable' });
        }

        const chunkSize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, headers);
        file.pipe(res);
    } else {
        const headers = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, headers);
        fs.createReadStream(videoPath).pipe(res);
    }
});

// 3. Video Processing Endpoint (Convert to MP4 using Fluent-FFmpeg)
app.get('/process-video/:filename', async (req, res) => {
    const { filename } = req.params;
    const inputPath = path.join(uploadDirectory, filename);

    if (!await fileExists(inputPath)) {
        return res.status(404).json({ message: 'Video not found' });
    }

    const outputFilename = `processed_${path.parse(filename).name}_${Date.now()}.mp4`;
    const outputPath = path.join(processedDirectory, outputFilename);

    // Start FFmpeg processing
    ffmpeg(fs.createReadStream(inputPath), {logger: console})
        .outputOptions([
            '-c:v libx264', // Video codec
            '-c:a aac',     // Audio codec
            '-movflags frag_keyframe+empty_moov+default_base_moof', // For streaming
            '-preset fast', // Encoding speed
            '-b:v 1500k',   // Video bitrate
            '-maxrate 1500k', // Max video bitrate
            '-bufsize 1000k', // Buffer size
        ])
        .outputFormat('mp4')
        .on('start', (commandLine) => {
            console.log(`FFmpeg started with command: ${commandLine}`);
        })
        .on('progress', (progress) => {
            if (progress.percent) {
                console.log(`Processing: ${progress.percent.toFixed(2)}% done`);
            }
        })
        .on('error', (err, stdout, stderr) => {
            console.error(`Error during conversion: ${err.message}`);
            console.error('FFmpeg stdout:', stdout);
            console.error('FFmpeg stderr:', stderr);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Video conversion failed.' });
            }
        })
        .on('end', () => {
            console.log('Video conversion completed.');
            // Stream the processed video to the client
            res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
            res.setHeader('Content-Type', 'video/mp4');
            const readStream = fs.createWriteStream(outputPath);
            readStream.pipe(res);

            // Optionally delete the processed file after streaming
            readStream.on('close', () => {
                fs.unlink(outputPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting processed file:', unlinkErr);
                    } 
                    console.log(`Processed file ${outputFilename} deleted successfully.`);
                });
            });
        })
        .save(outputPath);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error.' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});