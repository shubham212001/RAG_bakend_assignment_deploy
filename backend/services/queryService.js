const embeddingService = require('./embeddingService');
const { connectToWeaviate } = require('./weaviateClient');
const globals = require('../global.js');

async function searchQuery(query, received_id) {
    console.log("reached here")
    console.log(query)
    console.log(received_id)
  const queryEmbedding = await embeddingService.generateEmbedding(query);
  const client = await connectToWeaviate();
  const documentCollection = client.collections.get('Rahul_Shukla');

  const result = await documentCollection.query.nearVector(queryEmbedding, {
    limit: 3,
    returnProperties: ['page_content', 'file_name', 'document_id', 'chunk_index'],
  });

  if (!result.objects) return [];

  const final_results= result.objects
    .map(obj => ({
      text: obj.properties.page_content,
      fileName: obj.properties.file_name,
      documentId: obj.properties.document_id,
      chunkIndex: obj.properties.chunk_index
    }))
    .filter(obj => obj.documentId === received_id);
    console.log(final_results)
    return final_results
}


async function getJsonStatistics({ document_id, field, operation, value, group_field, ranges }) {
  if (!document_id || !field || !operation) {
      throw new Error("Missing document_id, field, or operation parameter");
  }

  const client = await connectToWeaviate();
  const documentCollection = client.collections.get('Json_data');

  const result = await documentCollection.query.fetchObjects({
      filters: documentCollection.filter.byProperty('document_id').equal(document_id),
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
          resultValue = Object.keys(frequency).filter(key => frequency[key] === maxFrequency).map(Number);
          break;
      case "variance":
          const mean = numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length;
          resultValue = numericalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericalValues.length;
          break;
      case "std_dev":
          resultValue = Math.sqrt(numericalValues.reduce((sum, val) => sum + Math.pow(val - (numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length), 2), 0) / numericalValues.length);
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
          resultValue = Object.keys(textFrequency).filter(key => textFrequency[key] === maxTextFrequency);
          break;
      case "unique_count":
          resultValue = new Set(result.objects.map(obj => obj.properties[field])).size;
          break;
      default:
          throw new Error("Invalid operation.");
  }

  console.log(`Operation: ${operation}, Result:`, resultValue);
  return { document_id, field, operation, result: resultValue };
}


module.exports = {
  searchQuery,
  getJsonStatistics,
};