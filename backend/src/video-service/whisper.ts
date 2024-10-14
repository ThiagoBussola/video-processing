import { createReadStream } from "fs";
import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import {uploadDirectory} from '../utils/util'

dotenv.config();

const audioFilePath = `${uploadDirectory}/prepared-stranded-cut.wav`

const apiVersion = "2024-08-01-preview";
const deploymentName = "whisper";

function getClient(): AzureOpenAI {
  return new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion,
    deployment: deploymentName,
  });
}

export async function main() {
  console.log("== Transcribe Audio Sample ==");

  const client = getClient();
  const result = await client.audio.transcriptions.create({
    model: "",
    file: createReadStream(audioFilePath),
  });

  console.log(`Transcription: ${result.text}`);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});