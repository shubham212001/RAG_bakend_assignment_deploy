import React, { useState } from 'react';
import axios from 'axios';

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import JsonQuery from './JsonQuery';  // Import the new page

function App() {


  const [isUploaded, setIsUploaded] = useState(false); // Tracks if file is uploaded
  const [isLoading, setIsLoading] = useState(false); // ✅ Track loading state


  const checkConnection = async () => {
    try {
      const res = await fetch('https://rag-bakend-assignment-deploy.onrender.com/test');
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      alert('Failed to connect to backend: ' + error.message);
    }
  };

  //Testing ends here 
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };


const handleUpload = async () => {

  if (!selectedFile) {
    alert('Please select a file.');
    return;
  }

  setIsLoading(true); // ✅ Start loading

  const formData = new FormData();
  formData.append('document', selectedFile);

  try {
    const res = await fetch('https://rag-bakend-assignment-deploy.onrender.com/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log('Server Response:', data);

    if (res.ok) {  
      setIsUploaded(true);  // ✅ Enable query feature
    } else {
      setIsUploaded(false);
    }
  } catch (error) {
    setIsUploaded(false);
  } finally {
    setIsLoading(false); // ✅ Stop loading when response is received
  }
};

  const [isQuerying, setIsQuerying] = useState(false); // ✅ Track query loading state

const handleQuery = async () => {
  if (!isUploaded) {
    alert('Please upload a file before sending a query.');
    return;
  }

  if (!query) {
    alert('Please enter a query.');
    return;
  }

  setIsQuerying(true); // ✅ Start loading

  try {
    const res = await fetch('https://rag-bakend-assignment-deploy.onrender.com/api/search/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setResults(data);
  } catch (error) {
    console.error('Query failed: ', error.message);
  } finally {
    setIsQuerying(false); // ✅ Stop loading when response is received
  }
};

  

  return (
    <div style={{ margin: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Document Upload & Query</h1>
      <button onClick={checkConnection} style={{ marginBottom: '20px', padding: '8px 16px' }}>
        Check Backend Connection
      </button>

      
      {/* Document Upload Section */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Upload Document</h2>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.docx,.json,.txt"
        />
        <button onClick={handleUpload} disabled={isLoading} style={{ marginLeft: '10px', padding: '8px 16px' }}>
  {isLoading ? 'Uploading...' : 'Upload'}
</button>

        <p>{uploadStatus}</p>
      </section>

      {/* Query Section */}
      <section>
        <h2>Ask a Query</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query here"
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        />
        <button onClick={handleQuery} disabled={isQuerying || !isUploaded} style={{ marginTop: '10px', padding: '8px 16px' }}>
  {isQuerying ? 'Processing...' : 'Send Query'}
</button>

        <div style={{ marginTop: '20px' }}>
          <h3>Results:</h3>
          {results.length > 0 ? (
            results.map((item, index) => (
              <div key={index} style={{ borderBottom: '1px solid #ccc', marginBottom: '10px' }}>
                <p><strong>Snippet:</strong> {item.text}</p>
                <p><em>Document ID:</em> {item.documentId}</p>
                <p><em>File Name:</em> {item.fileName}</p>
                <p><em>Chunk Index:</em> {item.chunkIndex}</p>

              </div>
            ))
          ) : (
            <p>No results yet.</p>
          )}
        </div>
      </section>
    </div>
    
  );
}

export default App;