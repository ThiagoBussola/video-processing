import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { readdir } from 'node:fs/promises';


const uploadRouter = Router();
const uploadDirectory = path.join(__dirname, '..', 'uploads');
console.log(uploadDirectory);

const ensureUploadDirectoryExists = () => {
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }
};

uploadRouter.post('/upload', async(req: Request, res: Response) => {
  ensureUploadDirectoryExists();

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
  ensureUploadDirectoryExists();

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
export default uploadRouter;
