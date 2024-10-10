import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { readdir } from 'node:fs/promises';
import { ensureDirectoryExists } from '../utils/util';

const uploadRouter = Router();
const uploadDirectory = path.join(__dirname, '..', 'uploads');

uploadRouter.post('/upload', async(req: Request, res: Response) => {
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

uploadRouter.get('/videos', async (req: Request, res: Response) => {
  ensureDirectoryExists(uploadDirectory);

  const files = await readdir(uploadDirectory);
  const videos = files.map(file => ({
    url: `http://localhost:3000/uploads/${file}`,
    titulo: file,
    descricao: 'Descrição do vídeo',
    thumbnail: 'http://localhost:3000/uploads/thumbnail.png',
  }));

  console.log(videos);
  res.status(200).json(videos);
});
export default uploadRouter;
