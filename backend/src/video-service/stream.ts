import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileExists } from '../utils/util';

const streamRouter = express.Router();
const uploadDirectory = path.join(__dirname, '..', 'uploads');

streamRouter.get('/video/:filename', async (req: Request, res: Response) => {
    const { filename } = req.params;
    const videoPath = path.join(uploadDirectory, filename);

    console.log('videoPath: '+ videoPath);

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

export default streamRouter;