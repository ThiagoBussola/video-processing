import express from 'express';
import uploadRouter from './video-service/upload';
import streamRouter from './video-service/stream';
import path from 'path';
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*',
}));
app.use(express.json());
app.use(uploadRouter);
app.use(streamRouter)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
