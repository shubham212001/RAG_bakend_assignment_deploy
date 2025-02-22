import client from "./utils";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


function splitText(text, filePath, chunkSize) {
  const lengthTotal = text.length;
  const numChunks = Math.ceil(lengthTotal / chunkSize);
  const chunks = [];

  // Generate a unique document ID for each document
  documentId = crypto.randomUUID(); // Generates a unique ID

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push({
      page_content: text.slice(i, i + chunkSize), // Extract chunk
      file_name: filePath, // Metadata: original file path
      document_id: documentId, // Unique document identifier
      chunk_index: i / chunkSize, // Index of the chunk
    });
  }

  return { documentId, chunks }; // Return both ID and chunks
}