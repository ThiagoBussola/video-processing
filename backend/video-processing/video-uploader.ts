import path from 'node:path';
import fs from 'node:fs';
import { readdir } from 'node:fs/promises';
import express, { NextFunction, Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { pipeline } from 'stream';
import {  ensureDirectoryExists, fileExists, processedDirectory, uploadDirectory } from '../src/utils/util'

const uploadRouter = express.Router();


uploadRouter.post('/stream-upload', async (req: Request, res: Response) => {
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

uploadRouter.get('/videos', async(req: Request, res: Response) => {
    ensureDirectoryExists(uploadDirectory);
  
    const files=await readdir(uploadDirectory);
    const videos =  files.map(file => ({
      url: `http://localhost:3000/uploads/${file}`,
      // "url": "https://www.youtube.com/embed/y8FeZMv37WU",
      titulo: file,
      descricao: 'Descrição do vídeo',
  
    }));
    
    console.log(videos); 
    res.status(200).json( videos );
  });

// // 2. Video Streaming Endpoint
// app.get('/video/:filename', async (req, res) => {
//     const { filename } = req.params;
//     const videoPath = path.join(__dirname, 'uploads', filename);

//     if (!await fileExists(videoPath)) {
//         return res.status(404).json({ message: 'Video not found' });
//     }

//     const stat = fs.statSync(videoPath);
//     const fileSize = stat.size;
//     const range = req.headers.range;

//     if (range) {
//         const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
//         const start = parseInt(startStr, 10);
//         const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

//         if (start >= fileSize || end >= fileSize) {
//             return res.status(416).json({ message: 'Requested range not satisfiable' });
//         }

//         const chunkSize = (end - start) + 1;
//         const file = fs.createReadStream(videoPath, { start, end });
//         const headers = {
//             'Content-Range': `bytes ${start}-${end}/${fileSize}`,
//             'Accept-Ranges': 'bytes',
//             'Content-Length': chunkSize,
//             'Content-Type': 'video/mp4',
//         };

//         res.writeHead(206, headers);
//         file.pipe(res);
//     } else {
//         const headers = {
//             'Content-Length': fileSize,
//             'Content-Type': 'video/mp4',
//         };
//         res.writeHead(200, headers);
//         fs.createReadStream(videoPath).pipe(res);
//     }
// });

// // 3. Video Processing Endpoint (Convert to MP4 using ffmpeg)


// app.get('/process-video/:filename', async (req, res) => {
//     const { filename } = req.params;
//     const inputPath = path.join(uploadDirectory, filename);

//     if (!await fileExists(inputPath)) {
//         return res.status(404).json({ message: 'Video not found' });
//     }

//     const outputFilename = `processed_${Date.now()}.mp4`;
//     const outputPath = path.join(processedDirectory, outputFilename);

//     ffmpeg(inputPath)
//         .output(outputPath)
//         .on('end', () => {
//             res.download(outputPath, (err) => {
//                 if (err) {
//                     console.error('Download error:', err);
//                     return res.status(500).json({ message: 'Failed to download processed video.' });
//                 }
//                 // Optionally delete the processed file after download
//                 fs.unlink(outputPath, (unlinkErr) => {
//                     if (unlinkErr) console.error('Error deleting processed file:', unlinkErr);
//                 });
//             });
//         })
//         .on('error', (err) => {
//             console.error('FFmpeg error:', err.message);
//             res.status(500).json({ message: 'Video processing failed.' });
//         })
//         .run();
// });


// Global error handler
uploadRouter.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error.' });
});

export default uploadRouter;