// app.js
const express = require('express');
const cors = require('cors');
const app = express();
const config = require('./config');

// Import route modules
const fileRoutes = require('./routes/fileRoutes');
const jsonRoutes = require('./routes/jsonRoutes');
const searchRoutes = require('./routes/searchRoutes');

// app.use(cors({
//   origin: 'https://rag-bakend-assignment-deploy-1.onrender.com',
//   methods: 'GET,POST',
//   allowedHeaders: 'Content-Type',
// }));

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is connected to Frontend!' });
});

// Mount our routes
app.use('/', fileRoutes);
app.use('/', jsonRoutes);
app.use('/', searchRoutes);

// Default route
app.get('/', (req, res) => {
  res.send("API Working");
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
