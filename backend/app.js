// app.js
const express = require('express');
const cors = require('cors');
const app = express();
const config = require('./config');


// Import route modules
const fileRoutes = require('./routes/fileRoutes');
const jsonRoutes = require('./routes/jsonRoutes');
const searchRoutes = require('./routes/searchRoutes');
// https://rag-bakend-assignment-deploy-1-77cf.onrender.com
app.use(cors({
  origin: 'https://rag-bakend-assignment-deploy-1-77cf.onrender.com',
  methods: 'GET, POST',
  allowedHeaders: 'Content-Type'
}));

// Middleware for JSON body parsing
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is connected to Frontend!' });
});

// Mount routes under namespaced paths to avoid conflicts
app.use('/api/files', fileRoutes);
app.use('/api/json', jsonRoutes);
app.use('/api/search', searchRoutes);

// Default route
app.get('/', (req, res) => {
  res.send("API Working");
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
