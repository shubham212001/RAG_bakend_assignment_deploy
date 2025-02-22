const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { OpenAI } = require("openai");

const pdfParse = require('pdf-parse');
const weaviate = require('weaviate-client').default;
const vectorizer = require('weaviate-client').vectorizer;
const configure=require('weaviate-client').configure;
const { OpenAIEmbeddings } = require("@langchain/openai");
const crypto = require('crypto'); // Required for generating UUID


const app = express();
const port = 4000; // or your preferred port


const wcdUrl = process.env.REACT_APP_WCD_URL
const wcdApiKey = process.env.REACT_APP_WCD_API_KEY
const openAiKey = process.env.REACT_APP_OPENAI_KEY

const temp=process.env.wc

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type',
}));
app.use(express.json());

// Test route to check backend connectivity
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is connected to Frontend!' });
});

globaldocumentId="";
json_global_id=""

async function storeJSONInWeaviate(jsonData, received_file_name) {
  try {
      if (!Array.isArray(jsonData)) {
          throw new Error("Invalid JSON data: Expected an array.");
      }

      json_global_id = crypto.randomUUID();
      console.log("Global Document ID:", json_global_id);

      const client = await weaviate.connectToWeaviateCloud(wcdUrl, {
          authCredentials: new weaviate.ApiKey(wcdApiKey),
          grpcHost: wcdUrl, 
          secure: false,
      });

      let documentCollection = client.collections.get('Json_data');

      // Convert numeric strings to actual numbers
      const processedEntries = jsonData.map((entry, index) => {
          let processedEntry = {};
          for (const [key, value] of Object.entries(entry)) {
              if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
                  processedEntry[key] = Number(value); // Convert numeric string to number
              } else {
                  processedEntry[key] = value; // Keep other values unchanged
              }
          }

          return { processedEntry, index };
      });

      // Generate embeddings in parallel
      const chunkPromises = processedEntries.map(async ({ processedEntry, index }) => {
          const embedding = await generateEmbedding(JSON.stringify(processedEntry));

          return {
              id: crypto.randomUUID(),
              class: "Json_data",
              properties: {
                  ...processedEntry,
                  document_id: json_global_id,
                  chunk_index: index,
                  file_name: received_file_name
              },
              vectors: embedding  // Store embedding directly in Weaviate
          };
      });

      // Wait for all embedding computations to complete
      const chunks = await Promise.all(chunkPromises);

      // Batch insert all processed objects at once
      if (chunks.length > 0) {
          await documentCollection.data.insertMany(chunks);
          console.log(`Inserted ${chunks.length} JSON objects into Weaviate.`);
      } else {
          console.warn("No valid JSON objects found for insertion.");
      }
      
  } catch (error) {
      console.error("Error storing JSON in Weaviate:", error);
  }
}

async function splitTextAndStore(text, filePath, chunkSize) {
  globaldocumentId = crypto.randomUUID();
  const numChunks = Math.ceil(text.length / chunkSize);
  console.log(globaldocumentId)
  const client = await weaviate.connectToWeaviateCloud(wcdUrl, {
    authCredentials: new weaviate.ApiKey(wcdApiKey),
    grpcHost: wcdUrl, 
    secure: false,
  });

  let documentCollection = client.collections.get('Final_Test_CollectionWithoutVectoriser');

  // Create chunks in parallel
  const chunkPromises = [];
  
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunkText = text.slice(i, i + chunkSize);

    chunkPromises.push(
      (async () => {
        const embedding = await generateEmbedding(chunkText); // Generate embedding in parallel
        return {
          id: crypto.randomUUID(),
          class: "Final_Test_CollectionWithoutVectoriser",
          properties: {
            page_content: chunkText,
            file_name: filePath,
            document_id: globaldocumentId,
            chunk_index: i / chunkSize
          },
          vectors: embedding
        };
      })()
    );
  }

  // Wait for all embeddings to be generated
  const chunks = await Promise.all(chunkPromises);

  // Batch insert
  await documentCollection.data.insertMany(chunks);

  console.log(`Stored ${numChunks} chunks in Weaviate.`);
  return { globaldocumentId, chunks };
}


