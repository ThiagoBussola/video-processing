import { Request, Response, Router } from "express";
import { spawn } from "node:child_process";
import { createWriteStream, stat } from "node:fs";
import { readdir } from "node:fs/promises";
import { pipeline } from "node:stream";
import path from "path";
import { ensureDirectoryExists, uploadDirectory } from "../utils/helper";

const videoRouter = Router();

videoRouter.post("/upload/:fileName", (req: Request, res: Response) => {
  ensureDirectoryExists(uploadDirectory);

  const fileName = req.params.fileName;

  if (!fileName) {
    return res.status(400).send("File name header is missing.");
  }

  const filePath = path.join(uploadDirectory, fileName);
  const writeStream = createWriteStream(filePath);

  pipeline(req, writeStream, (err) => {
    if (err) {
      console.error("Pipeline failed.", err);
      return res.status(500).send("File upload failed.");
    }
    res.status(200).send(`File uploaded successfully: ${fileName}`);
  });
});

videoRouter.get("/videos", async (req: Request, res: Response) => {
  ensureDirectoryExists(uploadDirectory);

  const files = await readdir(uploadDirectory);
  const videos = files.map((file) => ({
    url: `http://localhost:3000/uploads/${file}`,
    titulo: file,
    descricao: "Descrição do vídeo",
    thumbnail: "http://localhost:3000/uploads/thumbnail.png",
  }));

  console.log(videos);
  res.status(200).json(videos);
});

videoRouter.get("/video/:filename", (req: Request, res: Response) => {
  const filePath = path.resolve(uploadDirectory, req.params.filename);

  stat(filePath, (err, stats) => {
    if (err) {
      console.error("File not found:", err);
      return res.status(404).send("Video not found");
    }

    res.writeHead(200, {
      "Content-Type": "video/mp4",
    });

    const ffmpegProcess = spawn("ffmpeg", [
      "-i",
      filePath,
      "-vcodec",
      "libx264",
      "-acodec",
      "aac",
      "-movflags",
      "frag_keyframe+empty_moov+default_base_moof",
      "-b:v",
      "1500k",
      "-maxrate",
      "1500k",
      "-bufsize",
      "1000k",
      "-f",
      "mp4",
      "pipe:1",
    ]);

    ffmpegProcess.stderr.on("data", (data) => {
      console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`FFmpeg process exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).send("Error processing video");
        } else {
          res.end();
        }
      } else {
        res.end();
      }
    });

    req.on("close", () => {
      ffmpegProcess.kill("SIGKILL");
    });
  });
});

export { videoRouter };
