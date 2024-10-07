import { createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

/**
 * Transforms a CSV line by converting the description to uppercase
 * @param line A single line from the CSV file
 * @returns The CSV line with uppercase description
 */
function transformCsvLine(line: string): string {
  const parts = line.split(',');
  if (parts.length === 4) {
    parts[3] = parts[3].trim().toUpperCase();
  }
  return parts.join(',') + '\n';
}

/**
 * Processes a CSV file and creates a new CSV with uppercase descriptions
 * @param inputFilePath Path to the input CSV file
 * @param outputFilePath Path to the output CSV file
 */
async function processCsvFileUpperCase(inputFilePath: string, outputFilePath: string): Promise<void> {
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

    await pipeline(
      lineReader,
      transformStream,
      writeStream
    );

    console.log("CSV processing completed");
  } catch (error) {
    console.error("Error processing CSV:", error);
  } finally {
    console.timeEnd("csv-processing");
  }
}

// Example usage
const inputFile = "./largeFile.csv";
const outputFile = "./largeFile-uppercase.csv";
processCsvFileUpperCase(inputFile, outputFile);