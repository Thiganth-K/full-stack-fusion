import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

async function testPdf() {
  const data = new Uint8Array(fs.readFileSync('sample-local-pdf.pdf'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  console.log('Pages:', pdf.numPages);
}
testPdf().catch(console.error);
