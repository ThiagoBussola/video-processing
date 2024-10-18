import {
  SpeechConfig,
  SpeechRecognizer,
  ResultReason,
  CancellationReason,
  AudioConfig,
} from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv";
import fs from "fs";
import { uploadDirectory } from "../utils/helper";

dotenv.config();

const subscriptionKey = process.env.AZURE_OPENAI_API_KEY;
const serviceRegion = "brazilsouth";
//const filename = `${uploadDirectory}/Yesterday.pcm`;
const filename = `${uploadDirectory}/prepared-alura-aula.wav`;

const speechConfig = SpeechConfig.fromSubscription(
  subscriptionKey as string,
  serviceRegion
);
//let audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(filename));
let audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(filename));
speechConfig.speechRecognitionLanguage = "pt-BR";

const speechRecognizer = new SpeechRecognizer(speechConfig, audioConfig);

speechRecognizer.recognizing = (s, e) => {
  console.log(`RECOGNIZING: Text=${e.result.text}`);
};

speechRecognizer.recognized = (s, e) => {
  if (e.result.reason == ResultReason.RecognizedSpeech) {
    console.log(`RECOGNIZED: Text=${e.result.text}`);
  } else if (e.result.reason == ResultReason.NoMatch) {
    console.log("NOMATCH: Speech could not be recognized.");
  }
};

speechRecognizer.canceled = (s, e) => {
  console.log(`CANCELED: Reason=${e.reason}`);

  if (e.reason == CancellationReason.Error) {
    console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
    console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
    console.log(
      "CANCELED: Did you set the speech resource key and region values?"
    );
  }

  speechRecognizer.stopContinuousRecognitionAsync();
};

speechRecognizer.sessionStopped = (s, e) => {
  console.log("\n    Session stopped event.");
  speechRecognizer.stopContinuousRecognitionAsync();
};

speechRecognizer.startContinuousRecognitionAsync();
