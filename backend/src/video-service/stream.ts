import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { uploadDirectory } from '../utils/util';

const streamRouter = express.Router();

streamRouter.get('/video/:filename', (req: Request, res: Response) => {
    const filePath = path.resolve(uploadDirectory, req.params.filename);

    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('File not found:', err);
            return res.status(404).send('Video not found');
        }

        res.writeHead(200, {
            'Content-Type': 'video/mp4',
        });

        const ffmpegProcess = spawn('ffmpeg', [
            '-i', filePath,
            '-vcodec', 'libx264',
            '-acodec', 'aac',
            '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
            '-b:v', '1500k',
            '-maxrate', '1500k',
            '-bufsize', '1000k',
            '-f', 'mp4',
            'pipe:1' 
        ]);

        ffmpegProcess.stderr.on('data', (data) => {
            console.error(`FFmpeg stderr: ${data}`);
        });

        ffmpegProcess.stdout.pipe(res);

        ffmpegProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`FFmpeg process exited with code ${code}`);
                if (!res.headersSent) {
                    res.status(500).send('Error processing video');
                } else {
                    res.end();
                }
            } else {
                res.end();
            }
        });

        req.on('close', () => {
            ffmpegProcess.kill('SIGKILL');
        });
    });
});

export default streamRouter;