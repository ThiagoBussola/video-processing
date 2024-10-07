// for i in `seq 1 20`; do node -e "process.stdout.write('hello world'.repeat(1e7))" >> big-file.txt; done
import { promises } from "node:fs";

// statSync brings the file size in bytes and other info

const filename = "largeFile.csv";


async function main() {
  await promises.readFile(filename);

}
 main();