async function searchQuery(query,globaldocumentId) {
  console.log(globaldocumentId);
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Connect to Weaviate
    const client = await weaviate.connectToWeaviateCloud(wcdUrl, {
      authCredentials: new weaviate.ApiKey(wcdApiKey),
      grpcHost: wcdUrl,
      secure: false,
      headers: {
        'X-OpenAI-Api-Key': openAiKey,
      }
    });

    const documentCollection = client.collections.get('Final_Test_CollectionWithoutVectoriser');
    
    // Perform the search
    const result = await documentCollection.query.nearVector(queryEmbedding, {
      limit: 5, // Adjust based on your needs
      returnProperties: ['page_content', 'file_name', 'document_id', 'chunk_index'],
    });

    if (!result.objects) {
      return [];
    }

    const formattedResults = result.objects
    .map(obj => ({
      text: obj.properties.page_content,
      fileName: obj.properties.file_name,
      documentId: obj.properties.document_id,
      chunkIndex: obj.properties.chunk_index
    }))
    .filter(obj => obj.documentId === globaldocumentId); // ✅ Filter by documentId
    return formattedResults;
  } catch (error) {
    console.error("Error in searchQuery:", error);
    return [];
  }
}

async function connectToWeaviate() {


  try {
    const client = await weaviate.connectToWeaviateCloud(
      wcdUrl, // Replace with your Weaviate Cloud URL
      {
        authCredentials: new weaviate.ApiKey(wcdApiKey), // Replace with your Weaviate Cloud API key
      }
    );
    console.log('Connected to Weaviate!');
    const clientReadiness = await client.isReady();
    console.log(clientReadiness); // Should return `true`


    try {
      await client.collections.create({
        name: "Question",
        vectorizer: "text2vec-cohere", // Correctly define vectorizer
        generative: { provider: "cohere" }, // Define generative AI provider
      });
      console.log("Collection 'Question' created successfully!");
    } catch {
      console.log("Collection 'Question' already exists!");
    }

  } catch (error) {
    console.error('Error connecting to Weaviate:', error);
  }

}
const multer = require("multer");
const mammoth = require("mammoth");
const fs = require("fs");
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOCX, and TXT are allowed."));
    }
  }
});


const { Configuration, OpenAIApi } = require("openai");
const { json } = require('stream/consumers');
const configuration = new Configuration({
  apiKey: openAiKey, // Ensure your API key is set in the environment variables
});


const openai = new OpenAIApi(configuration);
async function generateEmbedding(text) {
  const response = await openai.createEmbedding({
    model: "text-embedding-3-small", // Specify the embedding model
    input: text,
  });
  return response.data.data[0].embedding; // Returns the embedding vector
}

app.post('/upload', upload.single('document'), async (req, res) => {
  console.log(openAiKey)
  
  client = await weaviate.connectToWeaviateCloud(wcdUrl, {
    authCredentials: new weaviate.ApiKey(wcdApiKey),
    grpcHost: wcdUrl,
    secure: false,
  });
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Received file:', req.file.originalname); // Debugging: Check file name
    let extractedText = "";

    // Check that buffer is received correctly
    if (!req.file.buffer) {
      throw new Error("File buffer is undefined");
    }

    const fileType = req.file.mimetype;

    if (fileType === "application/pdf") {
      // Handle PDF extraction
      const pdfBuffer = Buffer.from(req.file.buffer);
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
    
    } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Handle DOCX extraction
      const docxBuffer = Buffer.from(req.file.buffer);
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      extractedText = result.value;
    
    } else if (fileType === "text/plain") {
      // Handle TXT extraction
      extractedText = req.file.buffer.toString("utf-8");
    
    } else {
      throw new Error("Unsupported file type");
    }

    
  const documentCollection = client.collections.get('Final_Test_CollectionWithoutVectoriser');

    // Check if the filename already exists in the collection
    const result = await documentCollection.query.fetchObjects({
      filters: documentCollection.filter.byProperty('file_name').equal(req.file.originalname),
      limit: 1, // Limit to 1 since we just need to check if data exists
    });
    
    data_found=0
    if (result.objects.length > 0) {
      data_found=1
      console.log(`Data found for filename: your_filename_here`);
    }
    
    if(data_found==1){
      //Deleting the data
      const response = await documentCollection.data.deleteMany(
        documentCollection.filter.byProperty('file_name').equal(req.file.originalname)
      );
      console.log(`Deleted already existing objects`);
    }
      //Now uploadind the data
      await splitTextAndStore(extractedText, req.file.originalname, 500); 
      //console.log(extractedText);

    console.log("Finally connected to Weaviate!");

    res.json({
      message: 'PDF processed successfully',
      globaldocumentId: globaldocumentId, // ✅ Send globaldocumentId
      fileName: req.file.originalname,
      extractedText: extractedText.substring(0, 400) // Optional: Send only a part of the text for preview
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: error.message });
  }
});


