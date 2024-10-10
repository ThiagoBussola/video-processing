const fs = require('fs');
const crypto = require('crypto');
const { Readable } = require('stream');

const targetSize = 2 * 1024 * 1024 * 1024; // 2GB
const outputFile = 'largeFile.csv';

class CSVGenerator extends Readable {
  constructor(options) {
    super(options);
    this.bytesWritten = 0;
  }

  _read() {
    if (this.bytesWritten >= targetSize) {
      this.push(null);
      return;
    }

    const id = crypto.randomBytes(4).toString('hex');
    const value = Math.random() * 100000;
    const timestamp = new Date().toISOString();
    const description = 'Randomly generated CSV row';

    const row = `${id},${value},${timestamp},${description}\n`;
    this.bytesWritten += Buffer.byteLength(row);
    this.push(row);
  }
}

console.time('CSV Generation');

const writeStream = fs.createWriteStream(outputFile);
writeStream.write('id,value,timestamp,description\n');

const csvGenerator = new CSVGenerator();

csvGenerator.pipe(writeStream);

csvGenerator.on('end', () => {
  writeStream.end();
  console.timeEnd('CSV Generation');
  console.log(`File created with size: ${fs.statSync(outputFile).size} bytes`);
});