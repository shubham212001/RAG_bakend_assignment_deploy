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

async function splitTextAndStore(text, filePath, chunkSize) {
  const client = await connectToWeaviate();
  const documentCollection = client.collections.get('Final_Test_CollectionWithoutVectoriser');

  await checkAndDeleteExistingData(documentCollection, filePath);

  const globalDocumentId = crypto.randomUUID();
  console.log(globalDocumentId);

  const chunkPromises = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunkText = text.slice(i, i + chunkSize);
    chunkPromises.push(
      (async () => {
        const embedding = await embeddingService.generateEmbedding(chunkText);
        return {
          id: crypto.randomUUID(),
          class: "Final_Test_CollectionWithoutVectoriser",
          properties: {
            page_content: chunkText,
            file_name: filePath,
            document_id: globalDocumentId,
            chunk_index: i / chunkSize
          },
          vectors: embedding
        };
      })()
    );
  }

  const chunks = await Promise.all(chunkPromises);
  await documentCollection.data.insertMany(chunks);
  globals.globalString2 = globalDocumentId;
  console.log(`Stored ${chunks.length} chunks in Weaviate.`);
  return { globalDocumentId, chunks };
}

module.exports = {
  storeJSONInWeaviate,
  splitTextAndStore,
};