app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    console.log('Received query:', query);
    console.log("12345678");
    // Call searchQuery function and get results
    const results = await searchQuery(query,globaldocumentId);
    console.log('Search results)', results);
    // Send results back
    res.json(results);
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/json_stats', async (req, res) => {
  const client = await weaviate.connectToWeaviateCloud(wcdUrl, {
    authCredentials: new weaviate.ApiKey(wcdApiKey),
    grpcHost: wcdUrl,
    secure: false,
    headers: {
      'X-OpenAI-Api-Key': openAiKey,
    }
  });

  try {
      const { document_id, field, operation, value, group_field, ranges } = req.query;
      
      if (!document_id || !field || !operation) {
          return res.status(400).json({ error: "Missing document_id, field, or operation parameter" });
      }

      const documentCollection = client.collections.get('Json_data');

      const result = await documentCollection.query.fetchObjects({
          filters: documentCollection.filter.byProperty('document_id').equal(document_id),
          limit: 100
      });

      if (!result.objects.length) {
          return res.status(404).json({ error: "No data found for the given document ID" });
      }

      // Extract numerical values
      const numericalValues = result.objects
          .map(obj => obj.properties[field])
          .filter(value => typeof value === "number");

      if (!numericalValues.length) {
          return res.status(400).json({ error: `No numerical data found for field '${field}'` });
      }

      let resultValue;

      switch (operation) {
          case "max":
              resultValue = Math.max(...numericalValues);
              break;
          case "min":
              resultValue = Math.min(...numericalValues);
              break;
          case "sum":
              resultValue = numericalValues.reduce((a, b) => a + b, 0);
              break;
          case "average":
              resultValue = numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length;
              break;
          case "median":
              const sortedValues = [...numericalValues].sort((a, b) => a - b);
              const mid = Math.floor(sortedValues.length / 2);
              resultValue = sortedValues.length % 2 !== 0
                  ? sortedValues[mid]
                  : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
              break;
          case "mode":
              const frequency = numericalValues.reduce((acc, val) => {
                  acc[val] = (acc[val] || 0) + 1;
                  return acc;
              }, {});
              const maxFrequency = Math.max(...Object.values(frequency));
              resultValue = Object.keys(frequency)
                  .filter(key => frequency[key] === maxFrequency)
                  .map(Number); // Ensure it's returned as a number
              break;
          case "variance":
              const mean = numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length;
              resultValue = numericalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericalValues.length;
              break;
          case "std_dev":
              const variance = numericalValues.reduce((sum, val) => sum + Math.pow(val - (numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length), 2), 0) / numericalValues.length;
              resultValue = Math.sqrt(variance);
              break;
          case "count_above":
              resultValue = numericalValues.filter(v => v > parseFloat(value)).length;
              break;
          case "count_below":
              resultValue = numericalValues.filter(v => v < parseFloat(value)).length;
              break;
          case "count_equal":
              resultValue = numericalValues.filter(v => v === parseFloat(value)).length;
              break;
          case "group_by":
              if (!group_field) {
                  return res.status(400).json({ error: "Missing group_field parameter." });
              }
              resultValue = result.objects.reduce((acc, obj) => {
                  const key = obj.properties[group_field];
                  if (key !== undefined) {
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(obj.properties[field]);
                  }
                  return acc;
              }, {});
              break;
          case "bucket":
              if (!ranges) {
                  return res.status(400).json({ error: "Missing ranges parameter." });
              }
              const parsedRanges = JSON.parse(ranges);
              resultValue = parsedRanges.map((range, i) => ({
                  range: i === parsedRanges.length - 1 ? `${range}+` : `${range}-${parsedRanges[i + 1]}`,
                  count: numericalValues.filter(v => v >= range && (i === parsedRanges.length - 1 || v < parsedRanges[i + 1])).length
              }));
              break;
          case "most_common":
              const textFrequency = result.objects.reduce((acc, obj) => {
                  const val = obj.properties[field];
                  if (val) acc[val] = (acc[val] || 0) + 1;
                  return acc;
              }, {});
              const maxTextFrequency = Math.max(...Object.values(textFrequency));
              resultValue = Object.keys(textFrequency)
                  .filter(key => textFrequency[key] === maxTextFrequency);
              break;
          case "unique_count":
              const uniqueValues = new Set(result.objects.map(obj => obj.properties[field]));
              resultValue = uniqueValues.size;
              break;
          default:
              return res.status(400).json({ error: "Invalid operation." });
      }

      console.log(`Operation: ${operation}, Result:`, resultValue);
      return res.json({ document_id, field, operation, result: resultValue });

  } catch (error) {
      console.error("Error processing JSON statistics:", error);
      res.status(500).json({ error: error.message });
  }
});

