// controllers/jsonController.js
const weaviateService = require('../services/weaviateService');

exports.uploadJSON = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const rawData = req.file.buffer.toString();
    let jsonData;
    try {
      jsonData = JSON.parse(rawData);
    } catch (err) {
      return res.status(400).json({ error: "Invalid JSON format: " + err.message });
    }
    if (!Array.isArray(jsonData)) {
      return res.status(400).json({ error: "Invalid JSON data: Expected an array." });
    }

    const json_global_id = await weaviateService.storeJSONInWeaviate(jsonData, req.file.originalname);

    res.json({
      message: 'JSON Uploaded successfully',
      json_global_id,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("Error processing JSON:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getJsonStats = async (req, res) => {
  try {
    // Pass the query parameters (document_id, field, operation, etc.)
    const stats = await weaviateService.getJsonStatistics(req.query);
    res.json(stats);
  } catch (error) {
    console.error("Error processing JSON statistics:", error);
    res.status(500).json({ error: error.message });
  }
};
