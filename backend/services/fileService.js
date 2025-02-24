// services/fileService.js
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const weaviateService = require('./weaviateService');

async function extractText(file) {
  let extractedText = "";
  const fileType = file.mimetype;
  if (fileType === "application/pdf") {
    const pdfBuffer = Buffer.from(file.buffer);
    const pdfData = await pdfParse(pdfBuffer);
    extractedText = pdfData.text;
  } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const docxBuffer = Buffer.from(file.buffer);
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    extractedText = result.value;
  } else if (fileType === "text/plain") {
    extractedText = file.buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file type");
  }
  return extractedText;
}

async function processAndStoreFile(file) {
  const extractedText = await extractText(file);
  // Call splitTextAndStore to process text into chunks and store in Weaviate
  const { globalDocumentId, chunks } = await weaviateService.splitTextAndStore(extractedText, file.originalname, 700);
  return {
    globaldocumentId: globalDocumentId,
    previewText: extractedText.substring(0, 400),
    chunks,
  };
}

module.exports = { extractText, processAndStoreFile };
