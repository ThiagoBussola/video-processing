import { createReadStream, createWriteStream, promises } from "node:fs";
import { createInterface } from "node:readline";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

async function brokenApp() {
  const filename = "largeFile.csv";
  await promises.readFile(filename);
}

function transformCsvLine(line: string): string {
  const parts = line.split(",");
  if (parts.length === 4) {
    parts[3] = parts[3].trim().toUpperCase();
  }
  return parts.join(",") + "\n";
}

async function processCsvFileUpperCase(
  inputFilePath: string,
  outputFilePath: string
): Promise<void> {
  console.time("csv-processing");

  try {
    const readStream = createReadStream(inputFilePath, { encoding: "utf8" });
    const writeStream = createWriteStream(outputFilePath);
    const lineReader = createInterface({ input: readStream });

    const transformStream = new Transform({
      objectMode: true,
      transform(chunk: string, encoding, callback) {
        callback(null, transformCsvLine(chunk));
      },
    });

    //print each transformed line when its processed
    transformStream.on("data", (chunk: string) => {
      console.log(chunk);
    });

    await pipeline(lineReader, transformStream, writeStream);

    console.log("CSV processing completed");
  } catch (error) {
    console.error("Error processing CSV:", error);
  } finally {
    console.timeEnd("csv-processing");
  }
}

//brokenApp()

const inputFile = "./largeFile.csv";
const outputFile = "./largeFile-uppercase.csv";
processCsvFileUpperCase(inputFile, outputFile);
