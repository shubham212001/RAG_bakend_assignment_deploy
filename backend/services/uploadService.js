const crypto = require('crypto');
const globals = require('../global.js');
const embeddingService = require('./embeddingService');
const { connectToWeaviate } = require('./weaviateClient');

async function checkAndDeleteExistingData(documentCollection, filePath) {
  try {
    const result = await documentCollection.query.fetchObjects({
      filters: documentCollection.filter.byProperty('file_name').equal(filePath),
      limit: 1,
    });

    if (result.objects.length > 0) {
      console.log(`Data found for filename: ${filePath}`);
      await documentCollection.data.deleteMany(
        documentCollection.filter.byProperty('file_name').equal(filePath)
      );
      console.log(`Deleted existing data for filename: ${filePath}`);
      return true;
    }

    console.log(`No existing data found for filename: ${filePath}`);
    return false;
  } catch (error) {
    console.error(`Error checking or deleting data for ${filePath}:`, error);
    throw error;
  }
}

async function storeJSONInWeaviate(jsonData, receivedFileName) {
  if (!Array.isArray(jsonData)) {
    throw new Error("Invalid JSON data: Expected an array.");
  }

  const json_global_id = crypto.randomUUID();
  const client = await connectToWeaviate();
  let documentCollection = client.collections.get('Json_data');

  await checkAndDeleteExistingData(documentCollection, receivedFileName);

  const chunks = jsonData.map((entry, index) => ({
    id: crypto.randomUUID(),
    class: "Json_data",
    properties: {
      ...entry,
      document_id: json_global_id,
      chunk_index: index,
      file_name: receivedFileName
    }
  }));

  if (chunks.length > 0) {
    await documentCollection.data.insertMany(chunks);
    console.log(`Inserted ${chunks.length} JSON objects into Weaviate.`);
  } else {
    console.warn("No valid JSON objects found for insertion.");
  }

  globals.globalString1 = json_global_id;
  return json_global_id;
}


const { v4: uuidv4 } = require('uuid');

// async function splitTextAndStore(text, filePath, chunkSize) {
//   const client = await connectToWeaviate();
//   const documentCollection = client.collections.get('Rahul_Shukla');

//   await checkAndDeleteExistingData(documentCollection, filePath);

//   const globalDocumentId = uuidv4();
//   console.log(globalDocumentId);

//   // Step 1: Split by paragraphs (double newlines)
//   let paragraphs = text.split(/\n\s*\n/);
//   let chunks = [];
//   let currentChunk = "";
//   let chunkIndex = 0;

//   for (let para of paragraphs) {
//     let sentences = para.split(/(?<=[.?!])\s+/); // Split by sentence endings

//     for (let sentence of sentences) {
//       if ((currentChunk + " " + sentence).length > chunkSize) {
//         // Store the completed chunk
//         chunks.push(currentChunk.trim());
//         currentChunk = sentence; // Start a new chunk
//         chunkIndex++;
//       } else {
//         currentChunk += " " + sentence;
//       }
//     }
    
//     // If a paragraph is a reasonable size, treat it as a separate chunk
//     if (currentChunk) {
//       chunks.push(currentChunk.trim());
//       currentChunk = "";
//       chunkIndex++;
//     }
//   }

//   // Step 2: Store chunks in Weaviate
//   const chunkPromises = chunks.map((chunkText, index) => (async () => {
//     const embedding = await embeddingService.generateEmbedding(chunkText);
//     return {
//       id: uuidv4(),
//       class: "Rahul_Shukla",
//       properties: {
//         page_content: chunkText,
//         file_name: filePath,
//         document_id: globalDocumentId,
//         chunk_index: index
//       },
//       vectors: embedding
//     };
//   })());

//   const storedChunks = await Promise.all(chunkPromises);
//   console.log("This is the function that is called")
//   console.log(filePath)
//   await documentCollection.data.insertMany(storedChunks);
//   //console.log(storedChunks)
//   globals.globalString2 = globalDocumentId;

//   console.log(`Stored ${storedChunks.length} logical chunks in Weaviate.`);
//   return { globalDocumentId, chunks: storedChunks };
// }

async function splitTextAndStore(text, filePath, chunkSize) {
  const client = await connectToWeaviate();
  const documentCollection = client.collections.get('Rahul_Shukla');

  await checkAndDeleteExistingData(documentCollection, filePath);

  const globalDocumentId = uuidv4();
  console.log(globalDocumentId);

  let chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }

  // Step 2: Store chunks in Weaviate
  const chunkPromises = chunks.map((chunkText, index) => (async () => {
    const embedding = await embeddingService.generateEmbedding(chunkText);
    return {
      id: uuidv4(),
      class: "Rahul_Shukla",
      properties: {
        page_content: chunkText,
        file_name: filePath,
        document_id: globalDocumentId,
        chunk_index: index
      },
      vectors: embedding
    };
  })());

  const storedChunks = await Promise.all(chunkPromises);
  console.log("This is the function that is called");
  console.log(filePath);
  await documentCollection.data.insertMany(storedChunks);

  globals.globalString2 = globalDocumentId;

  console.log(`Stored ${storedChunks.length} fixed-size chunks in Weaviate.`);
  return { globalDocumentId, chunks: storedChunks };
}

module.exports = splitTextAndStore;

module.exports = {
  storeJSONInWeaviate,
  splitTextAndStore,
};