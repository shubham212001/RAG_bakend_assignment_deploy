// services/weaviateService.js
const weaviate = require('weaviate-client').default;
const crypto = require('crypto');
const config = require('../config');
const embeddingService = require('./embeddingService');
const globals = require('../global.js');
const { storeJSONInWeaviate, splitTextAndStore } = require('./uploadService');
const { searchQuery, getJsonStatistics } = require('./queryService');

module.exports = {
  storeJSONInWeaviate,
  splitTextAndStore,
  searchQuery,
  getJsonStatistics
};
