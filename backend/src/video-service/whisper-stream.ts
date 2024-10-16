import fs from "fs";
import {
  SpeechConfig,
  SpeechRecognizer,
  AudioConfig,
  AudioInputStream,
  ResultReason,
  CancellationReason,
} from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv";
import { uploadDirectory } from "../utils/util";

dotenv.config();

const subscriptionKey = process.env.AZURE_OPENAI_API_KEY;
const serviceRegion = "brazilsouth";
const filename = `${uploadDirectory}/prepared-alura-aula.pcm`;

function fromStream() {
  if (!subscriptionKey) {
    console.error(
      "AZURE_OPENAI_API_KEY is not set in the environment variables."
    );
    return;
  }

  const speechConfig = SpeechConfig.fromSubscription(
    subscriptionKey,
    serviceRegion
  );
  speechConfig.speechRecognitionLanguage = "pt-BR";

  const pushStream = AudioInputStream.createPushStream();

  const fileStream = fs.createReadStream(filename);

  fileStream.on("data", (chunk) => {
    console.log(`Pushing chunk of size: ${chunk.length}`);
    pushStream.write(chunk as any); // Type assertion as PushAudioInputStream expects any
  });

  fileStream.on("end", () => {
    console.log("End of file reached, closing stream.");
    pushStream.close();
  });

  fileStream.on("error", (err) => {
    console.error("Error reading file:", err);
    pushStream.close();
  });

  const audioConfig = AudioConfig.fromStreamInput(pushStream);
  const speechRecognizer = new SpeechRecognizer(speechConfig, audioConfig);

  speechRecognizer.recognizing = (s, e) => {
    if (e.result.reason === ResultReason.RecognizingSpeech) {
      console.log(`RECOGNIZING: Text=${e.result.text}`);
    }
  };

  speechRecognizer.recognized = (s, e) => {
    if (e.result.reason === ResultReason.RecognizedSpeech) {
      console.log(`RECOGNIZED: Text=${e.result.text}`);
    } else if (e.result.reason === ResultReason.NoMatch) {
      console.log("NOMATCH: Speech could not be recognized.");
    }
  };

  speechRecognizer.canceled = (s, e) => {
    console.log(`CANCELED: Reason=${e.reason}`);

    if (e.reason === CancellationReason.Error) {
      console.log(`CANCELED: ErrorCode=${e.errorCode}`);
      console.log(`CANCELED: ErrorDetails=${e.errorDetails}`);
      console.log(
        "CANCELED: Did you set the speech resource key and region values?"
      );
    }

    speechRecognizer.stopContinuousRecognitionAsync();
  };

  speechRecognizer.sessionStopped = (s, e) => {
    console.log(`SESSION STOPPED: SessionId=${e.sessionId}`);
    speechRecognizer.stopContinuousRecognitionAsync();
  };

  speechRecognizer.startContinuousRecognitionAsync();
}

fromStream();
