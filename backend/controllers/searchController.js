// controllers/searchController.js
const weaviateService = require('../services/weaviateService');
const globals = require('../global.js');

exports.searchText = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    // Perform the search in Weaviate
    const results = await weaviateService.searchQuery(query,globals.globalString2);
    res.json(results);
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: error.message });
  }
};
