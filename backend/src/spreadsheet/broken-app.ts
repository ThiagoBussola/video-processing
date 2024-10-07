import { promises } from "node:fs";

const filename = "largeFile.csv";

async function main() {
  await promises.readFile(filename);

}
 main();
