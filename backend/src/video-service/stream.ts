import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileExists } from '../utils/util';
import { spawn } from 'child_process';

const streamRouter = express.Router();

// Define the directory where uploaded videos are stored
const uploadDirectory = path.resolve(__dirname, '../../uploads');

/**
 * GET /video/:filename
 * Streams the requested video file in chunks.
 */
streamRouter.get('/video/:filename', (req, res) => {
    const filePath = path.resolve(__dirname, '..', 'uploads', req.params.filename);

    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('File not found:', err);
            return res.status(404).send('Video not found');
        }

        const range = req.headers.range;
        const videoSize = stats.size;

        if (range) {
            const CHUNK_SIZE = 10 ** 6; // 1MB
            const start = Number(range.replace(/\D/g, ''));
            const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

            const contentLength = end - start + 1;
            const headers = {
                'Content-Range': `bytes ${start}-${end}/${videoSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': contentLength,
                'Content-Type': 'video/mp4',
            };

            const ffmpegProcess = spawn('ffmpeg', [
                '-i', 'pipe:0',
                '-vcodec', 'h264',
                '-acodec', 'aac',
                '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
                '-b:v', '1500k',
                '-maxrate', '1500k',
                '-bufsize', '1000k',
                '-f', 'mp4',
                'prepared-sample.mp4'
            ])
            const videoStream = fs.createReadStream(filePath, { start, end });
            videoStream.pipe(res);
        } else {
            // No Range header; serve the entire video
            const headers = {
                'Content-Length': videoSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, headers);
            fs.createReadStream(filePath).pipe(res);
        }
    });
});
export default streamRouter;