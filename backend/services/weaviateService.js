// services/weaviateService.js
const weaviate = require('weaviate-client').default;
const crypto = require('crypto');
const config = require('../config');
const embeddingService = require('./embeddingService');
const globals = require('../global.js');
let globalDocumentId = "";

async function connectToWeaviate() {
  return await weaviate.connectToWeaviateCloud(config.wcdUrl, {
    authCredentials: new weaviate.ApiKey(config.wcdApiKey),
    grpcHost: config.wcdUrl,
    secure: false,
  });
}

async function storeJSONInWeaviate(jsonData, receivedFileName) {


  //Deleting if data already exists 
  if (!Array.isArray(jsonData)) {
    throw new Error("Invalid JSON data: Expected an array.");
  }
  const json_global_id = crypto.randomUUID();
  const client = await connectToWeaviate();
  let documentCollection = client.collections.get('Json_data');
  checkAndDeleteExistingData(documentCollection,receivedFileName)

  // Process each entry: convert numeric strings to numbers
  const processedEntries = jsonData.map((entry, index) => {
    let processedEntry = {};
    for (const [key, value] of Object.entries(entry)) {
      if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
        processedEntry[key] = Number(value);
      } else {
        processedEntry[key] = value;
      }
    }
    return { processedEntry, index };
  });

  // Compute embeddings for each entry
  const chunkPromises = processedEntries.map(async ({ processedEntry, index }) => {
    //const embedding = await embeddingService.generateEmbedding(JSON.stringify(processedEntry));
    return {
      id: crypto.randomUUID(),
      class: "Json_data",
      properties: {
        ...processedEntry,
        document_id: json_global_id,
        chunk_index: index,
        file_name: receivedFileName
      }
    };
  });

  const chunks = await Promise.all(chunkPromises);
  //console.log(chunks)
  if (chunks.length > 0) {
    await documentCollection.data.insertMany(chunks);
    console.log(`Inserted ${chunks.length} JSON objects into Weaviate.`);
  } else {
    console.warn("No valid JSON objects found for insertion.");
  }
  globals.globalString1 = json_global_id
  return json_global_id;
}

async function checkAndDeleteExistingData(documentCollection, filePath) {
  try {
    // Check if the filename already exists in the collection
    const result = await documentCollection.query.fetchObjects({
      filters: documentCollection.filter.byProperty('file_name').equal(filePath),
      limit: 1, // Limit to 1 since we just need to check if data exists
    });

    if (result.objects.length > 0) {
      console.log(`Data found for filename: ${filePath}`);

      // Deleting the existing data
      await documentCollection.data.deleteMany(
        documentCollection.filter.byProperty('file_name').equal(filePath)
      );

      console.log(`Deleted already existing objects for filename: ${filePath}`);
      return true; // Indicates that data was found and deleted
    }

    console.log(`No existing data found for filename: ${filePath}`);
    return false; // Indicates no data was found
  } catch (error) {
    console.error(`Error checking or deleting data for ${filePath}:`, error);
    throw error; // Re-throw error for handling at a higher level
  }
}
async function splitTextAndStore(text, filePath, chunkSize) {


  const client = await connectToWeaviate();
  const documentCollection = client.collections.get('Final_Test_CollectionWithoutVectoriser');
  const dataDeleted = await checkAndDeleteExistingData(documentCollection, filePath);
  if (dataDeleted) {
    console.log("Old data removed, ready to insert new data.");
  } else {
    console.log("No previous data found, proceeding with insert.");
  }


  globalDocumentId = crypto.randomUUID();
  console.log(globalDocumentId)
  const numChunks = Math.ceil(text.length / chunkSize);


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
  //console.log(chunks)
  await documentCollection.data.insertMany(chunks);
  globals.globalString2 = globalDocumentId
  console.log(globals.globalString2)
  console.log(`Stored ${numChunks} chunks in Weaviate.`);
  return { globalDocumentId, chunks };
}

