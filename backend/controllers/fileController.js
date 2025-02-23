// controllers/fileController.js
const fileService = require('../services/fileService');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Process the file and store its chunks in Weaviate
    const result = await fileService.processAndStoreFile(req.file);

    res.json({
      message: 'File processed successfully',
      globaldocumentId: result.globaldocumentId,
      fileName: req.file.originalname,
      extractedText: result.previewText,
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: error.message });
  }
};
