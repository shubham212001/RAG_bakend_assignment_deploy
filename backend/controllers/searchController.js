// controllers/searchController.js
const weaviateService = require('../services/weaviateService');
const globals = require('../global.js');

// exports.searchText = async (req, res) => {
//   try {
//     const { query } = req.body;
//     if (!query) {
//       return res.status(400).json({ error: 'Query parameter is required' });
//     }
//     // Perform the search in Weaviate
//     const results = await weaviateService.searchQuery(query,globals.globalString2);
//     res.json(results);
//   } catch (error) {
//     console.error('Error in search:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.searchText = async (req, res) => {
//   try {
//     const { query, globaldocumentId } = req.body;  // Extract both parameters

//     if (!query || !globaldocumentId) {
//       return res.status(400).json({ error: "Both query and globaldocumentId are required" });
//     }
  
//     // Perform the search in Weaviate using both parameters
//     const results = await weaviateService.searchQuery(query, globaldocumentId);

//     res.json(results);
//   } catch (error) {
//     console.error("Error in search:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

exports.searchText = async (req, res) => {
  try {
    const { query, globaldocumentId } = req.body;  // Extract parameters

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    // Determine which global document ID to use
    const documentIdToUse = globaldocumentId || globals.globalString2;

    // Perform the search in Weaviate using the correct document ID
    const results = await weaviateService.searchQuery(query, documentIdToUse);

    res.json(results);
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ error: error.message });
  }
};