async function searchQuery(query, received_id) {
  const queryEmbedding = await embeddingService.generateEmbedding(query);
  const client = await connectToWeaviate();
  const documentCollection = client.collections.get('Final_Test_CollectionWithoutVectoriser');

  const result = await documentCollection.query.nearVector(queryEmbedding, {
    limit: 5,
    returnProperties: ['page_content', 'file_name', 'document_id', 'chunk_index'],
  });

  if (!result.objects) {
    return [];
  }

  const final_results = result.objects
    .map(obj => ({
      text: obj.properties.page_content,
      fileName: obj.properties.file_name,
      documentId: obj.properties.document_id,
      chunkIndex: obj.properties.chunk_index
    }))
    .filter(obj => obj.documentId === received_id);

  console.log(final_results)


  return final_results;
}

async function getJsonStatistics({ document_id, field, operation, value, group_field, ranges }) {
  if (!document_id || !field || !operation) {
    throw new Error("Missing document_id, field, or operation parameter");
  }
  const client = await connectToWeaviate();
  const documentCollection = client.collections.get('Json_data');

  const result = await documentCollection.query.fetchObjects({
    filters: documentCollection.filter.byProperty('document_id').equal(globals.globalString1),
    limit: 100
  });

  if (!result.objects.length) {
    throw new Error("No data found for the given document ID");
  }

  const numericalValues = result.objects
    .map(obj => obj.properties[field])
    .filter(val => typeof val === "number");

  if (!numericalValues.length) {
    throw new Error(`No numerical data found for field '${field}'`);
  }

  let resultValue;
  switch (operation) {
    case "max":
      resultValue = Math.max(...numericalValues);
      break;
    case "min":
      resultValue = Math.min(...numericalValues);
      break;
    case "sum":
      resultValue = numericalValues.reduce((a, b) => a + b, 0);
      break;
    case "average":
      resultValue = numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length;
      break;
    case "median":
      const sortedValues = [...numericalValues].sort((a, b) => a - b);
      const mid = Math.floor(sortedValues.length / 2);
      resultValue = sortedValues.length % 2 !== 0 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
      break;
    case "mode":
      const frequency = numericalValues.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      const maxFrequency = Math.max(...Object.values(frequency));
      resultValue = Object.keys(frequency)
        .filter(key => frequency[key] === maxFrequency)
        .map(Number);
      break;
    case "variance":
      const mean = numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length;
      resultValue = numericalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericalValues.length;
      break;
    case "std_dev":
      const variance = numericalValues.reduce((sum, val) =>
        sum + Math.pow(val - (numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length), 2)
        , 0) / numericalValues.length;
      resultValue = Math.sqrt(variance);
      break;
    case "count_above":
      resultValue = numericalValues.filter(v => v > parseFloat(value)).length;
      break;
    case "count_below":
      resultValue = numericalValues.filter(v => v < parseFloat(value)).length;
      break;
    case "count_equal":
      resultValue = numericalValues.filter(v => v === parseFloat(value)).length;
      break;
    case "group_by":
      if (!group_field) {
        throw new Error("Missing group_field parameter.");
      }
      resultValue = result.objects.reduce((acc, obj) => {
        const key = obj.properties[group_field];
        if (key !== undefined) {
          if (!acc[key]) acc[key] = [];
          acc[key].push(obj.properties[field]);
        }
        return acc;
      }, {});
      break;
    case "bucket":
      if (!ranges) {
        throw new Error("Missing ranges parameter.");
      }
      const parsedRanges = JSON.parse(ranges);
      resultValue = parsedRanges.map((range, i) => ({
        range: i === parsedRanges.length - 1 ? `${range}+` : `${range}-${parsedRanges[i + 1]}`,
        count: numericalValues.filter(v => v >= range && (i === parsedRanges.length - 1 || v < parsedRanges[i + 1])).length
      }));
      break;
    case "most_common":
      const textFrequency = result.objects.reduce((acc, obj) => {
        const val = obj.properties[field];
        if (val) acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      const maxTextFrequency = Math.max(...Object.values(textFrequency));
      resultValue = Object.keys(textFrequency)
        .filter(key => textFrequency[key] === maxTextFrequency);
      break;
    case "unique_count":
      const uniqueValues = new Set(result.objects.map(obj => obj.properties[field]));
      resultValue = uniqueValues.size;
      break;
    default:
      throw new Error("Invalid operation.");
  }
  return { document_id, field, operation, result: resultValue };
}

module.exports = {
  connectToWeaviate,
  storeJSONInWeaviate,
  splitTextAndStore,
  searchQuery,
  getJsonStatistics
};