connectToWeaviate();


app.post('/json_upload', upload.single('document'), async (req, res) => {
  const client = await weaviate.connectToWeaviateCloud(wcdUrl, {
    authCredentials: new weaviate.ApiKey(wcdApiKey),
    grpcHost: wcdUrl, 
    secure: false,
  });

  try {
      const rawData = req.file.buffer.toString();  // Convert buffer to string
      let jsonData;
      
      // Ensure proper JSON parsing
      try {
          jsonData = JSON.parse(rawData);
      } catch (err) {
          return res.status(400).json({ error: "Invalid JSON format: " + err.message });
      }

      console.log("Is jsonData an array?", Array.isArray(jsonData));
      
      if (!Array.isArray(jsonData)) {
          return res.status(400).json({ error: "Invalid JSON data: Expected an array." });
      }

      const documentCollection = client.collections.get('Json_data');

      if (!documentCollection) {
          console.warn("Collection 'Json_data' not found. Skipping deletion step.");
      } else {
          // Check if the filename already exists in the collection
          const result = await documentCollection.query.fetchObjects({
              filters: documentCollection.filter.byProperty('file_name').equal(req.file.originalname),
              limit: 1, // Limit to 1 since we just need to check if data exists
          });

          if (result.objects.length > 0) {
              console.log(`Data found for filename: ${req.file.originalname}`);
              
              try {
                  // Deleting the data
                  await documentCollection.data.deleteMany(
                      documentCollection.filter.byProperty('file_name').equal(req.file.originalname)
                  );
                  console.log(`Deleted already existing objects`);
              } catch (deleteError) {
                  console.error("Error deleting existing objects:", deleteError);
                  return res.status(500).json({ error: "Failed to delete existing data before insertion." });
              }
          }
      }

      await storeJSONInWeaviate(jsonData, req.file.originalname);

      return res.json({
          message: 'JSON Uploaded successfully',
          json_global_id: json_global_id, // ✅ Send globaldocumentId
          fileName: req.file.originalname, 
      });

  } catch (error) {
      console.error("Error processing JSON:", error);
      return res.status(500).json({ error: error.message });
  }
});


app.get("/", (req, res) => {
  res.send("API Working")
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});












