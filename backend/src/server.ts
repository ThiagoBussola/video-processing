import express from "express";
import { videoRouter } from "./services/video.service";
import cors from "cors";
import { uploadDirectory } from "./utils/helper";

const app = express();
const port = process.env.PORT || 3001;
app.use(
  cors({
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: "*",
  })
);
app.use(express.json());
app.use(videoRouter);
app.use("/uploads", express.static(uploadDirectory));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
