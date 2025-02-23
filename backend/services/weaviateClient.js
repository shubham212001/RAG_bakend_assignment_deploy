const weaviate = require('weaviate-client').default;
const config = require('../config');

async function connectToWeaviate() {
  return await weaviate.connectToWeaviateCloud(config.wcdUrl, {
    authCredentials: new weaviate.ApiKey(config.wcdApiKey),
    grpcHost: config.wcdUrl,
    secure: false,
  });
}

module.exports = { connectToWeaviate };