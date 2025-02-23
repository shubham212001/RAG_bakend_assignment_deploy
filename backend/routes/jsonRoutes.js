// routes/jsonRoutes.js
const express = require('express');
const router = express.Router();
const jsonController = require('../controllers/jsonController');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept JSON files (based on mimetype or file extension)
    if (file.mimetype === "application/json" || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JSON is allowed."));
    }
  }
});

router.post('/json_upload', upload.single('document'), jsonController.uploadJSON);
router.get('/json_stats', jsonController.getJsonStats);

module.exports = router;
