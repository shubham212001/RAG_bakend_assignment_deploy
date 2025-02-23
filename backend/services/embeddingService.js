// services/embeddingService.js
const { Configuration, OpenAIApi } = require("openai");
const config = require('../config');

const configuration = new Configuration({
  apiKey: config.openAiKey,
});
const openai = new OpenAIApi(configuration);

async function generateEmbedding(text) {
  const response = await openai.createEmbedding({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data.data[0].embedding;
}

module.exports = { generateEmbedding };
